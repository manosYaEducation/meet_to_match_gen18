
<?php

require_once __DIR__ . '/../adm/api/db.php';
require_once __DIR__ . '/../adm/api/mail.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$method = $_SERVER['REQUEST_METHOD'];


/* =========================================================
   CAMPOS EDITABLES
   ========================================================= */

$camposEditables = [
    'nombre',
    'apellido',
    'empresa',
    'cargo',
    'intereses',
    'busca',
    'descripcion'
];


/* =========================================================
   TOKEN
   ========================================================= */

function generarToken()
{
    return bin2hex(
        random_bytes(32)
    );
}


/* =========================================================
   OBTENER SOLICITUDES DEL USUARIO
   ========================================================= */

function obtenerSolicitudesUsuario(
    PDO $conn,
    int $usuarioId
) {

    $stmt = $conn->prepare("
        SELECT
            s.id,
            s.mensaje,
            s.disponibilidad_sugerida,
            s.estado,

            b.inicio AS bloque_inicio,
            b.fin AS bloque_fin,
            b.etiqueta AS bloque_etiqueta,

            e.nombre AS evento_nombre,

            sol.nombre AS solicitante_nombre,
            sol.apellido AS solicitante_apellido,
            sol.empresa AS solicitante_empresa,
            sol.cargo AS solicitante_cargo,
            sol.intereses AS solicitante_intereses,
            sol.busca AS solicitante_busca,
            sol.descripcion AS solicitante_descripcion

        FROM solicitudes_reunion s

        LEFT JOIN bloques_horarios b
            ON b.id = s.bloque_horario_id

        LEFT JOIN eventos e
            ON e.id = b.evento_id

        JOIN usuarios sol
            ON sol.id = s.solicitante_id

        WHERE s.receptor_id = ?

        ORDER BY
            CASE
                WHEN s.estado = 'Pendiente' THEN 0
                WHEN s.estado = 'Aceptada' THEN 1
                ELSE 2
            END,
            b.inicio ASC,
            s.id DESC
    ");

    $stmt->execute([
        $usuarioId
    ]);

    $solicitudes = $stmt->fetchAll();

    foreach (
        $solicitudes
        as &$solicitud
    ) {

        if (
            !empty($solicitud['bloque_inicio']) &&
            !empty($solicitud['bloque_fin'])
        ) {

            try {

                $inicio =
                    new DateTimeImmutable(
                        $solicitud['bloque_inicio']
                    );

                $fin =
                    new DateTimeImmutable(
                        $solicitud['bloque_fin']
                    );

                $solicitud['horario'] =
                    $inicio->format(
                        'd-m-Y H:i'
                    )
                    . ' - '
                    . $fin->format(
                        'H:i'
                    );

            } catch (Throwable $e) {

                $solicitud['horario'] =
                    $solicitud[
                        'disponibilidad_sugerida'
                    ]
                    ?: null;
            }

        } else {

            $solicitud['horario'] =
                $solicitud[
                    'disponibilidad_sugerida'
                ]
                ?: null;
        }


        $solicitud[
            'solicitante_nombre_completo'
        ] =
            trim(
                $solicitud[
                    'solicitante_nombre'
                ]
                . ' '
                . (
                    $solicitud[
                        'solicitante_apellido'
                    ]
                    ?? ''
                )
            );


        unset(
            $solicitud['bloque_inicio'],
            $solicitud['bloque_fin'],
            $solicitud[
                'disponibilidad_sugerida'
            ]
        );
    }

    unset($solicitud);

    return $solicitudes;
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function destruirSesion()
{
    $_SESSION = [];

    if (
        ini_get('session.use_cookies')
    ) {

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
}


/* =========================================================
   OBTENER O CREAR ENLACE PERSONAL DESDE SESIÓN
   ========================================================= */

function obtenerOCrearEnlaceSesion(
    PDO $conn,
    int $usuarioId
) {

    /* ---------------------------------------------------------
       Buscar enlace vigente
       --------------------------------------------------------- */

    $stmt = $conn->prepare("
        SELECT
            token

        FROM enlaces_edicion

        WHERE usuario_id = ?
          AND usado_en IS NULL
          AND expira_en > NOW()

        ORDER BY id DESC

        LIMIT 1
    ");

    $stmt->execute([
        $usuarioId
    ]);

    $enlace =
        $stmt->fetch();


    if (
        $enlace &&
        !empty($enlace['token'])
    ) {

        return $enlace['token'];
    }


    /* ---------------------------------------------------------
       No existe enlace vigente.
       Creamos uno nuevo.
       --------------------------------------------------------- */

    $token =
        generarToken();


    $ip =
        $_SERVER['REMOTE_ADDR']
        ?? null;


    $stmtInsert = $conn->prepare("
        INSERT INTO enlaces_edicion (
            usuario_id,
            token,
            expira_en,
            ip_solicitud
        )
        VALUES (
            ?,
            ?,
            NOW() + INTERVAL 24 HOUR,
            ?
        )
    ");

    $stmtInsert->execute([
        $usuarioId,
        $token,
        $ip
    ]);


    return $token;
}


/* =========================================================
   RESPUESTA
   ========================================================= */

try {


    /* =====================================================
       POST
       Solicitar enlace personal
       ===================================================== */

    if ($method === 'POST') {

        $data =
            leerJson();


        $email =
            strtolower(
                trim(
                    (string)(
                        $data['email']
                        ?? ''
                    )
                )
            );


        $mensajeGenerico =
            'Si el correo corresponde a un participante registrado, recibirás un enlace para acceder a tu espacio personal.';


        if (
            $email === ''
            ||
            !filter_var(
                $email,
                FILTER_VALIDATE_EMAIL
            )
        ) {

            responder([
                'exito' => true,
                'mensaje' =>
                    $mensajeGenerico
            ]);
        }


        $stmtUsuario =
            $conn->prepare("
                SELECT
                    id

                FROM usuarios

                WHERE correo = ?

                LIMIT 1
            ");


        $stmtUsuario->execute([
            $email
        ]);


        $usuario =
            $stmtUsuario->fetch();


        if (!$usuario) {

            responder([
                'exito' => true,
                'mensaje' =>
                    $mensajeGenerico
            ]);
        }


        $usuarioId =
            (int)$usuario['id'];


        /* -----------------------------------------------------
           Anti-spam
           ----------------------------------------------------- */

        $stmtCooldown =
            $conn->prepare("
                SELECT
                    id

                FROM enlaces_edicion

                WHERE usuario_id = ?
                  AND usado_en IS NULL
                  AND expira_en > NOW()
                  AND created_at >
                      (
                          NOW()
                          - INTERVAL 5 MINUTE
                      )

                LIMIT 1
            ");


        $stmtCooldown->execute([
            $usuarioId
        ]);


        if ($stmtCooldown->fetch()) {

            responder([
                'exito' => true,
                'mensaje' =>
                    $mensajeGenerico
            ]);
        }


        /* -----------------------------------------------------
           Crear token
           ----------------------------------------------------- */

        $token =
            generarToken();


        $ip =
            $_SERVER['REMOTE_ADDR']
            ?? null;


        $stmtInsert =
            $conn->prepare("
                INSERT INTO enlaces_edicion (
                    usuario_id,
                    token,
                    expira_en,
                    ip_solicitud
                )
                VALUES (
                    ?,
                    ?,
                    NOW() + INTERVAL 24 HOUR,
                    ?
                )
            ");


        $stmtInsert->execute([
            $usuarioId,
            $token,
            $ip
        ]);


        /* -----------------------------------------------------
           Enviar correo
           ----------------------------------------------------- */

        try {

            enviarCorreoEdicionPerfil(
                $conn,
                $usuarioId,
                $token
            );

        } catch (Throwable $mailError) {

            error_log(
                '[API PUBLICA enlace_edicion.php][MAIL] '
                . get_class($mailError)
                . ' - '
                . $mailError->getMessage()
            );
        }


        responder([
            'exito' => true,
            'mensaje' =>
                $mensajeGenerico
        ]);
    }


    /* =====================================================
       GET
       OBTENER MI ENLACE DESDE SESIÓN
       
       Se utiliza desde:
       
       api/enlace_edicion.php?accion=mi_enlace
       
       Permite recuperar el enlace aunque el navegador
       haya perdido el sessionStorage.
       ===================================================== */

    if (
        $method === 'GET'
        &&
        (
            $_GET['accion']
            ?? ''
        ) === 'mi_enlace'
    ) {

        if (
            empty(
                $_SESSION['usuario_id']
            )
        ) {

            responder([
                'exito' => false,
                'autenticado' => false,
                'mensaje' =>
                    'No hay una sesión activa'
            ], 401);
        }


        $usuarioId =
            (int)$_SESSION['usuario_id'];


        $token =
            obtenerOCrearEnlaceSesion(
                $conn,
                $usuarioId
            );


        $enlace =
            'editar-perfil.html?token=' .
            urlencode($token);


        responder([
            'exito' => true,
            'autenticado' => true,
            'enlace' => $enlace
        ]);
    }


    /* =====================================================
       GET
       VALIDAR TOKEN + OBTENER ESPACIO PERSONAL
       ===================================================== */

    if ($method === 'GET') {

        $token =
            trim(
                (string)(
                    $_GET['token']
                    ?? ''
                )
            );


        if ($token === '') {

            responder([
                'exito' => false,
                'mensaje' =>
                    'Enlace inválido o expirado'
            ], 404);
        }


        /*
         * El token debe:
         *
         * 1. Existir.
         * 2. No estar revocado.
         * 3. No estar expirado.
         */

        $stmt =
            $conn->prepare("
                SELECT
                    e.usuario_id,

                    u.nombre,
                    u.apellido,
                    u.correo,
                    u.empresa,
                    u.cargo,
                    u.intereses,
                    u.busca,
                    u.descripcion,
                    u.foto_perfil

                FROM enlaces_edicion e

                JOIN usuarios u
                    ON u.id = e.usuario_id

                WHERE e.token = ?
                  AND e.usado_en IS NULL
                  AND e.expira_en > NOW()

                LIMIT 1
            ");


        $stmt->execute([
            $token
        ]);


        $registro =
            $stmt->fetch();


        if (!$registro) {

            responder([
                'exito' => false,
                'mensaje' =>
                    'Enlace inválido, revocado o expirado'
            ], 404);
        }


        $usuarioId =
            (int)$registro['usuario_id'];


        /*
         * El token demuestra que la persona
         * tiene acceso a este espacio.
         *
         * Creamos sesión.
         */

        session_regenerate_id(true);


        $_SESSION['usuario_id'] =
            $usuarioId;


        /*
         * Guardamos también el token utilizado.
         *
         * No reemplaza la validación del token.
         * Es solamente una referencia de sesión.
         */

        $_SESSION[
            'enlace_edicion_token'
        ] =
            $token;


        /*
         * Obtener solicitudes.
         */

        $solicitudes =
            obtenerSolicitudesUsuario(
                $conn,
                $usuarioId
            );


        /*
         * Nunca devolvemos el usuario_id.
         */

        unset(
            $registro['usuario_id']
        );


        responder([
            'exito' => true,

            'usuario' =>
                $registro,

            'solicitudes' =>
                $solicitudes
        ]);
    }


    /* =====================================================
       PUT
       ACTUALIZAR PERFIL
       ===================================================== */

    if ($method === 'PUT') {

        $data =
            leerJson();


        $token =
            trim(
                (string)(
                    $data['token']
                    ?? ''
                )
            );


        if ($token === '') {

            responder([
                'exito' => false,
                'mensaje' =>
                    'Enlace inválido o expirado'
            ], 404);
        }


        $conn->beginTransaction();


        /*
         * Bloqueamos el registro del token.
         *
         * También verificamos que:
         *
         * - exista
         * - no esté revocado
         * - no esté expirado
         */

        $stmtToken =
            $conn->prepare("
                SELECT
                    id,
                    usuario_id

                FROM enlaces_edicion

                WHERE token = ?
                  AND usado_en IS NULL
                  AND expira_en > NOW()

                FOR UPDATE
            ");


        $stmtToken->execute([
            $token
        ]);


        $enlace =
            $stmtToken->fetch();


        if (!$enlace) {

            $conn->rollBack();


            responder([
                'exito' => false,
                'mensaje' =>
                    'Enlace inválido, revocado o expirado'
            ], 404);
        }


        $usuarioId =
            (int)$enlace['usuario_id'];


        /* -----------------------------------------------------
           Whitelist de campos editables
           ----------------------------------------------------- */

        $set = [];
        $valores = [];


        foreach (
            $camposEditables
            as $campo
        ) {

            if (
                array_key_exists(
                    $campo,
                    $data
                )
            ) {

                $set[] =
                    "`$campo` = ?";


                $valores[] =
                    mb_substr(
                        trim(
                            (string)$data[$campo]
                        ),
                        0,
                        2000
                    );
            }
        }


        if (!$set) {

            $conn->rollBack();


            responder([
                'exito' => false,
                'mensaje' =>
                    'No se enviaron datos para actualizar'
            ], 400);
        }


        $valores[] =
            $usuarioId;


        $stmtUpdate =
            $conn->prepare("
                UPDATE usuarios

                SET " .
                    implode(
                        ', ',
                        $set
                    )
                    . "

                WHERE id = ?
            ");


        $stmtUpdate->execute(
            $valores
        );


        $conn->commit();


        responder([
            'exito' => true,
            'mensaje' =>
                'Perfil actualizado correctamente'
        ]);
    }


    /* =====================================================
       DELETE
       REVOCAR TOKEN PERSONAL
       ===================================================== */

    if ($method === 'DELETE') {

        $data =
            leerJson();


        $token =
            trim(
                (string)(
                    $data['token']
                    ?? ''
                )
            );


        if ($token === '') {

            responder([
                'exito' => false,
                'mensaje' =>
                    'Enlace inválido o expirado'
            ], 404);
        }


        $conn->beginTransaction();


        /*
         * Buscamos el token vigente
         * y bloqueamos el registro.
         */

        $stmtToken =
            $conn->prepare("
                SELECT
                    id,
                    usuario_id

                FROM enlaces_edicion

                WHERE token = ?
                  AND usado_en IS NULL
                  AND expira_en > NOW()

                FOR UPDATE
            ");


        $stmtToken->execute([
            $token
        ]);


        $enlace =
            $stmtToken->fetch();


        if (!$enlace) {

            $conn->rollBack();


            responder([
                'exito' => false,
                'mensaje' =>
                    'El enlace ya no está vigente'
            ], 404);
        }


        /*
         * Revocamos el token.
         */

        $stmtRevocar =
            $conn->prepare("
                UPDATE enlaces_edicion

                SET usado_en = NOW()

                WHERE id = ?
            ");


        $stmtRevocar->execute([
            (int)$enlace['id']
        ]);


        $conn->commit();


        /*
         * También destruimos la sesión actual.
         */

        destruirSesion();


        responder([
            'exito' => true,
            'mensaje' =>
                'El acceso personal fue revocado correctamente'
        ]);
    }


    /* =====================================================
       MÉTODO NO SOPORTADO
       ===================================================== */

    responder([
        'exito' => false,
        'mensaje' =>
            'Metodo no soportado'
    ], 405);


} catch (Throwable $e) {

    if (
        $conn->inTransaction()
    ) {

        $conn->rollBack();
    }


    error_log(
        '[API PUBLICA enlace_edicion.php] '
        . $e->getMessage()
    );


    responder([
        'exito' => false,
        'mensaje' =>
            'Error interno del servidor'
    ], 500);
}
