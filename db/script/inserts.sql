-- Insertar compañías
INSERT INTO `compania` (`nombre`, `isDeleted`) VALUES
('Primera Compañía de Osorno', 0),
('Segunda Compañía de Osorno', 0),
('Tercera Compañía de Osorno', 0);

-- Insertar talleres
INSERT INTO `taller` (`nombre`, `fono`, `isDeleted`) VALUES
('Taller Central', '123456789', 0),
('Taller Norte', '987654321', 0),
('Taller Sur', '192837465', 0);

-- Insertar tipos de máquina
INSERT INTO `tipo_maquina` (`clasificacion`, `isDeleted`) VALUES
('Camión', 0),
('Motor', 0),
('Escalera', 0);

-- Insertar procedencias
INSERT INTO `procedencia` (`nombre`, `isDeleted`) VALUES
('Local', 0),
('Regional', 0),
('Nacional', 0);

-- Insertar estados de mantención
INSERT INTO `estado_mantencion` (`nombre`, `descripcion`, `isDeleted`) VALUES
('Pendiente', 'Mantención pendiente de realizar', 0),
('En Proceso', 'Mantención en proceso', 0),
('Completada', 'Mantención completada', 0);

-- Insertar divisiones
INSERT INTO `division` (`nombre`, `isDeleted`) VALUES
('Material Mayor', 0),           -- id: 1
('Material Menor', 0),          -- id: 2
('Telecomunicaciones', 0);      -- id: 3

-- Insertar subdivisiones
INSERT INTO `subdivision` (`division_id`, `nombre`, `isDeleted`) VALUES
(1, 'Carros Bomba', 0),        -- id: 1
(1, 'Carros Forestales', 0),   -- id: 2
(2, 'Equipos Hidráulicos', 0); -- id: 3

-- Insertar servicios (usando los IDs correctos de subdivision)
INSERT INTO `servicio` (`subdivision_id`, `descripcion`, `isDeleted`) VALUES
(1, 'Mantención Bomba', 0),
(2, 'Mantención Forestal', 0),
(3, 'Mantención Hidráulica', 0);

-- Insertar tipos de mantención
INSERT INTO `tipo_mantencion` (`nombre`, `isDeleted`) VALUES
('Preventiva', 0),
('Correctiva', 0),
('Predictiva', 0);

-- Insertar proveedores
INSERT INTO `proveedor` () VALUES
(), 
(); -- Agregar más proveedores según sea necesario
