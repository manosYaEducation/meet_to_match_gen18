
<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function envValor($clave, $default = '')
{
    global $env;

    return $env[$clave] ?? $default;
}


function esEntornoLocal()
{
    $environment =
        envValor(
            'ENVIRONMENT',
            'local'
        );

    return in_array(
        $environment,
        [
            'local',
            'localhost',
            'development'
        ],
        true
    );
}


function baseUrlPoc()
{
    if (esEntornoLocal()) {

        return rtrim(
            envValor(
                'DEV_BASE_URL',
                'http://localhost/MeetToMatchGen18'
            ),
            '/'
        );

    }


    return rtrim(
        envValor(
            'BASE_URL',
            'https://test.matchcreativo.cl'
        ),
        '/'
    );
}


function correoHabilitado()
{
    return filter_var(
        envValor(
            'MAIL_ENABLED',
            'false'
        ),
        FILTER_VALIDATE_BOOLEAN
    );
}


/* =========================================================
   CONFIGURAR PHPMailer
   ========================================================= */

function configurarMailer()
{
    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->CharSet = 'UTF-8';

    $mail->Host =
        envValor('MAIL_HOST');

    $mail->SMTPAuth = true;

    $mail->Username =
        envValor('MAIL_USERNAME');

    $mail->Password =
        envValor('MAIL_PASSWORD');

    $mail->SMTPSecure =
        (
            (int) envValor(
                'MAIL_PORT',
                587
            ) === 465
        )
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;

    $mail->Port =
        (int) envValor(
            'MAIL_PORT',
            587
        );

    $mail->setFrom(
        envValor('MAIL_FROM'),
        envValor(
            'MAIL_FROM_NAME',
            'Meet to Match Gen18'
        )
    );

    $mail->isHTML(true);

    return $mail;
}


/* =========================================================
   OBTENER O CREAR ENLACE PERSONAL
   ========================================================= */

function obtenerOCrearEnlacePersonal(
    PDO $conn,
    int $usuarioId
) {

    /* ---------------------------------------------------------
       Buscar token vigente
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
       Crear nuevo token
       --------------------------------------------------------- */

    $token =
        bin2hex(
            random_bytes(32)
        );


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
   CORREO: EDITAR PERFIL
   ========================================================= */

function enviarCorreoEdicionPerfil(
    PDO $conn,
    int $usuarioId,
    string $token
) {

    if (!correoHabilitado()) {

        return [
            'enviado' => false,
            'mensaje' =>
                'Correo deshabilitado en .env'
        ];

    }


    $autoload =
        __DIR__ .
        '/../vendor/autoload.php';


    if (!file_exists($autoload)) {

        return [
            'enviado' => false,
            'mensaje' =>
                'Falta vendor/autoload.php. Ejecuta composer install.'
        ];

    }


    require_once $autoload;


    $stmt = $conn->prepare("
        SELECT
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


    if (
        !$usuario ||
        empty($usuario['correo'])
    ) {

        return [
            'enviado' => false,
            'mensaje' =>
                'No se encontro correo del usuario'
        ];

    }


    $nombreUsuario =
        trim(
            $usuario['nombre'] .
            ' ' .
            ($usuario['apellido'] ?? '')
        );


    $link =
        baseUrlPoc() .
        '/editar-perfil.html?correo=' .
        urlencode(
            $usuario['correo']
        ) .
        '&token=' .
        urlencode($token);


    try {

        $mail =
            configurarMailer();


        $mail->addAddress(
            $usuario['correo'],
            $nombreUsuario
        );


        $mail->Subject =
            'Tu perfil en Meet to Match';


        $mail->Body = "

            <div style=\"
                font-family:Arial,sans-serif;
                max-width:620px;
                margin:0 auto;
                color:#1f2933;
            \">

                <div style=\"
                    background:#3aa9dc;
                    color:white;
                    padding:20px 22px;
                \">

                    <h2 style=\"
                        margin:0;
                    \">
                        🎮 Meet to Match
                    </h2>

                </div>


                <div style=\"
                    padding:24px;
                    border:1px solid #d9e7ef;
                    border-top:0;
                \">

                    <p>
                        Hola
                        <strong>
                            " .
                            htmlspecialchars(
                                $nombreUsuario
                            ) .
                            "
                        </strong>,
                    </p>


                    <p>
                        Tu perfil ya es parte de
                        Meet to Match.
                    </p>


                    <p>
                        Puedes revisar y actualizar
                        tu información desde el siguiente
                        enlace.
                    </p>


                    <p style=\"
                        text-align:center;
                        margin:30px 0;
                    \">

                        <a
                            href=\"" .
                            htmlspecialchars(
                                $link
                            ) .
                            "\"
                            style=\"
                                background:#f58220;
                                color:white;
                                padding:13px 22px;
                                border-radius:999px;
                                text-decoration:none;
                                font-weight:bold;
                            \"
                        >
                            ✏️ Editar mi perfil
                        </a>

                    </p>


                    <p style=\"
                        font-size:12px;
                        color:#607080;
                    \">

                        Este enlace es personal y
                        tiene una duración limitada.

                    </p>

                </div>

            </div>

        ";


        $mail->send();


        return [
            'enviado' => true,
            'mensaje' =>
                'Correo enviado'
        ];


    } catch (MailException $e) {

        error_log(
            'Error enviando correo de edicion de perfil: ' .
            $e->getMessage()
        );


        return [
            'enviado' => false,
            'mensaje' =>
                'No se pudo enviar el correo: ' .
                $e->getMessage()
        ];

    }

}


/* =========================================================
   CORREO: NUEVA SOLICITUD DE REUNIÓN
   ========================================================= */

function enviarCorreoSolicitudReunion(
    PDO $conn,
    int $solicitudId
) {

    if (!correoHabilitado()) {

        return [
            'enviado' => false,
            'mensaje' =>
                'Correo deshabilitado en .env'
        ];

    }


    $autoload =
        __DIR__ .
        '/../vendor/autoload.php';


    if (!file_exists($autoload)) {

        return [
            'enviado' => false,
            'mensaje' =>
                'Falta vendor/autoload.php. Ejecuta composer install.'
        ];

    }


    require_once $autoload;


    /* ---------------------------------------------------------
       DATOS DE LA SOLICITUD
       --------------------------------------------------------- */

    $stmt = $conn->prepare("
        SELECT

            s.id,
            s.mensaje,
            s.disponibilidad_sugerida,

            b.inicio AS bloque_inicio,
            b.fin AS bloque_fin,

            e.nombre AS evento_nombre,

            sol.nombre AS solicitante_nombre,
            sol.apellido AS solicitante_apellido,
            sol.correo AS solicitante_correo,
            sol.empresa AS solicitante_empresa,
            sol.cargo AS solicitante_cargo,
            sol.descripcion AS solicitante_descripcion,

            rec.id AS receptor_id,
            rec.nombre AS receptor_nombre,
            rec.apellido AS receptor_apellido,
            rec.correo AS receptor_correo

        FROM solicitudes_reunion s

        LEFT JOIN bloques_horarios b
            ON b.id = s.bloque_horario_id

        LEFT JOIN eventos e
            ON e.id = b.evento_id

        JOIN usuarios sol
            ON sol.id = s.solicitante_id

        JOIN usuarios rec
            ON rec.id = s.receptor_id

        WHERE s.id = ?

        LIMIT 1
    ");


    $stmt->execute([
        $solicitudId
    ]);


    $solicitud =
        $stmt->fetch();


    if (
        !$solicitud ||
        empty(
            $solicitud['receptor_correo']
        )
    ) {

        return [
            'enviado' => false,
            'mensaje' =>
                'No se encontro correo del receptor'
        ];

    }


    /* ---------------------------------------------------------
       NOMBRES
       --------------------------------------------------------- */

    $nombreSolicitante =
        trim(
            $solicitud['solicitante_nombre'] .
            ' ' .
            (
                $solicitud['solicitante_apellido']
                ?? ''
            )
        );


    $nombreReceptor =
        trim(
            $solicitud['receptor_nombre'] .
            ' ' .
            (
                $solicitud['receptor_apellido']
                ?? ''
            )
        );


    /* ---------------------------------------------------------
       HORARIO
       --------------------------------------------------------- */

    if (
        !empty(
            $solicitud['bloque_inicio']
        ) &&
        !empty(
            $solicitud['bloque_fin']
        )
    ) {

        $inicio =
            new DateTimeImmutable(
                $solicitud['bloque_inicio']
            );


        $fin =
            new DateTimeImmutable(
                $solicitud['bloque_fin']
            );


        $fecha =
            $inicio->format(
                'd-m-Y'
            );


        $horaInicio =
            $inicio->format(
                'H:i'
            );


        $horaFin =
            $fin->format(
                'H:i'
            );


        $disponibilidad =
            $fecha .
            ' · ' .
            $horaInicio .
            ' - ' .
            $horaFin;


    } else {

        $disponibilidad =
            $solicitud[
                'disponibilidad_sugerida'
            ]
            ?: 'Horario no informado';

    }


    /* ---------------------------------------------------------
       EVENTO
       --------------------------------------------------------- */

    $eventoNombre =
        !empty(
            $solicitud['evento_nombre']
        )
        ? $solicitud['evento_nombre']
        : 'Evento Meet to Match';


    /* ---------------------------------------------------------
       ENLACE PERSONAL DEL RECEPTOR
       --------------------------------------------------------- */

    $tokenPersonal =
        obtenerOCrearEnlacePersonal(
            $conn,
            (int)$solicitud['receptor_id']
        );


    $linkPanel =
        baseUrlPoc() .
        '/editar-perfil.html?token=' .
        urlencode($tokenPersonal);


    /* ---------------------------------------------------------
       DATOS ESCAPADOS
       --------------------------------------------------------- */

    $nombreSolicitanteHtml =
        htmlspecialchars(
            $nombreSolicitante,
            ENT_QUOTES,
            'UTF-8'
        );


    $nombreReceptorHtml =
        htmlspecialchars(
            $nombreReceptor,
            ENT_QUOTES,
            'UTF-8'
        );


    $empresaHtml =
        htmlspecialchars(
            $solicitud[
                'solicitante_empresa'
            ] ?: 'No informado',
            ENT_QUOTES,
            'UTF-8'
        );


    $cargoHtml =
        htmlspecialchars(
            $solicitud[
                'solicitante_cargo'
            ] ?: 'No informado',
            ENT_QUOTES,
            'UTF-8'
        );


    $horarioHtml =
        htmlspecialchars(
            $disponibilidad,
            ENT_QUOTES,
            'UTF-8'
        );


    $eventoHtml =
        htmlspecialchars(
            $eventoNombre,
            ENT_QUOTES,
            'UTF-8'
        );


    $mensajeOriginal =
        trim(
            $solicitud['mensaje'] ?? ''
        );


    $mensajeHtml =
        $mensajeOriginal !== ''
        ? nl2br(
            htmlspecialchars(
                $mensajeOriginal,
                ENT_QUOTES,
                'UTF-8'
            )
        )
        : 'Sin mensaje adicional';


    $linkHtml =
        htmlspecialchars(
            $linkPanel,
            ENT_QUOTES,
            'UTF-8'
        );


    /* ---------------------------------------------------------
       ENVÍO
       --------------------------------------------------------- */

    try {

        $mail =
            configurarMailer();


        $mail->addAddress(
            $solicitud['receptor_correo'],
            $nombreReceptor
        );


        $mail->Subject =
            '🔥 Nueva invitación en Meet to Match';


        $mail->Body = "

            <div style=\"
                font-family:Arial,sans-serif;
                max-width:620px;
                margin:0 auto;
                color:#1f2933;
                background:#ffffff;
            \">


                <!-- HEADER -->

                <div style=\"
                    background:#111827;
                    color:white;
                    padding:24px 24px;
                \">

                    <div style=\"
                        font-size:13px;
                        opacity:.75;
                        margin-bottom:6px;
                    \">
                        MEET TO MATCH
                    </div>


                    <h1 style=\"
                        margin:0;
                        font-size:25px;
                    \">
                        🔥 Nueva invitación
                    </h1>

                </div>


                <!-- CONTENIDO -->

                <div style=\"
                    padding:26px 24px;
                    border:1px solid #e5e7eb;
                    border-top:0;
                \">


                    <p style=\"
                        margin-top:0;
                        font-size:16px;
                    \">

                        Hola
                        <strong>
                            {$nombreReceptorHtml}
                        </strong>,

                    </p>


                    <p style=\"
                        font-size:16px;
                        line-height:1.6;
                    \">

                        <strong>
                            {$nombreSolicitanteHtml}
                        </strong>
                        quiere encontrarse contigo
                        durante el evento.

                    </p>


                    <!-- TARJETA DE CONEXIÓN -->

                    <div style=\"
                        background:#f8fafc;
                        border:1px solid #dbe4ea;
                        border-radius:12px;
                        padding:20px;
                        margin:22px 0;
                    \">


                        <div style=\"
                            font-size:12px;
                            color:#64748b;
                            text-transform:uppercase;
                            letter-spacing:.5px;
                            margin-bottom:8px;
                        \">

                            🎮 {$eventoHtml}

                        </div>


                        <div style=\"
                            font-size:20px;
                            font-weight:bold;
                            color:#111827;
                            margin-bottom:16px;
                        \">

                            {$nombreSolicitanteHtml}

                        </div>


                        <div style=\"
                            margin-bottom:8px;
                        \">

                            🏢
                            <strong>
                                {$empresaHtml}
                            </strong>

                        </div>


                        <div style=\"
                            margin-bottom:8px;
                        \">

                            👤
                            {$cargoHtml}

                        </div>


                        <div style=\"
                            margin-bottom:8px;
                        \">

                            🕐
                            <strong>
                                {$horarioHtml}
                            </strong>

                        </div>


                        <div style=\"
                            margin-top:16px;
                            padding-top:16px;
                            border-top:1px solid #e2e8f0;
                            color:#475569;
                            line-height:1.6;
                        \">

                            <strong>
                                💬 Mensaje
                            </strong>

                            <br>

                            {$mensajeHtml}

                        </div>


                    </div>


                    <!-- LLAMADA A LA ACCIÓN -->

                    <div style=\"
                        text-align:center;
                        margin:30px 0 24px;
                    \">

                        <div style=\"
                            font-size:18px;
                            font-weight:bold;
                            color:#111827;
                            margin-bottom:8px;
                        \">

                            ¿Se enciende esta conexión?

                        </div>


                        <div style=\"
                            color:#64748b;
                            font-size:14px;
                            margin-bottom:20px;
                        \">

                            Revisa la invitación y decide
                            si quieres encontrarte.

                        </div>


                        <a
                            href=\"{$linkHtml}\"
                            style=\"
                                display:inline-block;
                                background:#f58220;
                                color:white;
                                padding:14px 26px;
                                border-radius:999px;
                                text-decoration:none;
                                font-weight:bold;
                                font-size:15px;
                            \"
                        >

                            ⚡ Encender conexión

                        </a>

                    </div>


                    <!-- SEGUNDA ACCIÓN -->

                    <div style=\"
                        text-align:center;
                        margin-bottom:24px;
                    \">

                        <a
                            href=\"{$linkHtml}\"
                            style=\"
                                color:#3aa9dc;
                                text-decoration:none;
                                font-weight:bold;
                                font-size:14px;
                            \"
                        >

                            👀 Ver perfil y decidir

                        </a>

                    </div>


                    <!-- FOOTER -->

                    <div style=\"
                        border-top:1px solid #e5e7eb;
                        padding-top:18px;
                        margin-top:24px;
                        color:#64748b;
                        font-size:12px;
                        line-height:1.6;
                    \">

                        Esta invitación corresponde a una
                        solicitud de reunión dentro de
                        Meet to Match.

                        <br><br>

                        Si no deseas participar,
                        simplemente puedes rechazar
                        la solicitud desde el panel.

                    </div>


                </div>

            </div>

        ";


        $mail->AltBody =
            "🔥 NUEVA INVITACIÓN - MEET TO MATCH\n\n" .

            "Hola " .
            $nombreReceptor .
            ",\n\n" .

            $nombreSolicitante .
            " quiere encontrarse contigo durante el evento.\n\n" .

            "Evento: " .
            $eventoNombre .
            "\n" .

            "Empresa: " .
            ($solicitud[
                'solicitante_empresa'
            ] ?: 'No informado') .
            "\n" .

            "Cargo: " .
            ($solicitud[
                'solicitante_cargo'
            ] ?: 'No informado') .
            "\n" .

            "Horario: " .
            $disponibilidad .
            "\n\n" .

            "Mensaje:\n" .
            ($mensajeOriginal ?: 'Sin mensaje adicional') .
            "\n\n" .

            "Revisa y responde aquí:\n" .
            $linkPanel;


        $mail->send();


        return [
            'enviado' => true,
            'mensaje' =>
                'Correo enviado'
        ];


    } catch (MailException $e) {

        error_log(
            'Error enviando correo MeetToMatch: ' .
            $e->getMessage()
        );


        return [
            'enviado' => false,
            'mensaje' =>
                'Solicitud guardada, pero no se pudo enviar correo: ' .
                $e->getMessage()
        ];

    }

}
