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

    if (
        (int)$archivo['size'] <= 0 ||
        (int)$archivo['size'] > 5 * 1024 * 1024
    ) {
        responder([
            'exito' => false,
            'mensaje' => 'La imagen debe pesar como máximo 5 MB'
        ], 400);
    }

    /*
     * Validar que sea una imagen real sin depender de finfo,
     * ya que Fileinfo no está habilitado en el servidor.
     */
    $infoImagen = @getimagesize($archivo['tmp_name']);

    if ($infoImagen === false) {
        responder([
            'exito' => false,
            'mensaje' => 'El archivo seleccionado no es una imagen válida'
        ], 400);
    }

    $tipoImagen = $infoImagen[2];

    $tiposPermitidos = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG  => 'png',
        IMAGETYPE_WEBP => 'webp'
    ];

    if (!isset($tiposPermitidos[$tipoImagen])) {
        responder([
            'exito' => false,
            'mensaje' => 'Solo se permiten imágenes JPG, PNG o WEBP'
        ], 400);
    }

    $extension = $tiposPermitidos[$tipoImagen];

    $directorio = __DIR__ . '/../uploads/perfiles/';

    if (!is_dir($directorio)) {
        if (!mkdir($directorio, 0755, true)) {
            throw new RuntimeException(
                'No fue posible crear la carpeta de perfiles'
            );
        }
    }

    if (!is_writable($directorio)) {
        throw new RuntimeException(
            'La carpeta de perfiles no tiene permisos de escritura'
        );
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
        throw new RuntimeException(
            'No fue posible guardar la imagen en el servidor'
        );
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

    /*
     * Solo borrar la foto anterior después de haber
     * guardado correctamente la nueva ruta en la BD.
     */
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

    /*
     * Si la imagen llegó a guardarse pero luego falló
     * la actualización de la BD, eliminarla.
     */
    if ($rutaNueva !== null && is_file($rutaNueva)) {
        @unlink($rutaNueva);
    }

    http_response_code(500);

    echo json_encode([
        'exito' => false,
        'mensaje' => 'No fue posible subir la imagen'
    ]);
}