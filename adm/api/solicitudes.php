<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mail.php';

$method = $_SERVER['REQUEST_METHOD'];

function descripcionBloque($inicio, $fin)
{
    if (!$inicio || !$fin) {
        return null;
    }
    $desde = new DateTimeImmutable($inicio);
    $hasta = new DateTimeImmutable($fin);
    return $desde->format('d-m-Y H:i') . ' - ' . $hasta->format('H:i');
}

function selectSolicitudes($conn, $campo, $usuarioId)
{
    $sql = "
        SELECT
            s.*,
            b.inicio AS bloque_inicio,
            b.fin AS bloque_fin,
            b.etiqueta AS bloque_etiqueta,
            sol.nombre AS solicitante_nombre,
            sol.apellido AS solicitante_apellido,
            sol.empresa AS solicitante_empresa,
            sol.cargo AS solicitante_cargo,
            sol.intereses AS solicitante_intereses,
            sol.busca AS solicitante_busca,
            sol.descripcion AS solicitante_descripcion,
            rec.nombre AS receptor_nombre,
            rec.apellido AS receptor_apellido,
            rec.empresa AS receptor_empresa,
            rec.cargo AS receptor_cargo
        FROM solicitudes_reunion s
        LEFT JOIN bloques_horarios b ON b.id = s.bloque_horario_id
        JOIN usuarios sol ON sol.id = s.solicitante_id
        JOIN usuarios rec ON rec.id = s.receptor_id
        WHERE s.$campo = ?
        ORDER BY COALESCE(b.inicio, s.created_at) DESC, s.created_at DESC
    ";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$usuarioId]);
    return $stmt->fetchAll();
}

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare("
                SELECT s.*, b.inicio AS bloque_inicio, b.fin AS bloque_fin, b.etiqueta AS bloque_etiqueta
                FROM solicitudes_reunion s
                LEFT JOIN bloques_horarios b ON b.id = s.bloque_horario_id
                WHERE s.id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $solicitud = $stmt->fetch();
            if (!$solicitud) {
                responder(['exito' => false, 'mensaje' => 'Solicitud no encontrada'], 404);
            }
            responder(['exito' => true, 'solicitud' => $solicitud]);
        }

        if (isset($_GET['recibidas'])) {
            responder(['exito' => true, 'solicitudes' => selectSolicitudes($conn, 'receptor_id', $_GET['recibidas'])]);
        }

        if (isset($_GET['enviadas'])) {
            responder(['exito' => true, 'solicitudes' => selectSolicitudes($conn, 'solicitante_id', $_GET['enviadas'])]);
        }

        $stmt = $conn->query("
            SELECT
                s.*,
                b.inicio AS bloque_inicio,
                b.fin AS bloque_fin,
                b.etiqueta AS bloque_etiqueta,
                sol.nombre AS solicitante_nombre,
                sol.apellido AS solicitante_apellido,
                sol.empresa AS solicitante_empresa,
                sol.cargo AS solicitante_cargo,
                rec.nombre AS receptor_nombre,
                rec.apellido AS receptor_apellido,
                rec.empresa AS receptor_empresa,
                rec.cargo AS receptor_cargo
            FROM solicitudes_reunion s
            LEFT JOIN bloques_horarios b ON b.id = s.bloque_horario_id
            LEFT JOIN usuarios sol ON sol.id = s.solicitante_id
            LEFT JOIN usuarios rec ON rec.id = s.receptor_id
            ORDER BY s.created_at DESC
        ");
        responder(['exito' => true, 'solicitudes' => $stmt->fetchAll()]);
    }

    if ($method === 'POST') {
        $data = leerJson();
        if (!requerido($data, 'solicitante_id') || !requerido($data, 'receptor_id') || !requerido($data, 'bloque_horario_id')) {
            responder(['exito' => false, 'mensaje' => 'Falta solicitante, receptor o bloque horario'], 400);
        }

        $solicitanteId = (int)$data['solicitante_id'];
        $receptorId = (int)$data['receptor_id'];
        $bloqueId = (int)$data['bloque_horario_id'];

        if ($solicitanteId === $receptorId) {
            responder(['exito' => false, 'mensaje' => 'No puedes solicitar una reunion contigo mismo'], 400);
        }

        $conn->beginTransaction();

        $stmtUsuarios = $conn->prepare('SELECT id FROM usuarios WHERE id IN (?, ?) ORDER BY id FOR UPDATE');
        $stmtUsuarios->execute([$solicitanteId, $receptorId]);
        if (count($stmtUsuarios->fetchAll()) !== 2) {
            $conn->rollBack();
            responder(['exito' => false, 'mensaje' => 'Solicitante o receptor no existe'], 404);
        }

        $stmtBloque = $conn->prepare('SELECT id, inicio, fin FROM bloques_horarios WHERE id = ? AND activo = 1 FOR UPDATE');
        $stmtBloque->execute([$bloqueId]);
        $bloque = $stmtBloque->fetch();
        if (!$bloque) {
            $conn->rollBack();
            responder(['exito' => false, 'mensaje' => 'El bloque horario no existe o esta inactivo'], 404);
        }

        $stmtConflicto = $conn->prepare("
            SELECT s.id FROM solicitudes_reunion s
            JOIN bloques_horarios ocupado ON ocupado.id = s.bloque_horario_id
            WHERE s.estado = 'Aceptada'
              AND ocupado.inicio < ?
              AND ocupado.fin > ?
              AND (solicitante_id IN (?, ?) OR receptor_id IN (?, ?))
            LIMIT 1
        ");
        $stmtConflicto->execute([$bloque['fin'], $bloque['inicio'], $solicitanteId, $receptorId, $solicitanteId, $receptorId]);
        if ($stmtConflicto->fetch()) {
            $conn->rollBack();
            responder(['exito' => false, 'mensaje' => 'Una de las personas ya tiene una reunion aceptada en este horario'], 409);
        }

        $stmtCheck = $conn->prepare("
            SELECT id FROM solicitudes_reunion
            WHERE solicitante_id = ? AND receptor_id = ? AND bloque_horario_id = ? AND estado = 'Pendiente'
            LIMIT 1
        ");
        $stmtCheck->execute([$solicitanteId, $receptorId, $bloqueId]);
        if ($stmtCheck->fetch()) {
            $conn->rollBack();
            responder(['exito' => false, 'mensaje' => 'Ya existe una solicitud pendiente con esta persona'], 409);
        }

        $descripcionHorario = descripcionBloque($bloque['inicio'], $bloque['fin']);

        $estadoInicial = ($data['estado'] ?? '') === 'Aceptada' ? 'Aceptada' : 'Pendiente';

        $stmt = $conn->prepare("
            INSERT INTO solicitudes_reunion (solicitante_id, receptor_id, bloque_horario_id, mensaje, disponibilidad_sugerida, estado)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $solicitanteId,
            $receptorId,
            $bloqueId,
            trim($data['mensaje'] ?? ''),
            $descripcionHorario,
            $estadoInicial
        ]);

        $solicitudId = (int)$conn->lastInsertId();
        $conn->commit();

        /*
         * Si el admin la agenda directo como Aceptada, igual se
         * intenta notificar por correo, pero un fallo de SMTP no
         * debe impedir que la reunion quede creada (ya se hizo
         * commit antes de esto).
         */
        $correo = enviarCorreoSolicitudReunion($conn, $solicitudId);

        responder([
            'exito' => true,
            'mensaje' => $correo['enviado'] ? 'Solicitud enviada y correo notificado' : 'Solicitud enviada',
            'id' => $solicitudId,
            'correo' => $correo
        ]);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        $data = leerJson();
        if (!requerido($data, 'id') || !requerido($data, 'estado')) {
            responder(['exito' => false, 'mensaje' => 'Falta id o estado'], 400);
        }

        $estado = $data['estado'];
        if (!in_array($estado, ['Aceptada', 'Rechazada'], true)) {
            responder(['exito' => false, 'mensaje' => 'Estado invalido'], 400);
        }

        $solicitudId = (int)$data['id'];
        $conn->beginTransaction();
        $stmtSolicitud = $conn->prepare('SELECT * FROM solicitudes_reunion WHERE id = ? FOR UPDATE');
        $stmtSolicitud->execute([$solicitudId]);
        $solicitud = $stmtSolicitud->fetch();
        if (!$solicitud) {
            $conn->rollBack();
            responder(['exito' => false, 'mensaje' => 'Solicitud no encontrada'], 404);
        }
        if (isset($data['usuario_id']) && (int)$data['usuario_id'] !== (int)$solicitud['receptor_id']) {
            $conn->rollBack();
            responder(['exito' => false, 'mensaje' => 'Solo el receptor puede responder esta solicitud'], 403);
        }
        if ($solicitud['estado'] !== 'Pendiente') {
            $conn->rollBack();
            responder(['exito' => false, 'mensaje' => 'La solicitud ya fue respondida'], 409);
        }

        if ($estado === 'Aceptada') {
            if (empty($solicitud['bloque_horario_id'])) {
                $conn->rollBack();
                responder(['exito' => false, 'mensaje' => 'Esta solicitud antigua no tiene un bloque horario asignado'], 409);
            }

            $stmtUsuarios = $conn->prepare('SELECT id FROM usuarios WHERE id IN (?, ?) ORDER BY id FOR UPDATE');
            $stmtUsuarios->execute([$solicitud['solicitante_id'], $solicitud['receptor_id']]);
            $stmtBloque = $conn->prepare('SELECT inicio, fin FROM bloques_horarios WHERE id = ? AND activo = 1 FOR UPDATE');
            $stmtBloque->execute([$solicitud['bloque_horario_id']]);
            $bloque = $stmtBloque->fetch();
            if (!$bloque) {
                $conn->rollBack();
                responder(['exito' => false, 'mensaje' => 'El bloque horario ya no esta disponible'], 409);
            }
            $stmtConflicto = $conn->prepare("
                SELECT s.id FROM solicitudes_reunion s
                JOIN bloques_horarios ocupado ON ocupado.id = s.bloque_horario_id
                WHERE s.id <> ?
                  AND s.estado = 'Aceptada'
                  AND ocupado.inicio < ?
                  AND ocupado.fin > ?
                  AND (solicitante_id IN (?, ?) OR receptor_id IN (?, ?))
                LIMIT 1
            ");
            $stmtConflicto->execute([
                $solicitudId,
                $bloque['fin'],
                $bloque['inicio'],
                $solicitud['solicitante_id'],
                $solicitud['receptor_id'],
                $solicitud['solicitante_id'],
                $solicitud['receptor_id']
            ]);
            if ($stmtConflicto->fetch()) {
                $conn->rollBack();
                responder(['exito' => false, 'mensaje' => 'No se puede aceptar: una de las personas ya tiene una reunion en ese horario'], 409);
            }
        }

        $stmt = $conn->prepare('UPDATE solicitudes_reunion SET estado = ? WHERE id = ?');
        $stmt->execute([$estado, $solicitudId]);
        $conn->commit();
        responder(['exito' => true, 'mensaje' => 'Estado actualizado']);
    }

    if ($method === 'DELETE') {
        $data = leerJson();
        $id = $_GET['id'] ?? ($data['id'] ?? null);
        if (!$id) {
            responder(['exito' => false, 'mensaje' => 'Falta id de solicitud'], 400);
        }

        $stmt = $conn->prepare('DELETE FROM solicitudes_reunion WHERE id = ?');
        $stmt->execute([$id]);
        responder(['exito' => true, 'mensaje' => 'Solicitud eliminada']);
    }

    responder(['exito' => false, 'mensaje' => 'Metodo no soportado'], 405);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    responder(['exito' => false, 'mensaje' => $e->getMessage()], 500);
}