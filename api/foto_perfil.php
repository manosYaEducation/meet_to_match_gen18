<?php

require_once __DIR__ . '/../adm/api/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder([
        'exito' => false,
        'mensaje' => 'Método no permitido'
    ], 405);
}

$rutaNueva = null;

try {
    $token = trim((string)($_POST['token'] ?? ''));

    if ($token === '') {
        responder([
            'exito' => false,
            'mensaje' => 'Enlace inválido o expirado'
        ], 401);
    }

    $stmt = $conn->prepare("
        SELECT
            e.usuario_id,
            u.foto_perfil
        FROM enlaces_edicion e
        INNER JOIN usuarios u
            ON u.id = e.usuario_id
        WHERE e.token = ?
          AND e.usado_en IS NULL
          AND e.expira_en > NOW()
        LIMIT 1
    ");

    $stmt->execute([$token]);
    $usuario = $stmt->fetch();

    if (!$usuario) {
        responder([
            'exito' => false,
            'mensaje' => 'Enlace inválido o expirado'
        ], 401);
    }

    $usuarioId = (int)$usuario['usuario_id'];

    if (!isset($_FILES['foto'])) {
        responder([
            'exito' => false,
            'mensaje' => 'No se recibió una imagen'
        ], 400);
    }

    $archivo = $_FILES['foto'];

    if ($archivo['error'] !== UPLOAD_ERR_OK) {
        responder([
            'exito' => false,
            'mensaje' => 'No se recibió una imagen válida'
        ], 400);
    }

    if (!is_uploaded_file($archivo['tmp_name'])) {
        responder([
            'exito' => false,
            'mensaje' => 'La carga de la imagen no es válida'
        ], 400);
    }

    if ((int)$archivo['size'] <= 0 || (int)$archivo['size'] > 5 * 1024 * 1024) {
        responder([
            'exito' => false,
            'mensaje' => 'La imagen debe pesar como máximo 5 MB'
        ], 400);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($archivo['tmp_name']);

    $tiposPermitidos = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp'
    ];

    if (!isset($tiposPermitidos[$mime])) {
        responder([
            'exito' => false,
            'mensaje' => 'Solo se permiten imágenes JPG, PNG o WEBP'
        ], 400);
    }

    $extension = $tiposPermitidos[$mime];
    $directorio = __DIR__ . '/../uploads/perfiles/';

    if (!is_dir($directorio) && !mkdir($directorio, 0755, true)) {
        throw new RuntimeException('No fue posible crear la carpeta de perfiles');
    }

    $nombreArchivo =
        'usuario_' .
        $usuarioId .
        '_' .
        bin2hex(random_bytes(8)) .
        '.' .
        $extension;

    $rutaNueva = $directorio . $nombreArchivo;
    $rutaPublica = 'uploads/perfiles/' . $nombreArchivo;

    if (!move_uploaded_file($archivo['tmp_name'], $rutaNueva)) {
        throw new RuntimeException('No fue posible guardar la imagen');
    }

    $stmt = $conn->prepare("
        UPDATE usuarios
        SET foto_perfil = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $rutaPublica,
        $usuarioId
    ]);

    // Solo después de guardar la nueva ruta en BD, borrar la foto anterior.
    $fotoAnterior = trim((string)($usuario['foto_perfil'] ?? ''));

    if (
        $fotoAnterior !== '' &&
        str_starts_with($fotoAnterior, 'uploads/perfiles/')
    ) {
        $rutaAnterior = __DIR__ . '/../' . $fotoAnterior;

        if (is_file($rutaAnterior)) {
            @unlink($rutaAnterior);
        }
    }

    responder([
        'exito' => true,
        'mensaje' => 'Foto actualizada correctamente',
        'foto_perfil' => $rutaPublica
    ]);

} catch (Throwable $e) {
    // Si algo falla después de mover el archivo pero antes de completar,
    // evitar dejar archivos huérfanos.
    if ($rutaNueva && is_file($rutaNueva)) {
        @unlink($rutaNueva);
    }

    error_log('[FOTO PERFIL] ' . $e->getMessage());

    responder([
        'exito' => false,
        'mensaje' => 'No fue posible subir la imagen'
    ], 500);
}
