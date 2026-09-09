<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/luma_csv.php';

function obtenerEventoImportacion(PDO $conn)
{
    $stmt = $conn->query("SELECT id FROM eventos WHERE activo = 1 ORDER BY id LIMIT 1");
    $id = $stmt->fetchColumn();
    if ($id) {
        return (int)$id;
    }

    $conn->exec("INSERT INTO eventos (nombre, slug, activo) VALUES ('Tecnologias Disruptivas', 'tecnologias-disruptivas', 1)");
    return (int)$conn->lastInsertId();
}
try {
    if ($requestMethod === 'GET') {
        $stmt = $conn->query("
            SELECT id, nombre, apellido, correo, tipo_usuario, luma_ticket, luma_estado
            FROM usuarios
            WHERE origen = 'luma'
            ORDER BY nombre, apellido
            LIMIT 500
        ");
        responder(['exito' => true, 'usuarios' => $stmt->fetchAll()]);
    }

    if ($requestMethod !== 'POST') {
        responder(['exito' => false, 'mensaje' => 'Metodo no soportado'], 405);
    }

    if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        responder(['exito' => false, 'mensaje' => 'Debes seleccionar un archivo CSV valido.'], 400);
    }

    $archivo = $_FILES['archivo'];
    if (($archivo['size'] ?? 0) > 10 * 1024 * 1024) {
        responder(['exito' => false, 'mensaje' => 'El CSV supera el limite de 10 MB.'], 400);
    }
    if (strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION)) !== 'csv') {
        responder(['exito' => false, 'mensaje' => 'El archivo debe tener extension .csv.'], 400);
    }

    $filas = lumaLeerCsv($archivo['tmp_name']);
    $incluirNoAprobados = ($_POST['incluir_no_aprobados'] ?? '0') === '1';
    $eventoId = obtenerEventoImportacion($conn);
    $resumen = [
        'filas_total' => count($filas),
        'creados' => 0,
        'actualizados' => 0,
        'omitidos' => 0,
        'errores' => 0,
        'detalle_errores' => [],
    ];
    $vistos = [];

    $buscar = $conn->prepare('SELECT id, tipo_usuario FROM usuarios WHERE correo = ? LIMIT 1');
    $guardar = $conn->prepare("
        INSERT INTO usuarios (
            evento_id, nombre, apellido, correo, tipo_usuario, origen, luma_guest_id,
            telefono, luma_estado, luma_ticket, luma_checked_in_at, luma_qr_url, luma_created_at
        ) VALUES (?, ?, ?, ?, ?, 'luma', ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            evento_id = VALUES(evento_id),
            nombre = VALUES(nombre),
            apellido = VALUES(apellido),
            tipo_usuario = IF(VALUES(tipo_usuario) = 'Asistente' AND usuarios.tipo_usuario <> 'Asistente', usuarios.tipo_usuario, VALUES(tipo_usuario)),
            origen = 'luma',
            luma_guest_id = VALUES(luma_guest_id),
            telefono = VALUES(telefono),
            luma_estado = VALUES(luma_estado),
            luma_ticket = VALUES(luma_ticket),
            luma_checked_in_at = VALUES(luma_checked_in_at),
            luma_qr_url = VALUES(luma_qr_url),
            luma_created_at = VALUES(luma_created_at)
    ");

    $conn->beginTransaction();
    foreach ($filas as $fila) {
        $numero = (int)($fila['_fila'] ?? 0);
        if (isset($fila['_error'])) {
            $resumen['errores']++;
            if (count($resumen['detalle_errores']) < 20) {
                $resumen['detalle_errores'][] = "Fila $numero: {$fila['_error']}";
            }
            continue;
        }

        $correo = strtolower(trim((string)($fila['email'] ?? '')));
        [$nombre, $apellido] = lumaSepararNombre($fila);
        if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || $nombre === '') {
            $resumen['errores']++;
            if (count($resumen['detalle_errores']) < 20) {
                $resumen['detalle_errores'][] = "Fila $numero: nombre o correo invalido";
            }
            continue;
        }
        if (isset($vistos[$correo])) {
            $resumen['omitidos']++;
            continue;
        }
        $vistos[$correo] = true;

        $estado = strtolower(trim((string)($fila['approval_status'] ?? '')));
        if (!$incluirNoAprobados && $estado !== '' && $estado !== 'approved') {
            $resumen['omitidos']++;
            continue;
        }

        $buscar->execute([$correo]);
        $existente = $buscar->fetch();
        $guardar->execute([
            $eventoId,
            $nombre,
            $apellido,
            $correo,
            lumaClasificarRol($fila),
            trim((string)($fila['guest_id'] ?? '')) ?: null,
            trim((string)($fila['phone_number'] ?? '')) ?: null,
            trim((string)($fila['approval_status'] ?? '')) ?: null,
            trim((string)($fila['ticket_name'] ?? '')) ?: null,
            lumaFechaMysql($fila['checked_in_at'] ?? ''),
            trim((string)($fila['qr_code_url'] ?? '')) ?: null,
            lumaFechaMysql($fila['created_at'] ?? ''),
        ]);
        $resumen[$existente ? 'actualizados' : 'creados']++;
    }

    $log = $conn->prepare("
        INSERT INTO importaciones_luma (evento_id, archivo, filas_total, creados, actualizados, omitidos, errores)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $log->execute([
        $eventoId,
        basename($archivo['name']),
        $resumen['filas_total'],
        $resumen['creados'],
        $resumen['actualizados'],
        $resumen['omitidos'],
        $resumen['errores'],
    ]);
    $conn->commit();

    responder([
        'exito' => true,
        'mensaje' => 'Importacion Luma completada.',
        'resumen' => $resumen,
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    responder(['exito' => false, 'mensaje' => $e->getMessage()], 500);
}
