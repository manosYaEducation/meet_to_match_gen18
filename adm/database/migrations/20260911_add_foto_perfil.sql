-- Ejecutar UNA sola vez en la base de datos local y, después de probar, en producción.
ALTER TABLE usuarios
ADD COLUMN foto_perfil VARCHAR(255) NULL AFTER descripcion;
