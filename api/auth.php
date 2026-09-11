<?php

require_once __DIR__ . '/../adm/api/db.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$method = $_SERVER['REQUEST_METHOD'];
$accion = $_GET['accion'] ?? '';


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

if (
    $method === 'POST' &&
    $accion === 'logout'
) {

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {

        $params =
            session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    session_destroy();


    responder([
        'exito' => true,
        'autenticado' => false,
        'mensaje' =>
            'Sesion cerrada correctamente'
    ]);
}


/* =========================================================
   ESTADO ACTUAL
   ========================================================= */

if ($method !== 'GET') {

    responder([
        'exito' => false,
        'mensaje' =>
            'Metodo no soportado'
    ], 405);
}


if (empty($_SESSION['usuario_id'])) {

    responder([
        'exito' => false,
        'autenticado' => false
    ], 401);
}


$usuarioId =
    (int)$_SESSION['usuario_id'];


/* =========================================================
   OBTENER DATOS BÁSICOS DEL USUARIO
   ========================================================= */

$stmt = $conn->prepare("
    SELECT
        id,
        nombre,
        apellido,
        correo
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

$stmt->execute([
    $usuarioId
]);

$usuario =
    $stmt->fetch();


if (!$usuario) {

    $_SESSION = [];

    session_destroy();

    responder([
        'exito' => false,
        'autenticado' => false
    ], 401);
}


/* =========================================================
   RESPUESTA
   ========================================================= */

responder([
    'exito' => true,
    'autenticado' => true,

    'usuario' => [
        'nombre' =>
            $usuario['nombre'],

        'apellido' =>
            $usuario['apellido'],

        'correo' =>
            $usuario['correo']
    ]
]);