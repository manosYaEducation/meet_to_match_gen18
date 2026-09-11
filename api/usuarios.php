<?php
require_once __DIR__ . '/../adm/api/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method !== 'GET') {
        responder([
            'exito' => false,
            'mensaje' => 'Metodo no soportado'
        ], 405);
    }

    /*
     * Campos permitidos en la API pública.
     *
     * IMPORTANTE:
     * - No incluir correo.
     * - No usar SELECT *.
     * - El ID puede ser público; no es un mecanismo de seguridad.
     */
    $camposPublicos = "
        id,
        nombre,
        apellido,
        empresa,
        cargo,
        tipo_usuario,
        intereses,
        busca,
        descripcion,
        foto_perfil
    ";

    /*
     * Consulta de un participante específico.
     */
    if (isset($_GET['id'])) {
        $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);

        if ($id === false || $id <= 0) {
            responder([
                'exito' => false,
                'mensaje' => 'ID de usuario invalido'
            ], 400);
        }

        $stmt = $conn->prepare("
            SELECT $camposPublicos
            FROM usuarios
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$id]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            responder([
                'exito' => false,
                'mensaje' => 'Usuario no encontrado'
            ], 404);
        }

        responder([
            'exito' => true,
            'usuario' => $usuario
        ]);
    }

    /*
     * Búsqueda pública.
     */
    $q = trim($_GET['q'] ?? '');

    if ($q !== '') {
        /*
         * Limitar la longitud evita búsquedas innecesariamente grandes.
         */
        $q = mb_substr($q, 0, 100);
        $like = '%' . $q . '%';

        $stmt = $conn->prepare("
            SELECT $camposPublicos
            FROM usuarios
            WHERE nombre LIKE ?
               OR apellido LIKE ?
               OR empresa LIKE ?
               OR cargo LIKE ?
               OR intereses LIKE ?
            ORDER BY
                FIELD(tipo_usuario, 'Expositor', 'Organizador', 'Asistente'),
                nombre,
                apellido
        ");

        $stmt->execute([
            $like,
            $like,
            $like,
            $like,
            $like
        ]);
    } else {
        /*
         * Listado público completo.
         */
        $stmt = $conn->query("
            SELECT $camposPublicos
            FROM usuarios
            ORDER BY
                FIELD(tipo_usuario, 'Expositor', 'Organizador', 'Asistente'),
                nombre,
                apellido
        ");
    }

    responder([
        'exito' => true,
        'usuarios' => $stmt->fetchAll()
    ]);

} catch (Throwable $e) {

    /*
     * El detalle técnico queda solamente en el servidor.
     * Nunca devolver errores SQL o información interna al navegador.
     */
    error_log('[API PUBLICA usuarios.php] ' . $e->getMessage());

    responder([
        'exito' => false,
        'mensaje' => 'Error interno del servidor'
    ], 500);
}