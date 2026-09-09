<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$ruta = $argv[1] ?? '';
if ($ruta === '' || !is_file($ruta)) {
    fwrite(STDERR, "Uso: php scripts/importar_luma_cli.php ruta/al/archivo.csv [--incluir-no-aprobados]\n");
    exit(1);
}

$_SERVER['REQUEST_METHOD'] = 'POST';
$_FILES['archivo'] = [
    'name' => basename($ruta),
    'type' => 'text/csv',
    'tmp_name' => $ruta,
    'error' => UPLOAD_ERR_OK,
    'size' => filesize($ruta),
];
$_POST['incluir_no_aprobados'] = in_array('--incluir-no-aprobados', $argv, true) ? '1' : '0';

require __DIR__ . '/../api/importar_luma.php';
