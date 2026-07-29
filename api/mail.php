<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

function envValor($clave, $default = '')
{
    global $env;
    return $env[$clave] ?? $default;
}

function esEntornoLocal()
{
    $environment = envValor('ENVIRONMENT', 'local');
    return in_array($environment, ['local', 'localhost', 'development'], true);
}

function baseUrlPoc()
{
    if (esEntornoLocal()) {
        return rtrim(envValor('DEV_BASE_URL', 'http://localhost/MeetToMatchGen18'), '/');
    }

    return rtrim(envValor('BASE_URL', 'https://test.matchcreativo.cl'), '/');
}

function correoHabilitado()
{
    return filter_var(envValor('MAIL_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
}

function enviarCorreoSolicitudReunion(PDO $conn, int $solicitudId)
{
    if (!correoHabilitado()) {
        return ['enviado' => false, 'mensaje' => 'Correo deshabilitado en .env'];
    }

    $autoload = __DIR__ . '/../vendor/autoload.php';
    if (!file_exists($autoload)) {
        return ['enviado' => false, 'mensaje' => 'Falta vendor/autoload.php. Ejecuta composer install.'];
    }

    require_once $autoload;

    $stmt = $conn->prepare("
        SELECT
            s.id,
            s.mensaje,
            s.disponibilidad_sugerida,
            b.inicio AS bloque_inicio,
            b.fin AS bloque_fin,
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
        LEFT JOIN bloques_horarios b ON b.id = s.bloque_horario_id
        JOIN usuarios sol ON sol.id = s.solicitante_id
        JOIN usuarios rec ON rec.id = s.receptor_id
        WHERE s.id = ?
    ");
    $stmt->execute([$solicitudId]);
    $solicitud = $stmt->fetch();

    if (!$solicitud || empty($solicitud['receptor_correo'])) {
        return ['enviado' => false, 'mensaje' => 'No se encontro correo del receptor'];
    }

    $nombreSolicitante = trim($solicitud['solicitante_nombre'] . ' ' . ($solicitud['solicitante_apellido'] ?? ''));
    $nombreReceptor = trim($solicitud['receptor_nombre'] . ' ' . ($solicitud['receptor_apellido'] ?? ''));
    $linkPanel = baseUrlPoc() . '/solicitudes.html?usuario=' . urlencode((string)$solicitud['receptor_id']);
    if (!empty($solicitud['bloque_inicio']) && !empty($solicitud['bloque_fin'])) {
        $inicio = new DateTimeImmutable($solicitud['bloque_inicio']);
        $fin = new DateTimeImmutable($solicitud['bloque_fin']);
        $disponibilidad = $inicio->format('d-m-Y H:i') . ' - ' . $fin->format('H:i');
    } else {
        $disponibilidad = $solicitud['disponibilidad_sugerida'] ?: 'Horario no informado';
    }

    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->CharSet = 'UTF-8';
        $mail->Host = envValor('MAIL_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = envValor('MAIL_USERNAME');
        $mail->Password = envValor('MAIL_PASSWORD');
        $mail->SMTPSecure = ((int) envValor('MAIL_PORT', 587) === 465)
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = (int) envValor('MAIL_PORT', 587);

        $mail->setFrom(envValor('MAIL_FROM'), envValor('MAIL_FROM_NAME', 'Meet to Match Gen18'));
        $mail->addAddress($solicitud['receptor_correo'], $nombreReceptor);
        $mail->isHTML(true);
        $mail->Subject = 'Nueva solicitud de reunion - Meet to Match Gen18';
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1f2933;'>
                <div style='background:#3aa9dc; color:white; padding:18px 22px;'>
                    <h2 style='margin:0;'>Nueva solicitud de reunion</h2>
                </div>
                <div style='padding:22px; border:1px solid #d9e7ef; border-top:0;'>
                    <p>Hola <strong>" . htmlspecialchars($nombreReceptor) . "</strong>,</p>
                    <p><strong>" . htmlspecialchars($nombreSolicitante) . "</strong> quiere reunirse contigo durante el evento.</p>
                    <div style='background:#f4f9fc; padding:14px; border-left:4px solid #3aa9dc; margin:18px 0;'>
                        <p><strong>Empresa:</strong> " . htmlspecialchars($solicitud['solicitante_empresa'] ?? 'No informado') . "</p>
                        <p><strong>Cargo:</strong> " . htmlspecialchars($solicitud['solicitante_cargo'] ?? 'No informado') . "</p>
                        <p><strong>Horario solicitado:</strong> " . htmlspecialchars($disponibilidad) . "</p>
                        <p><strong>Mensaje:</strong><br>" . nl2br(htmlspecialchars($solicitud['mensaje'] ?: 'Sin mensaje adicional')) . "</p>
                    </div>
                    <p>Puedes revisar el perfil del solicitante y aceptar o rechazar desde el panel.</p>
                    <p style='text-align:center; margin:28px 0;'>
                        <a href='" . htmlspecialchars($linkPanel) . "' style='background:#f58220; color:white; padding:13px 22px; border-radius:6px; text-decoration:none; font-weight:bold;'>Ver solicitud</a>
                    </p>
                    <p style='font-size:12px; color:#607080;'>Si el boton no funciona, copia este enlace:<br>" . htmlspecialchars($linkPanel) . "</p>
                </div>
            </div>
        ";

        $mail->send();
        return ['enviado' => true, 'mensaje' => 'Correo enviado'];
    } catch (MailException $e) {
        error_log('Error enviando correo MeetToMatch: ' . $e->getMessage());
        return ['enviado' => false, 'mensaje' => 'Solicitud guardada, pero no se pudo enviar correo: ' . $e->getMessage()];
    }
}
