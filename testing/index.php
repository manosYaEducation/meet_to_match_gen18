<?php

require_once __DIR__ . '/../adm/api/db.php';

/*
 * db.php está pensado para APIs y establece
 * Content-Type: application/json.
 *
 * Este archivo es una página HTML de testing,
 * por lo que sobrescribimos el header.
 */
header('Content-Type: text/html; charset=UTF-8');


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

$tests = [];


/* =========================================================
   FUNCIONES
   ========================================================= */

function agregarTest($nombre, $correcto, $detalle)
{
    global $tests;

    $tests[] = [
        'nombre' => $nombre,
        'correcto' => $correcto,
        'detalle' => $detalle
    ];
}


function consultarApi($url)
{
    if (!function_exists('curl_init')) {

        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'cURL no disponible'
        ];
    }

    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 10,

        // Solo para testing interno.
        // Evita problemas con certificados del dominio de testing.
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $body = curl_exec($ch);

    $error = curl_error($ch);

    $status = curl_getinfo(
        $ch,
        CURLINFO_HTTP_CODE
    );

    curl_close($ch);

    return [
        'ok' => $error === '',
        'status' => $status,
        'body' => $body ?: '',
        'error' => $error
    ];
}


/* =========================================================
   1. BASE DE DATOS
   ========================================================= */

try {

    $conn->query("SELECT 1");

    agregarTest(
        'Conexión a base de datos',
        true,
        'PDO disponible'
    );

} catch (Throwable $e) {

    agregarTest(
        'Conexión a base de datos',
        false,
        'Error de conexión: ' . $e->getMessage()
    );
}


/* =========================================================
   2. TABLAS PRINCIPALES
   ========================================================= */

$tablas = [
    'usuarios',
    'eventos',
    'bloques_horarios',
    'solicitudes_reunion',
    'enlaces_edicion'
];

foreach ($tablas as $tabla) {

    try {

        $conn->query(
            "SELECT 1 FROM `$tabla` LIMIT 1"
        );

        agregarTest(
            "Tabla `$tabla`",
            true,
            'Disponible'
        );

    } catch (Throwable $e) {

        agregarTest(
            "Tabla `$tabla`",
            false,
            'No disponible'
        );
    }
}


/* =========================================================
   3. USUARIOS
   ========================================================= */

try {

    $stmt = $conn->query("
        SELECT COUNT(*)
        FROM usuarios
    ");

    $usuarios = (int) $stmt->fetchColumn();

    agregarTest(
        'Usuarios registrados',
        $usuarios > 0,
        $usuarios . ' usuario(s)'
    );

} catch (Throwable $e) {

    agregarTest(
        'Usuarios registrados',
        false,
        'No se pudo consultar'
    );
}


/* =========================================================
   4. EVENTOS
   ========================================================= */

try {

    $stmt = $conn->query("
        SELECT COUNT(*)
        FROM eventos
        WHERE activo = 1
    ");

    $eventos = (int) $stmt->fetchColumn();

    agregarTest(
        'Eventos activos',
        $eventos > 0,
        $eventos . ' evento(s)'
    );

} catch (Throwable $e) {

    agregarTest(
        'Eventos activos',
        false,
        'No se pudo consultar'
    );
}


/* =========================================================
   5. BLOQUES HORARIOS
   ========================================================= */

try {

    $stmt = $conn->query("
        SELECT COUNT(*)
        FROM bloques_horarios
        WHERE activo = 1
    ");

    $bloques = (int) $stmt->fetchColumn();

    agregarTest(
        'Bloques horarios activos',
        $bloques > 0,
        $bloques . ' bloque(s)'
    );

} catch (Throwable $e) {

    agregarTest(
        'Bloques horarios activos',
        false,
        'No se pudo consultar'
    );
}


/* =========================================================
   6. SOLICITUDES
   ========================================================= */

try {

    $stmt = $conn->query("
        SELECT COUNT(*)
        FROM solicitudes_reunion
    ");

    $solicitudes = (int) $stmt->fetchColumn();

    agregarTest(
        'Tabla de solicitudes operativa',
        true,
        $solicitudes . ' solicitud(es)'
    );

} catch (Throwable $e) {

    agregarTest(
        'Tabla de solicitudes operativa',
        false,
        'No se pudo consultar'
    );
}


/* =========================================================
   7. URL BASE
   ========================================================= */

$protocolo =
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        ? 'https'
        : 'http';

$host = $_SERVER['HTTP_HOST'] ?? '';

$baseUrl =
    $protocolo .
    '://' .
    $host;

$baseUrl = rtrim($baseUrl, '/');


/* =========================================================
   8. API HORARIOS
   ========================================================= */

$urlHorarios =
    $baseUrl . '/api/horarios.php';

$respuesta = consultarApi($urlHorarios);

if (
    $respuesta['ok'] &&
    $respuesta['status'] === 200
) {

    $json = json_decode(
        $respuesta['body'],
        true
    );

    $cantidad = 0;

    if (
        is_array($json) &&
        isset($json['bloques']) &&
        is_array($json['bloques'])
    ) {

        $cantidad = count(
            $json['bloques']
        );
    }

    agregarTest(
        'API horarios',
        true,
        $cantidad . ' bloque(s) devuelto(s)'
    );

} else {

    agregarTest(
        'API horarios',
        false,
        'HTTP ' . $respuesta['status']
    );
}


/* =========================================================
   9. API HORARIOS CON RECEPTOR
   ========================================================= */

try {

    $stmt = $conn->query("
        SELECT id
        FROM usuarios
        ORDER BY id
        LIMIT 1
    ");

    $usuario = $stmt->fetch(
        PDO::FETCH_ASSOC
    );

    if ($usuario) {

        $usuarioId = (int) $usuario['id'];

        $url =
            $baseUrl .
            '/api/horarios.php?receptor_id=' .
            $usuarioId;

        $respuesta = consultarApi($url);

        $correcto =
            $respuesta['ok'] &&
            $respuesta['status'] === 200;

        agregarTest(
            'API horarios con receptor',
            $correcto,
            $correcto
                ? 'receptor_id=' . $usuarioId
                : 'HTTP ' . $respuesta['status']
        );

    } else {

        agregarTest(
            'API horarios con receptor',
            false,
            'No hay usuarios'
        );
    }

} catch (Throwable $e) {

    agregarTest(
        'API horarios con receptor',
        false,
        'No se pudo obtener usuario'
    );
}


/* =========================================================
   10. API AUTH SIN SESIÓN
   ========================================================= */

$respuesta = consultarApi(
    $baseUrl . '/api/auth.php'
);

agregarTest(
    'API auth sin sesión',
    $respuesta['status'] === 401,
    $respuesta['status'] === 401
        ? 'Responde 401 correctamente'
        : 'HTTP ' . $respuesta['status']
);


/* =========================================================
   11. TOKEN INVÁLIDO
   ========================================================= */

$tokenInvalido =
    'TOKEN_TEST_INVALIDO_123456789';

$respuesta = consultarApi(
    $baseUrl .
    '/api/enlace_edicion.php?token=' .
    urlencode($tokenInvalido)
);

agregarTest(
    'Token inválido rechazado',
    $respuesta['status'] === 404,
    $respuesta['status'] === 404
        ? 'Responde 404 correctamente'
        : 'HTTP ' . $respuesta['status']
);


/* =========================================================
   12. RESULTADO
   ========================================================= */

$total = count($tests);

$correctas = 0;

foreach ($tests as $test) {

    if ($test['correcto']) {
        $correctas++;
    }
}

$porcentaje = $total > 0
    ? round(
        ($correctas / $total) * 100
    )
    : 0;

?>
<!DOCTYPE html>
<html lang="es">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <title>Meet to Match — Testing</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 40px 20px;
            background: #111;
            color: #eee;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
        }

        .contenedor {
            max-width: 900px;
            margin: 0 auto;
        }

        h1 {
            margin-bottom: 5px;
        }

        .subtitulo {
            color: #999;
            margin-bottom: 30px;
        }

        .resumen {
            padding: 25px;
            margin-bottom: 25px;
            border-radius: 12px;
            background: #1d1d1d;
            border: 1px solid #333;
        }

        .numero {
            font-size: 42px;
            font-weight: bold;
        }

        .estado {
            margin-top: 5px;
            color: #aaa;
        }

        .test {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px 18px;
            margin-bottom: 8px;
            border-radius: 8px;
            background: #1b1b1b;
            border: 1px solid #292929;
        }

        .icono {
            width: 28px;
            font-size: 20px;
            text-align: center;
        }

        .nombre {
            flex: 1;
            font-weight: bold;
        }

        .detalle {
            color: #888;
            font-size: 13px;
            text-align: right;
        }

        .boton {
            display: inline-block;
            margin-top: 25px;
            padding: 12px 18px;
            border-radius: 8px;
            background: #eee;
            color: #111;
            text-decoration: none;
            font-weight: bold;
        }

    </style>

</head>

<body>

<div class="contenedor">

    <h1>
        Meet to Match — Testing
    </h1>

    <div class="subtitulo">
        Pruebas seguras del sistema. No modifica datos.
    </div>

    <div class="resumen">

        <div class="numero">

            <?php echo $correctas; ?>

            /

            <?php echo $total; ?>

        </div>

        <div class="estado">

            <?php echo $porcentaje; ?>%
            de pruebas correctas

        </div>

    </div>


    <?php foreach ($tests as $test): ?>

        <div class="test">

            <div class="icono">

                <?php

                echo $test['correcto']
                    ? '✓'
                    : '✕';

                ?>

            </div>

            <div class="nombre">

                <?php

                echo htmlspecialchars(
                    $test['nombre'],
                    ENT_QUOTES,
                    'UTF-8'
                );

                ?>

            </div>

            <div class="detalle">

                <?php

                echo htmlspecialchars(
                    $test['detalle'],
                    ENT_QUOTES,
                    'UTF-8'
                );

                ?>

            </div>

        </div>

    <?php endforeach; ?>


    <a
        href="index.php"
        class="boton"
    >
        Ejecutar nuevamente
    </a>

</div>

</body>

</html>