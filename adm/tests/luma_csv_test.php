<?php
require_once __DIR__ . '/../api/luma_csv.php';

$filas = lumaLeerCsv(__DIR__ . '/../datos/luma_participantes_demo.csv');
$esperados = ['Asistente', 'Expositor', 'Organizador', 'Asistente'];

if (count($filas) !== 4) {
    throw new RuntimeException('Se esperaban 4 filas demo.');
}

foreach ($filas as $indice => $fila) {
    if (lumaClasificarRol($fila) !== $esperados[$indice]) {
        throw new RuntimeException('Clasificacion incorrecta en la fila ' . ($indice + 2));
    }
    [$nombre] = lumaSepararNombre($fila);
    if ($nombre === '' || !filter_var($fila['email'], FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException('Datos invalidos en la fila ' . ($indice + 2));
    }
}

if (lumaNormalizarEncabezado('Tipo de participante') !== 'tipo_de_participante') {
    throw new RuntimeException('No se normalizo la columna Tipo de participante.');
}
if (lumaClasificarRol(['tipo_de_participante' => 'Organizador']) !== 'Organizador') {
    throw new RuntimeException('No se reconocio la categoria personalizada de Luma.');
}

echo "OK: lectura y clasificacion Luma\n";

if (isset($argv[1])) {
    $reales = lumaLeerCsv($argv[1]);
    $roles = array_count_values(array_map('lumaClasificarRol', $reales));
    $estados = array_count_values(array_map(
        static fn($fila) => strtolower(trim((string)($fila['approval_status'] ?? 'sin estado'))),
        $reales
    ));
    echo json_encode([
        'filas' => count($reales),
        'roles' => $roles,
        'estados' => $estados,
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
