-- Esquema y datos demo de Meet to Match Gen18.
CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(180) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  fecha_inicio DATETIME NULL,
  fecha_fin DATETIME NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  empresa VARCHAR(150) NULL,
  cargo VARCHAR(120) NULL,
  tipo_usuario ENUM('Asistente','Expositor','Organizador') NOT NULL DEFAULT 'Asistente',
  intereses TEXT NULL,
  busca TEXT NULL,
  descripcion TEXT NULL,
  origen ENUM('manual','luma','demo') NOT NULL DEFAULT 'manual',
  luma_guest_id VARCHAR(100) NULL,
  telefono VARCHAR(50) NULL,
  luma_estado VARCHAR(40) NULL,
  luma_ticket VARCHAR(120) NULL,
  luma_checked_in_at DATETIME NULL,
  luma_qr_url TEXT NULL,
  luma_created_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuarios_evento (evento_id),
  INDEX idx_usuarios_origen (origen),
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bloques_horarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NULL,
  inicio DATETIME NOT NULL,
  fin DATETIME NOT NULL,
  etiqueta VARCHAR(120) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bloque_evento_inicio_fin (evento_id, inicio, fin),
  INDEX idx_bloques_inicio (inicio),
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS solicitudes_reunion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  solicitante_id INT NOT NULL,
  receptor_id INT NOT NULL,
  bloque_horario_id INT NULL,
  mensaje TEXT NULL,
  disponibilidad_sugerida VARCHAR(40) NULL,
  estado ENUM('Pendiente','Aceptada','Rechazada') NOT NULL DEFAULT 'Pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (bloque_horario_id) REFERENCES bloques_horarios(id) ON DELETE SET NULL,
  INDEX idx_solicitudes_bloque_estado (bloque_horario_id, estado)
);

CREATE TABLE IF NOT EXISTS importaciones_luma (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NULL,
  archivo VARCHAR(255) NOT NULL,
  filas_total INT NOT NULL DEFAULT 0,
  creados INT NOT NULL DEFAULT 0,
  actualizados INT NOT NULL DEFAULT 0,
  omitidos INT NOT NULL DEFAULT 0,
  errores INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
);

INSERT INTO eventos (nombre, slug, fecha_inicio, fecha_fin, activo)
VALUES ('Tecnologias Disruptivas', 'tecnologias-disruptivas', '2026-07-08 09:00:00', '2026-07-08 22:30:00', 1)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  fecha_inicio = COALESCE(eventos.fecha_inicio, VALUES(fecha_inicio)),
  fecha_fin = COALESCE(eventos.fecha_fin, VALUES(fecha_fin)),
  activo = VALUES(activo);

INSERT INTO usuarios (evento_id, nombre, apellido, correo, empresa, cargo, tipo_usuario, intereses, busca, descripcion, origen)
VALUES
((SELECT id FROM eventos WHERE slug = 'tecnologias-disruptivas'), 'Camila', 'Rojas', 'camila.expositora@example.com', 'Magallanes Lab', 'Expositora', 'Expositor', 'Innovacion, tecnologia, emprendimiento', 'Conectar con asistentes interesados en proyectos regionales', 'Charlista invitada del evento. Trabaja en iniciativas de innovacion y colaboracion.', 'demo'),
((SELECT id FROM eventos WHERE slug = 'tecnologias-disruptivas'), 'Javier', 'Murillo', 'javier.asistente@example.com', 'INACAP', 'Estudiante', 'Asistente', 'Desarrollo web, networking, startups', 'Contactar expositores y validar ideas de proyecto', 'Asistente interesado en tecnologia y oportunidades de colaboracion.', 'demo'),
((SELECT id FROM eventos WHERE slug = 'tecnologias-disruptivas'), 'Freddy', 'Vargas', 'freddy.asistente@example.com', 'INACAP', 'Estudiante', 'Asistente', 'UX, plataformas web, eventos', 'Conocer personas para futuros proyectos', 'Participante del evento enfocado en experiencias digitales.', 'demo')
ON DUPLICATE KEY UPDATE
  evento_id = VALUES(evento_id),
  empresa = VALUES(empresa),
  cargo = VALUES(cargo),
  tipo_usuario = VALUES(tipo_usuario),
  intereses = VALUES(intereses),
  busca = VALUES(busca),
  descripcion = VALUES(descripcion),
  origen = IF(usuarios.origen = 'luma', usuarios.origen, VALUES(origen));
