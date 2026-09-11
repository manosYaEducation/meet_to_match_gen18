<?php
require_once __DIR__ . '/db.php';

/*
 * Vista de administracion (Salon B2B, piso 2):
 * - Lista de eventos (para elegir que agenda ver).
 * - Bloques del evento, cada uno con TODAS las reuniones
 *   aceptadas que coinciden en ese horario (pueden ser varias
 *   en paralelo: mesas de conversacion, pasillo de 3 mesas,
 *   espacios de pitch, etc. No hay cupo maximo fijo).
 * - Solicitudes ACEPTADAS que quedaron sin bloque horario
 *   asignado (datos legados / de prueba).
 *
 * Solo para uso interno del panel admin.
 */

$method = $_SERVER['REQUEST_METHOD'];

function enteroPositivo($valor)
{
    $numero = filter_var($valor, FILTER_VALIDATE_INT);
    return $numero !== false && $numero > 0 ? (int)$numero : null;
}

try {

    if ($method !== 'GET') {
        responder(['exito' => false, 'mensaje' => 'Metodo no soportado'], 405);
    }

    $eventos = $conn->query("
        SELECT id, nombre, slug, activo
        FROM eventos
        ORDER BY fecha_inicio ASC, id ASC
    ")->fetchAll();

    $eventoId = enteroPositivo($_GET['evento_id'] ?? null);

    if (!$eventoId) {
        foreach ($eventos as $evento) {
            if ($evento['activo']) {
                $eventoId = (int)$evento['id'];
                break;
            }
        }
        if (!$eventoId && $eventos) {
            $eventoId = (int)$eventos[0]['id'];
        }
    }

    $bloques = [];

    if ($eventoId) {

        $stmtBloques = $conn->prepare("
            SELECT id AS bloque_id, inicio, fin, etiqueta
            FROM bloques_horarios
            WHERE activo = 1 AND evento_id = ?
            ORDER BY inicio ASC
        ");
        $stmtBloques->execute([$eventoId]);
        $bloques = $stmtBloques->fetchAll();

        $bloqueIds = array_column($bloques, 'bloque_id');

        $reunionesPorBloque = [];

        if ($bloqueIds) {

            $placeholders = implode(',', array_fill(0, count($bloqueIds), '?'));

            $stmtReuniones = $conn->prepare("
                SELECT
                    s.id AS solicitud_id,
                    s.bloque_horario_id,
                    s.mensaje,
                    sol.id AS solicitante_id,
                    sol.nombre AS solicitante_nombre,
                    sol.apellido AS solicitante_apellido,
                    sol.empresa AS solicitante_empresa,
                    sol.cargo AS solicitante_cargo,
                    sol.correo AS solicitante_correo,
                    rec.id AS receptor_id,
                    rec.nombre AS receptor_nombre,
                    rec.apellido AS receptor_apellido,
                    rec.empresa AS receptor_empresa,
                    rec.cargo AS receptor_cargo,
                    rec.correo AS receptor_correo
                FROM solicitudes_reunion s
                JOIN usuarios sol ON sol.id = s.solicitante_id
                JOIN usuarios rec ON rec.id = s.receptor_id
                WHERE s.estado = 'Aceptada'
                  AND s.bloque_horario_id IN ($placeholders)
            ");
            $stmtReuniones->execute($bloqueIds);

            foreach ($stmtReuniones->fetchAll() as $reunion) {
                $bId = (int)$reunion['bloque_horario_id'];
                if (!isset($reunionesPorBloque[$bId])) {
                    $reunionesPorBloque[$bId] = [];
                }
                $reunionesPorBloque[$bId][] = $reunion;
            }
        }

        foreach ($bloques as &$bloque) {
            $bloque['reuniones'] = $reunionesPorBloque[(int)$bloque['bloque_id']] ?? [];
            $bloque['total_reuniones'] = count($bloque['reuniones']);
        }
        unset($bloque);
    }

    /*
     * Solicitudes Aceptadas sin bloque_horario_id (legado / pruebas).
     */
    $huerfanas = $conn->query("
        SELECT
            s.id AS solicitud_id,
            s.estado,
            s.mensaje,
            s.created_at,
            sol.nombre AS solicitante_nombre,
            sol.apellido AS solicitante_apellido,
            rec.nombre AS receptor_nombre,
            rec.apellido AS receptor_apellido
        FROM solicitudes_reunion s
        JOIN usuarios sol ON sol.id = s.solicitante_id
        JOIN usuarios rec ON rec.id = s.receptor_id
        WHERE s.estado = 'Aceptada' AND s.bloque_horario_id IS NULL
        ORDER BY s.created_at DESC
    ")->fetchAll();

    responder([
        'exito' => true,
        'eventos' => $eventos,
        'evento_id' => $eventoId,
        'bloques' => $bloques,
        'solicitudes_sin_horario' => $huerfanas
    ]);

} catch (Throwable $e) {
    error_log('[adm/api/agenda.php] ' . $e->getMessage());
    responder(['exito' => false, 'mensaje' => 'Error interno del servidor'], 500);
}