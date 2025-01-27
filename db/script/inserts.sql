-- Inserciones para 'compania'
INSERT INTO compania (id, nombre, isDeleted) VALUES
(1, 'Primera Compañia', 0),
(2, 'Segunda Compañia', 0);
(3, 'Tercera Compañia', 0);
(4, 'Segunda Compañia', 0);


-- Inserciones para 'division'
INSERT INTO division (id, nombre, isDeleted) VALUES
(1, 'División1', 0),
(2, 'División2', 0);

-- Inserciones para 'subdivision'
INSERT INTO subdivision (id, division_id, nombre, isDeleted) VALUES
(1, 1, 'Subdivisión A', 0),
(2, 2, 'Subdivisión B', 0);

-- Inserciones para 'procedencia'
INSERT INTO procedencia (id, nombre, isDeleted) VALUES
(1, 'USA', 0),
(2, 'CHINA', 0);

-- Inserciones para 'tipo_maquina'
INSERT INTO tipo_maquina (id, nombre, isDeleted) VALUES
(1, 'Camión Bomba', 0),
(2, 'Auto Escala', 0);
(3, 'Bomba Nodriza', 0);
(4, 'Unidad de REscate', 0);

-- Inserciones para 'maquina'
INSERT INTO maquina (id, tipo_maquina_id, compania_id, disponible, codigo, patente, procedencia_id, isDeleted) VALUES
(1, 1, 1, 1, 'EX-100', 'BX-1', 1, 0),
(2, 2, 2, 1, 'RE-200', 'BT-3', 2, 0);

-- Inserciones para 'rol_personal'
INSERT INTO rol_personal (id, nombre, descripcion, isDeleted) VALUES
(1, 'Maquinista', 'Manejo de máquinas pesadas', 0),
(2, 'Teniente de Máquina', 'gestiona maquinas de una compañia', 0);
(2, 'Capitan', 'al mando de una compañia', 0);
(2, 'Inspector de material mayor', 'supervisa recuros de material mayor en cbo', 0);
(2, 'Comandante', 'a cargo del cbo', 0);
-- Inserciones para 'personal'
INSERT INTO personal (id, rol_personal_id, rut, nombre, apellido, isDeleted) VALUES
(1, 1, '11111111-1', 'Carlos', 'López', 0),
(2, 2, '22222222-2', 'Ana', 'Martínez', 0);

-- Inserciones para 'conductor_maquina'
INSERT INTO conductor_maquina (id, personal_id, maquina_id, isDeleted) VALUES
(1, 1, 1, 0),
(2, 1, 2, 0);

-- Inserciones para 'clave'
INSERT INTO clave (id, nombre, isDeleted) VALUES
(1, '10-0-7	', 0),
(2, '10-0-6', 0);

-- Inserciones para 'bitacora'
INSERT INTO bitacora (id, compania_id, conductor_id, maquina_id, clave_id, direccion, fh_salida, fh_llegada, km_salida, km_llegada, hmetro_salida, hmetro_llegada, hbomba_salida, hbomba_llegada, obs, isDeleted) VALUES
(1, 1, 1, 1, 1, 'emergencia ', '2023-10-01 08:00:00', '2023-10-01 17:00:00', 500, 560, 10, 18, 5, 9, 'Operación sin novedades', 0);

-- Inserciones para 'taller'
INSERT INTO taller (id, nombre, direccion, telefono, isDeleted) VALUES
(1, 'Taller Central', 'Av. Principal 1000', '123456789', 0),
(2, 'Taller Secundario', 'Calle Secundaria 200', '987654321', 0);



-- Inserciones para 'mantencion'
INSERT INTO mantencion (id, bitacora_id, maquina_id, taller_id, estado_mantencion_id, fec_inicio, fec_termino, isDeleted) VALUES
(1, 1, 1, 1, 1, '2023-10-02', '2023-10-03', 0);

-- Inserciones para 'tipo_mantencion'
INSERT INTO tipo_mantencion (id, nombre, isDeleted) VALUES
(1, 'Correctiva', 0),
(2, 'Preventiva', 0);

-- Inserciones para 'servicio'
INSERT INTO servicio (id, subdivision_id, descripcion, isDeleted) VALUES
(1, 1, 'Servicio de Lubricación', 0),
(2, 2, 'Servicio de Reparación', 0);

-- Inserciones para 'detalle_mantencion'
INSERT INTO detalle_mantencion (id, mantencion_id, tipo_mantencion_id, servicio_id, observacion, isDeleted) VALUES
(1, 1, 2, 1, 'Lubricación de partes móviles', 0);
