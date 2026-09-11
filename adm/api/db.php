<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responder($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function leerJson()
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $_POST;
}

function requerido($data, $campo)
{
    return isset($data[$campo]) && trim((string)$data[$campo]) !== '';
}

function tablaExiste(PDO $conn, $nameDb, $tabla)
{
    $stmt = $conn->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    ");
    $stmt->execute([$nameDb, $tabla]);
    return (int)$stmt->fetchColumn() > 0;
}

function columnaExiste(PDO $conn, $nameDb, $tabla, $columna)
{
    $stmt = $conn->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
    ");
    $stmt->execute([$nameDb, $tabla, $columna]);
    return (int)$stmt->fetchColumn() > 0;
}

function agregarColumnaSiFalta(PDO $conn, $nameDb, $tabla, $columna, $definicion)
{
    if (!columnaExiste($conn, $nameDb, $tabla, $columna)) {
        $conn->exec("ALTER TABLE `$tabla` ADD `$columna` $definicion");
    }
}

function indiceExiste(PDO $conn, $nameDb, $tabla, $indice)
{
    $stmt = $conn->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?
    ");
    $stmt->execute([$nameDb, $tabla, $indice]);
    return (int)$stmt->fetchColumn() > 0;
}

function agregarIndiceSiFalta(PDO $conn, $nameDb, $tabla, $indice, $columnas)
{
    if (!indiceExiste($conn, $nameDb, $tabla, $indice)) {
        $conn->exec("ALTER TABLE `$tabla` ADD INDEX `$indice` ($columnas)");
    }
}

function asegurarBloquesDemo(PDO $conn)
{
    $conn->exec("
        INSERT INTO eventos (nombre, slug, fecha_inicio, fecha_fin, activo)
        VALUES ('Tecnologias Disruptivas', 'tecnologias-disruptivas', '2026-07-08 09:00:00', '2026-07-08 22:30:00', 1)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          fecha_inicio = COALESCE(eventos.fecha_inicio, VALUES(fecha_inicio)),
          fecha_fin = COALESCE(eventos.fecha_fin, VALUES(fecha_fin)),
          activo = VALUES(activo)
    ");

    $stmtEvento = $conn->prepare('SELECT id FROM eventos WHERE slug = ? LIMIT 1');
    $stmtEvento->execute(['tecnologias-disruptivas']);
    $eventoId = (int)$stmtEvento->fetchColumn();
    if (!$eventoId) {
        return;
    }

    $stmtCantidad = $conn->prepare('SELECT COUNT(*) FROM bloques_horarios WHERE evento_id = ?');
    $stmtCantidad->execute([$eventoId]);
    if ((int)$stmtCantidad->fetchColumn() > 0) {
        return;
    }

    // El historico de Luma registra actividad el 8 de julio entre 09:00 y 22:30 (hora de Chile).
    $inicio = new DateTimeImmutable('2026-07-08 09:00:00');
    $finEvento = new DateTimeImmutable('2026-07-08 22:30:00');
    $stmtBloque = $conn->prepare("
        INSERT INTO bloques_horarios (evento_id, inicio, fin, etiqueta, activo)
        VALUES (?, ?, ?, ?, 1)
    ");

    while ($inicio < $finEvento) {
        $fin = $inicio->modify('+30 minutes');
        $etiqueta = $inicio->format('H:i') . ' - ' . $fin->format('H:i');
        $stmtBloque->execute([
            $eventoId,
            $inicio->format('Y-m-d H:i:s'),
            $fin->format('Y-m-d H:i:s'),
            $etiqueta
        ]);
        $inicio = $fin;
    }
}

function asegurarEsquema(PDO $conn, $nameDb)
{
    $conn->exec("
        CREATE TABLE IF NOT EXISTS eventos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(180) NOT NULL,
          slug VARCHAR(180) NOT NULL UNIQUE,
          fecha_inicio DATETIME NULL,
          fecha_fin DATETIME NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS bloques_horarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          evento_id INT NULL,
          inicio DATETIME NOT NULL,
          fin DATETIME NOT NULL,
          etiqueta VARCHAR(120) NULL,
          activo TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_bloque_evento_inicio_fin (evento_id, inicio, fin),
          INDEX idx_bloques_inicio (inicio),
          FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
        )
    ");

    if (tablaExiste($conn, $nameDb, 'solicitudes_reunion')) {
        agregarColumnaSiFalta($conn, $nameDb, 'solicitudes_reunion', 'bloque_horario_id', 'INT NULL AFTER receptor_id');
        agregarColumnaSiFalta($conn, $nameDb, 'solicitudes_reunion', 'disponibilidad_sugerida', 'VARCHAR(40) NULL AFTER mensaje');
        agregarIndiceSiFalta($conn, $nameDb, 'solicitudes_reunion', 'idx_solicitudes_bloque_estado', '`bloque_horario_id`, `estado`');
    }

    if (!tablaExiste($conn, $nameDb, 'usuarios')) {
        return;
    }

    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'evento_id', 'INT NULL AFTER id');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'origen', "ENUM('manual','luma','demo') NOT NULL DEFAULT 'manual' AFTER descripcion");
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'luma_guest_id', 'VARCHAR(100) NULL AFTER origen');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'telefono', 'VARCHAR(50) NULL AFTER luma_guest_id');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'luma_estado', 'VARCHAR(40) NULL AFTER telefono');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'luma_ticket', 'VARCHAR(120) NULL AFTER luma_estado');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'luma_checked_in_at', 'DATETIME NULL AFTER luma_ticket');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'luma_qr_url', 'TEXT NULL AFTER luma_checked_in_at');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'luma_created_at', 'DATETIME NULL AFTER luma_qr_url');
    agregarColumnaSiFalta($conn, $nameDb, 'usuarios', 'updated_at', 'TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at');

    $conn->exec("
        CREATE TABLE IF NOT EXISTS importaciones_luma (
          id INT AUTO_INCREMENT PRIMARY KEY,
          evento_id INT NULL,
          archivo VARCHAR(255) NOT NULL,
          filas_total INT NOT NULL DEFAULT 0,
          creados INT NOT NULL DEFAULT 0,
          actualizados INT NOT NULL DEFAULT 0,
          omitidos INT NOT NULL DEFAULT 0,
          errores INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_importaciones_evento (evento_id)
        )
    ");

    $conn->exec("
        CREATE TABLE IF NOT EXISTS enlaces_edicion (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          token CHAR(64) NOT NULL UNIQUE,
          expira_en DATETIME NOT NULL,
          usado_en DATETIME NULL DEFAULT NULL,
          ip_solicitud VARCHAR(64) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_enlaces_token (token),
          INDEX idx_enlaces_usuario (usuario_id),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    ");

    asegurarBloquesDemo($conn);
}

$envPath = __DIR__ . '/../.env';

if (!file_exists($envPath)) {
    responder(['exito' => false, 'mensaje' => 'No se encontro .env'], 500);
}

$env = parse_ini_file($envPath, false, INI_SCANNER_RAW);
$environment = $env['ENVIRONMENT'] ?? 'local';
$prefix = $environment === 'production' ? 'PROD' : 'DEV';

$host = $env[$prefix . '_DB_HOST'] ?? '127.0.0.1';
$port = $env[$prefix . '_DB_PORT'] ?? '3306';
$user = $env[$prefix . '_DB_USER'] ?? 'root';
$password = $env[$prefix . '_DB_PASSWORD'] ?? '';
$nameDb = $env[$prefix . '_DB_NAME'] ?? '';

try {
    $serverDsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $serverConn = new PDO($serverDsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $serverConn->exec("CREATE DATABASE IF NOT EXISTS `$nameDb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $dsn = "mysql:host=$host;port=$port;dbname=$nameDb;charset=utf8mb4";
    $conn = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $conn->exec('SET NAMES utf8mb4');
   // asegurarEsquema($conn, $nameDb);
} catch (Exception $e) {
    responder(['exito' => false, 'mensaje' => 'Error de conexion MySQL: ' . $e->getMessage()], 500);
}