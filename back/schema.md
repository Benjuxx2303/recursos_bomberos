# Esquema de Base de Datos `cbo_db`

## Tablas Principales

### `maquina`
- `id` (PK)
- `nombre`
- `disponible`
- `codigo`
- `patente`
- `procedencia_id` (FK)
- `modelo_id` (FK)
- `compania_id` (FK)
- `num_chasis`
- `num_motor`
- `vin`
- `peso_kg`
- `bomba`
- `hmetro_bomba`
- `hmetro_motor`
- `kmetraje`
- `ven_patente`
- `cost_rev_tec`
- `ven_rev_tec`
- `cost_seg_auto`
- `ven_seg_auto`
- `img_url`
- `img_rev_tecnica`
- `img_seguro`
- `img_permiso_circulacion`
- `isDeleted`
- `imgFrontal`
- `imgLateralIzquierda`
- `imgLateralDerecha`
- `imgTrasera`

### `bitacora`
- `id` (PK)
- `compania_id` (FK)
- `personal_id` (FK)
- `maquina_id` (FK)
- `clave_id` (FK)
- `direccion`
- `fh_salida`
- `fh_llegada`
- `km_salida`
- `km_llegada`
- `hmetro_salida`
- `hmetro_llegada`
- `hbomba_salida`
- `hbomba_llegada`
- `obs`
- `isDeleted`
- `createdAt`
- `disponible`
- `enCurso`
- `minutos_duracion`

### `mantencion`
- `id` (PK)
- `bitacora_id` (FK)
- `maquina_id` (FK)
- `taller_id` (FK)
- `estado_mantencion_id` (FK)
- `tipo_mantencion_id` (FK)
- `fec_inicio`
- `fec_termino`
- `ord_trabajo`
- `n_factura`
- `img_url`
- `cost_ser`
- `aprobada_por`
- `fecha_aprobacion`
- `aprobada`
- `descripcion`
- `personal_responsable_id` (FK)
- `createdAt`
- `isDeleted`
- `ingresada_por`

### `personal`
- `id` (PK)
- `disponible`
- `rol_personal_id` (FK)
- `compania_id` (FK)
- `nombre`
- `apellido`
- `rut`
- `correo`
- `celular`
- `fec_nac`
- `fec_ingreso`
- `ultima_fec_servicio`
- `obs`
- `ven_licencia`
- `imgLicencia`
- `img_url`
- `isDeleted`
- `minutosConducidos`
- `imgReversaLicencia`

## Tablas Secundarias

### `carga_combustible`
- `id` (PK)
- `bitacora_id` (FK)
- `litros`
- `valor_mon`
- `img_url`
- `isDeleted`
- `createdAt`

### `conductor_maquina`
- `id` (PK)
- `personal_id` (FK)
- `maquina_id` (FK)


### `modelo`
- `id` (PK)
- `nombre`
- `marca_id` (FK)
- `tipo_maquina_id` (FK)
- `isDeleted`
- `img_url`
- `peso_kg`

### `usuario`
- `id` (PK)
- `username`
- `correo`
- `isVerified`
- `contrasena`
- `personal_id` (FK)
- `isDeleted`
- `reset_token`
- `reset_token_expires`

## Tablas de Relación/Catálogo

- `id` (PK)
- `nombre`
- `isDeleted`

### `clave`
- `id` (PK)
- `nombre`
- `descripcion`
- `tipo_clave_id` (FK)
- `isDeleted`

### `compania`
- `id` (PK)
- `nombre`
- `img_url`
- `direccion`
- `isDeleted`

### `detalle_mantencion`
- `id` (PK)
- `mantencion_id` (FK)
- `servicio_id` (FK)
- `observacion`
- `isDeleted`

### `estado_mantencion`
- `id` (PK)
- `nombre`
- `descripcion`
- `isDeleted`

### `marca`
- `id` (PK)
- `nombre`
- `isDeleted`

### `permiso`
- `id` (PK)
- `nombre`
- `descripcion`
- `isDeleted`
- `categoria_id` (FK)

### `procedencia`
- `id` (PK)
- `nombre`
- `isDeleted`

### `rol_permisos`
- `id` (PK)
- `rol_personal_id` (FK)
- `permiso_id` (FK)
- `isDeleted`

### `rol_personal`
- `id` (PK)
- `nombre`
- `descripcion`
- `isDeleted`



### `taller`
- `id` (PK)
- `tipo`
- `razon_social`
- `rut`
- `telefono`
- `contacto`
- `tel_contacto`
- `descripcion`
- `direccion`
- `correo`
- `isDeleted`
- `nombre`
- `tipo_taller_id` (FK)

### `tipo_clave`
- `id` (PK)
- `nombre`
- `isDeleted`

### `tipo_mantencion`
- `id` (PK)
- `nombre`
- `isDeleted`

### `tipo_maquina`
- `id` (PK)
- `nombre`
- `descripcion`
- `isDeleted`

### `tipo_taller`
- `id` (PK)
- `nombre`

