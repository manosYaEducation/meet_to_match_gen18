<?php
require_once __DIR__ . '/../adm/api/db.php';

$method = $_SERVER['REQUEST_METHOD'];

function enteroPositivo($valor)
{
    $numero = filter_var($valor, FILTER_VALIDATE_INT);

    return $numero !== false && $numero > 0
        ? (int)$numero
        : null;
}

try {
    if ($method !== 'GET') {
        responder([
            'exito' => false,
            'mensaje' => 'Metodo no soportado'
        ], 405);
    }

    $solicitanteId = enteroPositivo($_GET['solicitante_id'] ?? null);
    $receptorId = enteroPositivo($_GET['receptor_id'] ?? null);
    $eventoId = enteroPositivo($_GET['evento_id'] ?? null);

    /*
     * Los participantes consultados se utilizan solamente
     * para calcular conflictos de agenda.
     */
    $participantes = array_values(
        array_unique(
            array_filter([$solicitanteId, $receptorId])
        )
    );

    $params = [];
    $condicionConflicto = '0 = 1';

    if ($participantes) {
        $marcadores = implode(
            ',',
            array_fill(0, count($participantes), '?')
        );

        $condicionConflicto = "
            s.estado = 'Aceptada'
            AND ocupado.inicio < b.fin
            AND ocupado.fin > b.inicio
            AND (
                s.solicitante_id IN ($marcadores)
                OR s.receptor_id IN ($marcadores)
            )
        ";

        $params = array_merge(
            $params,
            $participantes,
            $participantes
        );
    }

    $whereEvento = '';

    if ($eventoId) {
        $whereEvento = 'AND b.evento_id = ?';
        $params[] = $eventoId;
    }

    /*
     * ocupado:
     * indica si el RECEPTOR consultado ya tiene
     * una reunión aceptada exactamente en este bloque.
     *
     * No indica si el bloque está ocupado por otra persona.
     */
    $condicionOcupado = '0 = 1';

    if ($receptorId) {
        $condicionOcupado = "
            reuniones_participante.estado = 'Aceptada'
            AND reuniones_participante.bloque_horario_id = b.id
            AND (
                reuniones_participante.solicitante_id = ?
                OR reuniones_participante.receptor_id = ?
            )
        ";

        $params[] = $receptorId;
        $params[] = $receptorId;
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

            (
                SELECT COUNT(*)
                FROM solicitudes_reunion reuniones
                WHERE reuniones.bloque_horario_id = b.id
                  AND reuniones.estado = 'Aceptada'
            ) AS total_reuniones,

            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM solicitudes_reunion reuniones_participante
                    WHERE $condicionOcupado
                )
                THEN 1
                ELSE 0
            END AS ocupado

        FROM bloques_horarios b

        LEFT JOIN eventos e
            ON e.id = b.evento_id

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

        /*
         * ocupado es contextual al participante consultado.
         */
        $bloque['ocupado'] = (bool)$bloque['ocupado'];
    }

    unset($bloque);

    responder([
        'exito' => true,
        'bloques' => $bloques
    ]);

} catch (Throwable $e) {

    error_log('[API PUBLICA horarios.php] ' . $e->getMessage());

    responder([
        'exito' => false,
        'mensaje' => 'Error interno del servidor'
    ], 500);
}