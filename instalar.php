<?php
require_once __DIR__ . '/api/db.php';

$sqlPath = __DIR__ . '/database/schema.sql';

if (!file_exists($sqlPath)) {
    responder(['exito' => false, 'mensaje' => 'No se encontro database/schema.sql'], 500);
}

try {
    $sql = file_get_contents($sqlPath);
    $conn->exec($sql);
    asegurarEsquema($conn, $nameDb);
    responder([
        'exito' => true,
        'mensaje' => 'Tablas POC creadas y datos demo cargados',
        'siguiente_paso' => 'Abrir registro.html'
    ]);
} catch (Exception $e) {
    responder(['exito' => false, 'mensaje' => $e->getMessage()], 500);
}
