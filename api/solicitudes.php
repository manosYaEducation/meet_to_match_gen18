
<?php
require_once __DIR__ . '/../adm/api/db.php';
require_once __DIR__ . '/../adm/api/mail.php';

$method = $_SERVER['REQUEST_METHOD'];

function enteroPositivo($valor)
{
    $numero = filter_var($valor, FILTER_VALIDATE_INT);

    return $numero !== false && $numero > 0
        ? (int)$numero
        : null;
}

function descripcionBloque($inicio, $fin)
{
    if (!$inicio || !$fin) {
        return null;
    }

    $desde = new DateTimeImmutable($inicio);
    $hasta = new DateTimeImmutable($fin);

    return $desde->format('d-m-Y H:i') . ' - ' . $hasta->format('H:i');
}

try {

    /*
     * API pública:
     *
     * POST /api/solicitudes.php
     *
     * No se exponen GET, PUT, PATCH ni DELETE.
     */
    if ($method !== 'POST') {
        responder([
            'exito' => false,
            'mensaje' => 'Metodo no soportado'
        ], 405);
    }

    $data = leerJson();

    /*
     * El correo es la única forma en que el visitante declara
     * quién es.
     *
     * IMPORTANTE:
     * El frontend nunca envía solicitante_id.
     */
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $receptorId = enteroPositivo($data['receptor_id'] ?? null);
    $bloqueId = enteroPositivo($data['bloque_horario_id'] ?? null);
    $mensaje = trim((string)($data['mensaje'] ?? ''));

    /*
     * Validaciones básicas.
     */
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        /*
         * No entregamos información sobre si el correo existe.
         */
        responder([
            'exito' => true,
            'mensaje' => 'Si los datos corresponden a un participante autorizado, tu solicitud será procesada.'
        ]);
    }

    if (!$receptorId || !$bloqueId) {
        responder([
            'exito' => false,
            'mensaje' => 'Faltan datos para procesar la solicitud'
        ], 400);
    }

    /*
     * Limitar el mensaje evita cargas innecesariamente grandes.
     */
    $mensaje = mb_substr($mensaje, 0, 2000);

    /*
     * La respuesta pública para un correo no registrado debe ser
     * indistinguible de una solicitud procesada.
     *
     * Primero resolvemos internamente el participante.
     */
    $stmtSolicitante = $conn->prepare("
        SELECT id
        FROM usuarios
        WHERE correo = ?
        LIMIT 1
    ");

    $stmtSolicitante->execute([$email]);
    $solicitante = $stmtSolicitante->fetch();

    if (!$solicitante) {
        /*
         * No revelar que el correo no está registrado.
         *
         * Tampoco se crea una solicitud ni se envía correo.
         */
        responder([
            'exito' => true,
            'mensaje' => 'Si los datos corresponden a un participante autorizado, tu solicitud será procesada.'
        ]);
    }

    $solicitanteId = (int)$solicitante['id'];

    /*
     * Evitar solicitar una reunión consigo mismo.
     *
     * Esto no revela información sensible porque el receptor_id
     * pertenece al perfil público que el usuario ya está viendo.
     */
    if ($solicitanteId === $receptorId) {
        responder([
            'exito' => false,
            'mensaje' => 'No puedes solicitar una reunion contigo mismo'
        ], 400);
    }

    /*
     * Desde aquí comienza la operación crítica.
     *
     * La disponibilidad mostrada por horarios.php NO es una garantía.
     * Volvemos a comprobar todo dentro de una transacción.
     */
    $conn->beginTransaction();

    /*
     * Bloquear los usuarios involucrados mientras validamos la operación.
     *
     * Esto evita que otra operación concurrente modifique la información
     * relevante mientras estamos procesando la solicitud.
     */
    $stmtUsuarios = $conn->prepare("
        SELECT id
        FROM usuarios
        WHERE id IN (?, ?)
        ORDER BY id
        FOR UPDATE
    ");

    $stmtUsuarios->execute([
        $solicitanteId,
        $receptorId
    ]);

    $usuarios = $stmtUsuarios->fetchAll();

    if (count($usuarios) !== 2) {
        $conn->rollBack();

        responder([
            'exito' => false,
            'mensaje' => 'No se pudo procesar la solicitud'
        ], 404);
    }

    /*
     * El bloque debe existir y estar activo.
     *
     * FOR UPDATE evita que otro proceso modifique el bloque
     * simultáneamente durante esta operación.
     */
    $stmtBloque = $conn->prepare("
        SELECT
            id,
            evento_id,
            inicio,
            fin,
            etiqueta,
            activo
        FROM bloques_horarios
        WHERE id = ?
          AND activo = 1
        FOR UPDATE
    ");

    $stmtBloque->execute([$bloqueId]);

    $bloque = $stmtBloque->fetch();

    if (!$bloque) {
        $conn->rollBack();

        responder([
            'exito' => false,
            'mensaje' => 'El bloque horario no existe o no esta disponible'
        ], 409);
    }

    /*
     * Verificar conflictos.
     *
     * Una reunión aceptada ocupa el horario si existe solapamiento:
     *
     * ocupado.inicio < bloque.fin
     * AND ocupado.fin > bloque.inicio
     *
     * Se comprueba tanto para solicitante como para receptor.
     */
    $stmtConflicto = $conn->prepare("
        SELECT s.id
        FROM solicitudes_reunion s
        JOIN bloques_horarios ocupado
            ON ocupado.id = s.bloque_horario_id
        WHERE s.estado = 'Aceptada'
          AND ocupado.inicio < ?
          AND ocupado.fin > ?
          AND (
              s.solicitante_id IN (?, ?)
              OR s.receptor_id IN (?, ?)
          )
        LIMIT 1
    ");

    $stmtConflicto->execute([
        $bloque['fin'],
        $bloque['inicio'],
        $solicitanteId,
        $receptorId,
        $solicitanteId,
        $receptorId
    ]);

    if ($stmtConflicto->fetch()) {
        $conn->rollBack();

        responder([
            'exito' => false,
            'mensaje' => 'Una de las personas ya tiene una reunion aceptada en este horario'
        ], 409);
    }

    /*
     * Evitar solicitudes pendientes duplicadas.
     */
    $stmtCheck = $conn->prepare("
        SELECT id
        FROM solicitudes_reunion
        WHERE solicitante_id = ?
          AND receptor_id = ?
          AND bloque_horario_id = ?
          AND estado = 'Pendiente'
        LIMIT 1
    ");

    $stmtCheck->execute([
        $solicitanteId,
        $receptorId,
        $bloqueId
    ]);

    if ($stmtCheck->fetch()) {
        $conn->rollBack();

        responder([
            'exito' => false,
            'mensaje' => 'Ya existe una solicitud pendiente con esta persona'
        ], 409);
    }

    /*
     * Crear la solicitud.
     *
     * El solicitante_id utilizado aquí fue obtenido por el backend
     * a partir del correo. Nunca proviene del navegador.
     */
    $descripcionHorario = descripcionBloque(
        $bloque['inicio'],
        $bloque['fin']
    );

    $stmt = $conn->prepare("
        INSERT INTO solicitudes_reunion (
            solicitante_id,
            receptor_id,
            bloque_horario_id,
            mensaje,
            disponibilidad_sugerida,
            estado
        )
        VALUES (?, ?, ?, ?, ?, 'Pendiente')
    ");

    $stmt->execute([
        $solicitanteId,
        $receptorId,
        $bloqueId,
        $mensaje,
        $descripcionHorario
    ]);

    $solicitudId = (int)$conn->lastInsertId();

    /*
     * La solicitud ya está registrada en BD.
     */
    $conn->commit();

    /*
     * El envío de correo ocurre después del COMMIT.
     *
     * Si el correo falla, no debemos deshacer la solicitud:
     * la solicitud real pertenece a la BD.
     */
    try {
        enviarCorreoSolicitudReunion($conn, $solicitudId);
    } catch (Throwable $mailError) {
        /*
         * Registrar el error en el servidor sin exponerlo
         * al visitante.
         */
        error_log(
            '[API PUBLICA solicitudes.php][MAIL] '
            . $mailError->getMessage()
        );
    }

    /*
     * IMPORTANTE:
     *
     * No devolvemos:
     * - solicitud_id
     * - correo
     * - resultado del envío
     * - solicitante_id
     *
     * Así el endpoint no se convierte en una herramienta
     * de enumeración o descubrimiento de información interna.
     */
    responder([
        'exito' => true,
        'mensaje' => 'Si los datos corresponden a un participante autorizado, tu solicitud será procesada.'
    ]);

} catch (Throwable $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    /*
     * El detalle técnico queda solamente en el servidor.
     */
    error_log(
        '[API PUBLICA solicitudes.php] '
        . $e->getMessage()
    );

    responder([
        'exito' => false,
        'mensaje' => 'Error interno del servidor'
    ], 500);
}

