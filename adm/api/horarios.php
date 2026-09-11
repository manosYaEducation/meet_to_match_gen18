<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function enteroPositivo($valor)
{
    $numero = filter_var($valor, FILTER_VALIDATE_INT);
    return $numero !== false && $numero > 0 ? (int)$numero : null;
}

function fechaHoraValida($fecha, $hora)
{
    $valor = trim((string)$fecha) . ' ' . trim((string)$hora);
    $fechaHora = DateTimeImmutable::createFromFormat('!Y-m-d H:i', $valor);
    if (!$fechaHora || $fechaHora->format('Y-m-d H:i') !== $valor) {
        return null;
    }
    return $fechaHora;
}

try {
    if ($method === 'GET') {
        $solicitanteId = enteroPositivo($_GET['solicitante_id'] ?? null);
        $receptorId = enteroPositivo($_GET['receptor_id'] ?? null);
        $eventoId = enteroPositivo($_GET['evento_id'] ?? null);

        $participantes = array_values(array_unique(array_filter([$solicitanteId, $receptorId])));
        $params = [];
        $condicionConflicto = '0 = 1';

        if ($participantes) {
            $marcadores = implode(',', array_fill(0, count($participantes), '?'));

            $condicionConflicto = "
                s.estado = 'Aceptada'
                AND ocupado.inicio < b.fin
                AND ocupado.fin > b.inicio
                AND (
                    s.solicitante_id IN ($marcadores)
                    OR s.receptor_id IN ($marcadores)
                )
            ";

            $params = array_merge($params, $participantes, $participantes);
        }

        $whereEvento = '';
        if ($eventoId) {
            $whereEvento = 'AND b.evento_id = ?';
            $params[] = $eventoId;
        }

        $sql = "
            SELECT
                b.id,
                b.evento_id,
                b.inicio,
                b.fin,
                b.etiqueta,
                b.activo,
                e.nombre AS evento_nombre,

                /*
                 * Disponible sigue siendo contextual:
                 * revisa si alguno de los participantes
                 * ya tiene una reunion aceptada que se cruce.
                 */
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM solicitudes_reunion s
                        JOIN bloques_horarios ocupado
                            ON ocupado.id = s.bloque_horario_id
                        WHERE $condicionConflicto
                    )
                    THEN 0
                    ELSE 1
                END AS disponible,

                /*
                 * Cantidad global de reuniones aceptadas
                 * exactamente en este bloque.
                 */
                (
                    SELECT COUNT(*)
                    FROM solicitudes_reunion reuniones
                    WHERE reuniones.bloque_horario_id = b.id
                      AND reuniones.estado = 'Aceptada'
                ) AS total_reuniones,

                /*
                 * Estado global del bloque.
                 * No expone quien ocupa la reunion.
                 */
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM solicitudes_reunion reuniones_ocupadas
                        WHERE reuniones_ocupadas.bloque_horario_id = b.id
                          AND reuniones_ocupadas.estado = 'Aceptada'
                    )
                    THEN 1
                    ELSE 0
                END AS ocupado

            FROM bloques_horarios b
            LEFT JOIN eventos e ON e.id = b.evento_id

            WHERE b.activo = 1
            $whereEvento

            ORDER BY b.inicio ASC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $bloques = $stmt->fetchAll();

        foreach ($bloques as &$bloque) {
            $bloque['disponible'] = (bool)$bloque['disponible'];
            $bloque['activo'] = (bool)$bloque['activo'];
            $bloque['total_reuniones'] = (int)$bloque['total_reuniones'];
            $bloque['ocupado'] = (bool)$bloque['ocupado'];
        }
        unset($bloque);

        responder([
            'exito' => true,
            'bloques' => $bloques
        ]);
    }

    if ($method === 'POST') {
        $data = leerJson();
        $fecha = trim((string)($data['fecha'] ?? ''));
        $inicio = fechaHoraValida($fecha, $data['hora_inicio'] ?? '');
        $fin = fechaHoraValida($fecha, $data['hora_fin'] ?? '');
        $duracion = enteroPositivo($data['duracion_minutos'] ?? 30);
        $eventoId = enteroPositivo($data['evento_id'] ?? null);

        if (!$inicio || !$fin || !$duracion || $duracion < 15 || $duracion > 120) {
            responder([
                'exito' => false,
                'mensaje' => 'Fecha, horas o duracion invalidas'
            ], 400);
        }

        if ($inicio >= $fin) {
            responder([
                'exito' => false,
                'mensaje' => 'La hora de termino debe ser posterior al inicio'
            ], 400);
        }

        if (!$eventoId) {
            $eventoId = (int)$conn
                ->query("SELECT id FROM eventos WHERE activo = 1 ORDER BY id LIMIT 1")
                ->fetchColumn();
        }

        if (!$eventoId) {
            responder([
                'exito' => false,
                'mensaje' => 'No existe un evento activo'
            ], 409);
        }

        $creados = 0;
        $omitidos = 0;
        $cursor = $inicio;

        $conn->beginTransaction();

        $stmt = $conn->prepare("
            INSERT INTO bloques_horarios (
                evento_id,
                inicio,
                fin,
                etiqueta,
                activo
            )
            VALUES (?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE
                activo = 1,
                etiqueta = VALUES(etiqueta)
        ");

        $stmtCruce = $conn->prepare("
            SELECT id, inicio, fin
            FROM bloques_horarios
            WHERE evento_id = ?
              AND activo = 1
              AND inicio < ?
              AND fin > ?
            LIMIT 1
        ");

        while ($cursor < $fin) {
            $termino = $cursor->modify('+' . $duracion . ' minutes');

            if ($termino > $fin) {
                break;
            }

            $etiqueta = $cursor->format('H:i')
                . ' - '
                . $termino->format('H:i');

            $stmtCruce->execute([
                $eventoId,
                $termino->format('Y-m-d H:i:s'),
                $cursor->format('Y-m-d H:i:s')
            ]);

            $existente = $stmtCruce->fetch();

            if (
                $existente
                && (
                    $existente['inicio'] !== $cursor->format('Y-m-d H:i:s')
                    || $existente['fin'] !== $termino->format('Y-m-d H:i:s')
                )
            ) {
                $omitidos++;
                $cursor = $termino;
                continue;
            }

            $stmt->execute([
                $eventoId,
                $cursor->format('Y-m-d H:i:s'),
                $termino->format('Y-m-d H:i:s'),
                $etiqueta
            ]);

            $creados += $stmt->rowCount() === 1 ? 1 : 0;

            $cursor = $termino;
        }

        $conn->commit();

        responder([
            'exito' => true,
            'mensaje' => $creados
                ? "Se crearon $creados bloques horarios"
                    . ($omitidos
                        ? " y se omitieron $omitidos cruces"
                        : '')
                : (
                    $omitidos
                        ? "No se crearon bloques: $omitidos se superponian con la agenda"
                        : 'Los bloques ya existian y quedaron activos'
                ),
            'creados' => $creados,
            'omitidos' => $omitidos
        ]);
    }

    responder([
        'exito' => false,
        'mensaje' => 'Metodo no soportado'
    ], 405);

} catch (Exception $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    responder([
        'exito' => false,
        'mensaje' => $e->getMessage()
    ], 500);
}