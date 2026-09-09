<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $stmt = $conn->prepare('SELECT * FROM usuarios WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $usuario = $stmt->fetch();
            if (!$usuario) {
                responder(['exito' => false, 'mensaje' => 'Usuario no encontrado'], 404);
            }
            responder(['exito' => true, 'usuario' => $usuario]);
        }

        $q = trim($_GET['q'] ?? '');
        if ($q !== '') {
            $like = '%' . $q . '%';
            $stmt = $conn->prepare("
                SELECT * FROM usuarios
                WHERE nombre LIKE ?
                   OR apellido LIKE ?
                   OR empresa LIKE ?
                   OR cargo LIKE ?
                   OR intereses LIKE ?
                ORDER BY FIELD(tipo_usuario, 'Expositor', 'Organizador', 'Asistente'), nombre
            ");
            $stmt->execute([$like, $like, $like, $like, $like]);
        } else {
            $stmt = $conn->query("
                SELECT * FROM usuarios
                ORDER BY FIELD(tipo_usuario, 'Expositor', 'Organizador', 'Asistente'), nombre
            ");
        }

        responder(['exito' => true, 'usuarios' => $stmt->fetchAll()]);
    }

    if ($method === 'POST') {
        $data = leerJson();
        if (!requerido($data, 'nombre') || !requerido($data, 'correo') || !requerido($data, 'tipo_usuario')) {
            responder(['exito' => false, 'mensaje' => 'Nombre, correo y categoria de participante son obligatorios'], 400);
        }

        $tipo = trim((string)$data['tipo_usuario']);
        if (!in_array($tipo, ['Asistente', 'Expositor', 'Organizador'], true)) {
            responder(['exito' => false, 'mensaje' => 'Categoria de participante invalida'], 400);
        }

        $stmt = $conn->prepare("
            INSERT INTO usuarios (nombre, apellido, correo, empresa, cargo, tipo_usuario, intereses, busca, descripcion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                nombre = VALUES(nombre),
                apellido = VALUES(apellido),
                empresa = VALUES(empresa),
                cargo = VALUES(cargo),
                tipo_usuario = VALUES(tipo_usuario),
                intereses = VALUES(intereses),
                busca = VALUES(busca),
                descripcion = VALUES(descripcion)
        ");
        $stmt->execute([
            trim($data['nombre']),
            trim($data['apellido'] ?? ''),
            strtolower(trim($data['correo'])),
            trim($data['empresa'] ?? ''),
            trim($data['cargo'] ?? ''),
            $tipo,
            trim($data['intereses'] ?? ''),
            trim($data['busca'] ?? ''),
            trim($data['descripcion'] ?? '')
        ]);

        $stmtId = $conn->prepare('SELECT id FROM usuarios WHERE correo = ?');
        $stmtId->execute([strtolower(trim($data['correo']))]);
        $usuario = $stmtId->fetch();

        responder(['exito' => true, 'mensaje' => 'Perfil guardado', 'id' => (int)$usuario['id']]);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        $data = leerJson();
        if (!requerido($data, 'id')) {
            responder(['exito' => false, 'mensaje' => 'Falta id de usuario'], 400);
        }

        $actualStmt = $conn->prepare('SELECT * FROM usuarios WHERE id = ?');
        $actualStmt->execute([(int)$data['id']]);
        $actual = $actualStmt->fetch();
        if (!$actual) {
            responder(['exito' => false, 'mensaje' => 'Usuario no encontrado'], 404);
        }

        $tipo = $data['tipo_usuario'] ?? $actual['tipo_usuario'];
        if (!in_array($tipo, ['Asistente', 'Expositor', 'Organizador'], true)) {
            responder(['exito' => false, 'mensaje' => 'Tipo de usuario invalido'], 400);
        }

        $stmt = $conn->prepare("
            UPDATE usuarios
            SET nombre = ?, apellido = ?, correo = ?, empresa = ?, cargo = ?, tipo_usuario = ?,
                intereses = ?, busca = ?, descripcion = ?
            WHERE id = ?
        ");
        $stmt->execute([
            trim($data['nombre'] ?? $actual['nombre']),
            trim($data['apellido'] ?? $actual['apellido']),
            strtolower(trim($data['correo'] ?? $actual['correo'])),
            trim($data['empresa'] ?? $actual['empresa']),
            trim($data['cargo'] ?? $actual['cargo']),
            $tipo,
            trim($data['intereses'] ?? $actual['intereses']),
            trim($data['busca'] ?? $actual['busca']),
            trim($data['descripcion'] ?? $actual['descripcion']),
            (int)$data['id']
        ]);

        responder(['exito' => true, 'mensaje' => 'Usuario actualizado']);
    }

    if ($method === 'DELETE') {
        $data = leerJson();
        $id = $_GET['id'] ?? ($data['id'] ?? null);
        if (!$id) {
            responder(['exito' => false, 'mensaje' => 'Falta id de usuario'], 400);
        }

        $stmt = $conn->prepare('DELETE FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        responder(['exito' => true, 'mensaje' => 'Usuario eliminado']);
    }

    responder(['exito' => false, 'mensaje' => 'Metodo no soportado'], 405);
} catch (Exception $e) {
    responder(['exito' => false, 'mensaje' => $e->getMessage()], 500);
}
