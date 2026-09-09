<?php
require_once __DIR__ . '/../api/db.php';

function verificar($condicion, $mensaje)
{
    if (!$condicion) {
        throw new RuntimeException($mensaje);
    }
}

try {
    $correos = [
        'camila.expositora@example.com',
        'javier.asistente@example.com',
        'freddy.asistente@example.com'
    ];
    $marcadores = implode(',', array_fill(0, count($correos), '?'));
    $stmtUsuarios = $conn->prepare("SELECT id FROM usuarios WHERE correo IN ($marcadores) ORDER BY id");
    $stmtUsuarios->execute($correos);
    $usuarios = array_map('intval', $stmtUsuarios->fetchAll(PDO::FETCH_COLUMN));
    verificar(count($usuarios) === 3, 'Faltan los tres usuarios demo');

    $bloque = $conn->query('SELECT id, inicio, fin FROM bloques_horarios WHERE activo = 1 ORDER BY inicio LIMIT 1')->fetch();
    verificar((bool)$bloque, 'No hay bloques horarios activos');

    $conn->beginTransaction();
    $stmtInsert = $conn->prepare("
        INSERT INTO solicitudes_reunion
            (solicitante_id, receptor_id, bloque_horario_id, mensaje, disponibilidad_sugerida, estado)
        VALUES (?, ?, ?, 'Prueba automatizada con rollback', 'Prueba', 'Aceptada')
    ");
    $stmtInsert->execute([$usuarios[0], $usuarios[1], $bloque['id']]);
    $solicitudAceptadaId = (int)$conn->lastInsertId();

    $stmtCruce = $conn->prepare("
        SELECT s.id
        FROM solicitudes_reunion s
        JOIN bloques_horarios ocupado ON ocupado.id = s.bloque_horario_id
        WHERE s.id <> ?
          AND s.estado = 'Aceptada'
          AND ocupado.inicio < ?
          AND ocupado.fin > ?
          AND (s.solicitante_id IN (?, ?) OR s.receptor_id IN (?, ?))
        LIMIT 1
    ");
    $stmtCruce->execute([
        0,
        $bloque['fin'],
        $bloque['inicio'],
        $usuarios[0],
        $usuarios[2],
        $usuarios[0],
        $usuarios[2]
    ]);
    verificar((int)$stmtCruce->fetchColumn() === $solicitudAceptadaId, 'No se detecto la reunion superpuesta');

    $conn->rollBack();
    echo json_encode([
        'exito' => true,
        'bloque_probado' => $bloque,
        'mensaje' => 'Se detecto el cruce y la transaccion de prueba fue revertida'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
}
