<?php

function lumaNormalizarEncabezado($valor)
{
    $valor = preg_replace('/^\xEF\xBB\xBF/', '', (string)$valor);
    $valor = strtolower(trim($valor));
    $convertido = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $valor);
    if ($convertido !== false) {
        $valor = $convertido;
    }
    return trim(preg_replace('/[^a-z0-9]+/', '_', $valor), '_');
}

function lumaDetectarDelimitador($linea)
{
    $candidatos = [',', ';', "\t"];
    $mejor = ',';
    $cantidad = -1;

    foreach ($candidatos as $candidato) {
        $actual = count(str_getcsv($linea, $candidato, '"', '\\'));
        if ($actual > $cantidad) {
            $mejor = $candidato;
            $cantidad = $actual;
        }
    }

    return $mejor;
}

function lumaLeerCsv($ruta)
{
    $handle = fopen($ruta, 'rb');
    if ($handle === false) {
        throw new RuntimeException('No se pudo abrir el archivo CSV.');
    }

    $primeraLinea = fgets($handle);
    if ($primeraLinea === false) {
        fclose($handle);
        throw new RuntimeException('El archivo CSV esta vacio.');
    }

    $delimitador = lumaDetectarDelimitador($primeraLinea);
    rewind($handle);
    $encabezados = fgetcsv($handle, 0, $delimitador, '"', '\\');
    $encabezados = array_map('lumaNormalizarEncabezado', $encabezados ?: []);

    if (!in_array('email', $encabezados, true)) {
        fclose($handle);
        throw new RuntimeException('El CSV no contiene la columna obligatoria email.');
    }
    if (!in_array('name', $encabezados, true) && !in_array('first_name', $encabezados, true)) {
        fclose($handle);
        throw new RuntimeException('El CSV debe contener name o first_name.');
    }

    $filas = [];
    $numero = 1;
    while (($valores = fgetcsv($handle, 0, $delimitador, '"', '\\')) !== false) {
        $numero++;
        if (count(array_filter($valores, static fn($valor) => trim((string)$valor) !== '')) === 0) {
            continue;
        }
        if (count($valores) !== count($encabezados)) {
            $filas[] = ['_fila' => $numero, '_error' => 'Cantidad de columnas invalida'];
            continue;
        }
        $fila = array_combine($encabezados, $valores);
        $fila['_fila'] = $numero;
        $filas[] = $fila;
    }

    fclose($handle);
    return $filas;
}

function lumaSepararNombre($fila)
{
    $nombre = trim((string)($fila['first_name'] ?? ''));
    $apellido = trim((string)($fila['last_name'] ?? ''));
    $completo = trim((string)($fila['name'] ?? ''));

    if ($nombre === '' && $completo !== '') {
        $partes = preg_split('/\s+/', $completo, 2);
        $nombre = $partes[0] ?? '';
        $apellido = $apellido !== '' ? $apellido : ($partes[1] ?? '');
    }

    return [$nombre, $apellido];
}

function lumaClasificarRol($fila)
{
    $texto = strtolower(trim(implode(' ', [
        $fila['role'] ?? '',
        $fila['tipo_usuario'] ?? '',
        $fila['tipo_participante'] ?? '',
        $fila['tipo_de_participante'] ?? '',
        $fila['categoria'] ?? '',
        $fila['category'] ?? '',
        $fila['ticket_name'] ?? '',
    ])));

    if (preg_match('/organizer|organizador|staff|production|produccion/', $texto)) {
        return 'Organizador';
    }
    if (preg_match('/exhibitor|expositor|speaker|ponente|charlista/', $texto)) {
        return 'Expositor';
    }
    return 'Asistente';
}

function lumaFechaMysql($valor)
{
    $valor = trim((string)$valor);
    if ($valor === '') {
        return null;
    }
    try {
        return (new DateTime($valor))->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return null;
    }
}
