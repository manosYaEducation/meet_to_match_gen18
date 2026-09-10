<?php
require_once __DIR__ . '/../adm/api/db.php';
require_once __DIR__ . '/../adm/api/mail.php';

$method = $_SERVER['REQUEST_METHOD'];

/*
 * Campos editables mediante el enlace de edición.
 *
 * IMPORTANTE:
 * - No incluir correo (evita cambio de identidad).
 * - No incluir tipo_usuario.
 */
$camposEditables = [
    'nombre',
    'apellido',
    'empresa',
    'cargo',
    'intereses',
    'busca',
    'descripcion'
];

function generarToken()
{
    return bin2hex(random_bytes(32));
}

try {

    if ($method === 'POST') {

        /*
         * Solicitar un enlace de edición.
         *
         * El correo es la única forma en que el visitante declara
         * quién es. El frontend nunca envía usuario_id.
         */
        $data = leerJson();
        $email = strtolower(trim((string)($data['email'] ?? '')));

        $mensajeGenerico = 'Si el correo corresponde a un participante registrado, recibirás un enlace para editar tu perfil.';

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            /*
             * No entregamos información sobre si el correo existe.
             */
            responder([
                'exito' => true,
                'mensaje' => $mensajeGenerico
            ]);
        }

        $stmtUsuario = $conn->prepare("
            SELECT id
            FROM usuarios
            WHERE correo = ?
            LIMIT 1
        ");
        $stmtUsuario->execute([$email]);
        $usuario = $stmtUsuario->fetch();

        if (!$usuario) {
            /*
             * No revelar que el correo no está registrado.
             * Tampoco se crea un token ni se envía correo.
             */
            responder([
                'exito' => true,
                'mensaje' => $mensajeGenerico
            ]);
        }

        $usuarioId = (int)$usuario['id'];

        /*
         * Anti-spam: si ya existe un token no usado generado hace
         * menos de 5 minutos para este usuario, no se genera uno
         * nuevo ni se reenvía el correo.
         */
        $stmtCooldown = $conn->prepare("
            SELECT id
            FROM enlaces_edicion
            WHERE usuario_id = ?
              AND usado_en IS NULL
              AND created_at > (NOW() - INTERVAL 5 MINUTE)
            LIMIT 1
        ");
        $stmtCooldown->execute([$usuarioId]);

        if ($stmtCooldown->fetch()) {
            responder([
                'exito' => true,
                'mensaje' => $mensajeGenerico
            ]);
        }

        $token = generarToken();
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;

        $stmtInsert = $conn->prepare("
            INSERT INTO enlaces_edicion (
                usuario_id,
                token,
                expira_en,
                ip_solicitud
            )
            VALUES (?, ?, NOW() + INTERVAL 24 HOUR, ?)
        ");
        $stmtInsert->execute([
            $usuarioId,
            $token,
            $ip
        ]);

        /*
         * El envío de correo ocurre después de guardar el token.
         * Si el correo falla, el token ya quedó registrado y el
         * visitante puede pedir uno nuevo pasado el cooldown.
         */
        try {
            enviarCorreoEdicionPerfil($conn, $usuarioId, $token);
        } catch (Throwable $mailError) {
            error_log(
                '[API PUBLICA enlace_edicion.php][MAIL] '
                . $mailError->getMessage()
            );
        }

        responder([
            'exito' => true,
            'mensaje' => $mensajeGenerico
        ]);
    }

    if ($method === 'GET') {

        /*
         * Validar un enlace y devolver los datos editables.
         */
        $token = trim((string)($_GET['token'] ?? ''));

        if ($token === '') {
            responder([
                'exito' => false,
                'mensaje' => 'Enlace inválido o expirado'
            ], 404);
        }

        $stmt = $conn->prepare("
            SELECT
                e.usuario_id,
                u.nombre,
                u.apellido,
                u.empresa,
                u.cargo,
                u.intereses,
                u.busca,
                u.descripcion
            FROM enlaces_edicion e
            JOIN usuarios u ON u.id = e.usuario_id
            WHERE e.token = ?
              AND e.usado_en IS NULL
              AND e.expira_en > NOW()
            LIMIT 1
        ");
        $stmt->execute([$token]);
        $registro = $stmt->fetch();

        if (!$registro) {
            /*
             * Mismo mensaje sin distinguir el motivo (no existe,
             * ya usado, o expirado).
             */
            responder([
                'exito' => false,
                'mensaje' => 'Enlace inválido o expirado'
            ], 404);
        }

        unset($registro['usuario_id']);

        responder([
            'exito' => true,
            'usuario' => $registro
        ]);
    }

    if ($method === 'PUT') {

        /*
         * Guardar cambios de perfil usando el enlace.
         */
        $data = leerJson();
        $token = trim((string)($data['token'] ?? ''));

        if ($token === '') {
            responder([
                'exito' => false,
                'mensaje' => 'Enlace inválido o expirado'
            ], 404);
        }

        $conn->beginTransaction();

        $stmtToken = $conn->prepare("
            SELECT id, usuario_id
            FROM enlaces_edicion
            WHERE token = ?
              AND usado_en IS NULL
              AND expira_en > NOW()
            FOR UPDATE
        ");
        $stmtToken->execute([$token]);
        $enlace = $stmtToken->fetch();

        if (!$enlace) {
            $conn->rollBack();

            responder([
                'exito' => false,
                'mensaje' => 'Enlace inválido o expirado'
            ], 404);
        }

        $usuarioId = (int)$enlace['usuario_id'];

        /*
         * Solo se aceptan los campos de la whitelist. No se
         * confía en el frontend para restringir esto: aunque
         * llegue "correo" en el body, se ignora.
         */
        $set = [];
        $valores = [];

        foreach ($camposEditables as $campo) {
            if (array_key_exists($campo, $data)) {
                $set[] = "`$campo` = ?";
                $valores[] = mb_substr(trim((string)$data[$campo]), 0, 2000);
            }
        }

        if (!$set) {
            $conn->rollBack();

            responder([
                'exito' => false,
                'mensaje' => 'No se enviaron datos para actualizar'
            ], 400);
        }

        $valores[] = $usuarioId;

        $stmtUpdate = $conn->prepare("
            UPDATE usuarios
            SET " . implode(', ', $set) . "
            WHERE id = ?
        ");
        $stmtUpdate->execute($valores);

        $stmtUsado = $conn->prepare("
            UPDATE enlaces_edicion
            SET usado_en = NOW()
            WHERE id = ?
        ");
        $stmtUsado->execute([$enlace['id']]);

        $conn->commit();

        responder([
            'exito' => true,
            'mensaje' => 'Perfil actualizado correctamente'
        ]);
    }

    responder([
        'exito' => false,
        'mensaje' => 'Metodo no soportado'
    ], 405);

} catch (Throwable $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log(
        '[API PUBLICA enlace_edicion.php] '
        . $e->getMessage()
    );

    responder([
        'exito' => false,
        'mensaje' => 'Error interno del servidor'
    ], 500);
}