<?php

require_once __DIR__ . '/../adm/api/db.php';
require_once __DIR__ . '/../adm/api/mail.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

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
     * =========================================================
     * ACEPTAR / RECHAZAR SOLICITUD
     * =========================================================
     *
     * PUT /api/solicitudes.php
     *
     * {
     *     "solicitud_id": 123,
     *     "accion": "aceptar"
     * }
     *
     * o
     *
     * {
     *     "solicitud_id": 123,
     *     "accion": "rechazar"
     * }
     *
     * Solo el receptor de la solicitud puede decidir.
     */
    if ($method === 'PUT') {

        if (empty($_SESSION['usuario_id'])) {
            responder([
                'exito' => false,
                'mensaje' => 'Debes tener una sesion activa'
            ], 401);
        }

        $usuarioId = (int)$_SESSION['usuario_id'];

        $data = leerJson();

        $solicitudId = enteroPositivo(
            $data['solicitud_id'] ?? null
        );

        $accion = strtolower(
            trim((string)($data['accion'] ?? ''))
        );

        if (!$solicitudId) {
            responder([
                'exito' => false,
                'mensaje' => 'Falta la solicitud'
            ], 400);
        }

        if (!in_array($accion, ['aceptar', 'rechazar'], true)) {
            responder([
                'exito' => false,
                'mensaje' => 'Accion no valida'
            ], 400);
        }

        /*
         * Operacion critica.
         */
        $conn->beginTransaction();

        /*
         * Buscar y bloquear la solicitud.
         *
         * El receptor debe ser el usuario conectado.
         */
        $stmt = $conn->prepare("
            SELECT
                s.id,
                s.solicitante_id,
                s.receptor_id,
                s.bloque_horario_id,
                s.estado,
                b.inicio,
                b.fin,
                b.activo
            FROM solicitudes_reunion s
            INNER JOIN bloques_horarios b
                ON b.id = s.bloque_horario_id
            WHERE s.id = ?
              AND s.receptor_id = ?
            FOR UPDATE
        ");

        $stmt->execute([
            $solicitudId,
            $usuarioId
        ]);

        $solicitud = $stmt->fetch();

        if (!$solicitud) {

            $conn->rollBack();

            responder([
                'exito' => false,
                'mensaje' => 'Solicitud no encontrada'
            ], 404);
        }

        /*
         * Solo se puede decidir sobre solicitudes pendientes.
         */
        if ($solicitud['estado'] !== 'Pendiente') {

            $conn->rollBack();

            responder([
                'exito' => false,
                'mensaje' => 'Esta solicitud ya fue procesada'
            ], 409);
        }

        /*
         * El bloque debe seguir activo.
         */
        if (!(int)$solicitud['activo']) {

            $conn->rollBack();

            responder([
                'exito' => false,
                'mensaje' => 'El bloque horario ya no esta disponible'
            ], 409);
        }

        /*
         * =====================================================
         * RECHAZAR
         * =====================================================
         *
         * Al rechazar no existe ocupacion.
         *
         * El bloque queda disponible nuevamente,
         * siempre que no exista otra reunion aceptada
         * en ese mismo horario.
         */
        if ($accion === 'rechazar') {

            $stmtUpdate = $conn->prepare("
                UPDATE solicitudes_reunion
                SET estado = 'Rechazada'
                WHERE id = ?
                  AND estado = 'Pendiente'
            ");

            $stmtUpdate->execute([
                $solicitudId
            ]);

            $conn->commit();

            responder([
                'exito' => true,
                'estado' => 'Rechazada',
                'mensaje' => 'Solicitud rechazada correctamente'
            ]);
        }

        /*
         * =====================================================
         * ACEPTAR
         * =====================================================
         *
         * Antes de aceptar verificamos nuevamente
         * que ninguno de los participantes tenga otra
         * reunion aceptada en ese horario.
         */
        $stmtConflicto = $conn->prepare("
            SELECT s.id
            FROM solicitudes_reunion s
            INNER JOIN bloques_horarios ocupado
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
            $solicitud['fin'],
            $solicitud['inicio'],
            $solicitud['solicitante_id'],
            $solicitud['receptor_id'],
            $solicitud['solicitante_id'],
            $solicitud['receptor_id']
        ]);

        if ($stmtConflicto->fetch()) {

            $conn->rollBack();

            responder([
                'exito' => false,
                'mensaje' => 'No se puede aceptar porque una de las personas ya tiene una reunion aceptada en este horario'
            ], 409);
        }

        /*
         * Aceptar solicitud.
         */
        $stmtUpdate = $conn->prepare("
            UPDATE solicitudes_reunion
            SET estado = 'Aceptada'
            WHERE id = ?
              AND estado = 'Pendiente'
        ");

        $stmtUpdate->execute([
            $solicitudId
        ]);

        $conn->commit();

        responder([
            'exito' => true,
            'estado' => 'Aceptada',
            'mensaje' => 'Solicitud aceptada correctamente'
        ]);
    }


    /*
     * =========================================================
     * CREAR SOLICITUD
     * =========================================================
     *
     * POST /api/solicitudes.php
     *
     * Se permite solicitar:
     *
     * 1. Con sesión activa.
     * 2. Sin sesión, pero con un correo registrado.
     */
    if ($method !== 'POST') {
        responder([
            'exito' => false,
            'mensaje' => 'Metodo no soportado'
        ], 405);
    }

    /*
     * Leer el body una sola vez.
     */
    $data = leerJson();

    /*
     * Identificar al solicitante.
     *
     * Si existe sesión, esa identidad tiene prioridad.
     *
     * Si no existe sesión, buscamos al participante
     * mediante el correo enviado desde el frontend.
     */
    $solicitanteId = null;
    $conectado = false;

    if (!empty($_SESSION['usuario_id'])) {

        $solicitanteId = (int)$_SESSION['usuario_id'];
        $conectado = true;

    } else {

        $correo = strtolower(
            trim((string)($data['email'] ?? ''))
        );

        if ($correo === '') {
            responder([
                'exito' => false,
                'mensaje' => 'Se requiere un correo para solicitar una reunion'
            ], 400);
        }

        $stmtUsuario = $conn->prepare("
            SELECT id
            FROM usuarios
            WHERE correo = ?
            LIMIT 1
        ");

        $stmtUsuario->execute([$correo]);

        $usuario = $stmtUsuario->fetch();

        if (!$usuario) {
            responder([
                'exito' => false,
                'mensaje' => 'El correo no corresponde a un participante registrado'
            ], 403);
        }

        $solicitanteId = (int)$usuario['id'];
    }

    /*
     * Datos de la solicitud.
     */
    $receptorId = enteroPositivo(
        $data['receptor_id'] ?? null
    );

    $bloqueId = enteroPositivo(
        $data['bloque_horario_id'] ?? null
    );

    $mensaje = trim(
        (string)($data['mensaje'] ?? '')
    );

    /*
     * Validaciones básicas.
     */
    if (!$receptorId || !$bloqueId) {
        responder([
            'exito' => false,
            'mensaje' => 'Faltan datos para procesar la solicitud'
        ], 400);
    }

    /*
     * Limitar el mensaje.
     */
    $mensaje = mb_substr($mensaje, 0, 2000);

    /*
     * Evitar solicitar una reunión consigo mismo.
     */
    if ($solicitanteId === $receptorId) {
        responder([
            'exito' => false,
            'mensaje' => 'No puedes solicitar una reunion contigo mismo'
        ], 400);
    }

    /*
     * =========================================================
     * OPERACION CRITICA
     * =========================================================
     */
    $conn->beginTransaction();

    /*
     * Bloquear los usuarios involucrados.
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

    $stmtBloque->execute([
        $bloqueId
    ]);

    $bloque = $stmtBloque->fetch();

    if (!$bloque) {

        $conn->rollBack();

        responder([
            'exito' => false,
            'mensaje' => 'El bloque horario no existe o no esta disponible'
        ], 409);
    }

    /*
     * =========================================================
     * VERIFICAR CONFLICTOS
     * =========================================================
     *
     * Se consideran solamente reuniones aceptadas.
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
     * =========================================================
     * SOLICITUD PENDIENTE DUPLICADA
     * =========================================================
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
     * Crear descripción del horario.
     */
    $descripcionHorario = descripcionBloque(
        $bloque['inicio'],
        $bloque['fin']
    );

    /*
     * =========================================================
     * CREAR SOLICITUD
     * =========================================================
     */
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
     * Confirmar solicitud en BD.
     */
    $conn->commit();

    /*
     * =========================================================
     * ENVIAR CORREO
     * =========================================================
     *
     * El correo se envía después del COMMIT para que un
     * problema de correo no haga fallar la solicitud.
     */
    try {

        enviarCorreoSolicitudReunion(
            $conn,
            $solicitudId
        );

    } catch (Throwable $mailError) {

        error_log(
            '[API PUBLICA solicitudes.php][MAIL] '
            . $mailError->getMessage()
        );
    }

    /*
     * =========================================================
     * RESPUESTA
     * =========================================================
     *
     * conectado:
     * true  = tenía sesión activa
     * false = fue identificado mediante correo
     */
    responder([
        'exito' => true,
        'conectado' => $conectado,
        'mensaje' => 'Solicitud enviada correctamente'
    ]);

} catch (Throwable $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log(
        '[API PUBLICA solicitudes.php] '
        . $e->getMessage()
    );

    responder([
        'exito' => false,
        'mensaje' => 'Error interno del servidor'
    ], 500);
}