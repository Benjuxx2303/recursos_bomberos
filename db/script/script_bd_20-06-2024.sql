-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `control_despacho_db` DEFAULT CHARACTER SET utf8 ;
USE `control_despacho_db` ;

-- -----------------------------------------------------
-- Table `rol_personal`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `rol_personal` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `desc` VARCHAR(500) NULL,
  PRIMARY KEY (`id`))


-- -----------------------------------------------------
-- Table `compania`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `compania` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `personal`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `personal` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rol_personal_id` INT NOT NULL,
  `rut` VARCHAR(13) NOT NULL,
  `nombre` VARCHAR(60) NOT NULL,
  `apellido` VARCHAR(60) NOT NULL,
  `activo` TINYINT(1) NOT NULL,
  `compania_id` INT NOT NULL,
  `fec_nac` DATE NOT NULL,
  `img_url` VARCHAR(500) NOT NULL,
  `obs` VARCHAR(500) NULL,
  PRIMARY KEY (`id`, `rol_personal_id`, `compania_id`),
  INDEX `fk_personal_roles_personal_idx` (`rol_personal_id` ASC) VISIBLE,
  INDEX `fk_personal_compania1_idx` (`compania_id` ASC) VISIBLE,
  CONSTRAINT `fk_personal_roles_personal`
    FOREIGN KEY (`rol_personal_id`)
    REFERENCES `rol_personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_personal_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `clave`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clave` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `tipo_maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipo_maquina` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `clasificacion` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `procedencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `procedencia` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `maquina` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo_maquina_id` INT NOT NULL,
  `compania_id` INT NOT NULL,
  `codigo` VARCHAR(10) NOT NULL,
  `patente` VARCHAR(8) NOT NULL,
  `num_chasis` VARCHAR(17) NOT NULL,
  `vin` VARCHAR(17) NOT NULL,
  `bomba` TINYINT(1) NOT NULL,
  `hmetro_bomba` FLOAT NOT NULL,
  `hmetro_motor` FLOAT NOT NULL,
  `kmetraje` FLOAT NOT NULL,
  `num_motor` VARCHAR(30) NOT NULL,
  `ven_patente` DATE NOT NULL,
  `procedencia_id` INT NOT NULL,
  `cost_rev_tec` INT NOT NULL,
  `ven_rev_tec` DATE NOT NULL,
  `cost_seg_auto` INT NOT NULL,
  `ven_seg_auto` DATE NOT NULL,
  PRIMARY KEY (`id`, `tipo_maquina_id`, `compania_id`, `procedencia_id`),
  UNIQUE INDEX `patente_UNIQUE` (`patente` ASC) VISIBLE,
  INDEX `fk_maquina_tipo_maquina1_idx` (`tipo_maquina_id` ASC) VISIBLE,
  INDEX `fk_maquina_compania1_idx` (`compania_id` ASC) VISIBLE,
  INDEX `fk_maquina_procedencia1_idx` (`procedencia_id` ASC) VISIBLE,
  CONSTRAINT `fk_maquina_tipo_maquina1`
    FOREIGN KEY (`tipo_maquina_id`)
    REFERENCES `tipo_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_procedencia1`
    FOREIGN KEY (`procedencia_id`)
    REFERENCES `procedencia` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `taller`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `taller` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `fono` VARCHAR(15) NOT NULL,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `conductor_maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `conductor_maquina` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `personal_id` INT NOT NULL,
  `rol_personal_id` INT NOT NULL,
  `maquina_id` INT NOT NULL,
  `tipo_maquina_id` INT NOT NULL,
  `ven_licencia` DATE NOT NULL,
  PRIMARY KEY (`id`, `personal_id`, `rol_personal_id`, `maquina_id`, `tipo_maquina_id`),
  INDEX `fk_personal_has_maquina_maquina1_idx` (`maquina_id` ASC, `tipo_maquina_id` ASC) VISIBLE,
  INDEX `fk_personal_has_maquina_personal1_idx` (`personal_id` ASC, `rol_personal_id` ASC) VISIBLE,
  CONSTRAINT `fk_personal_has_maquina_personal1`
    FOREIGN KEY (`personal_id` , `rol_personal_id`)
    REFERENCES `personal` (`id` , `rol_personal_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_personal_has_maquina_maquina1`
    FOREIGN KEY (`maquina_id` , `tipo_maquina_id`)
    REFERENCES `maquina` (`id` , `tipo_maquina_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `bitacora`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bitacora` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `compania_id` INT NOT NULL,
  `conductor_id` INT NOT NULL,
  `direccion` VARCHAR(100) NOT NULL,
  `fecha` DATE NOT NULL,
  `h_salida` TIME NOT NULL,
  `h_llegada` TIME NOT NULL,
  `clave_id` INT NOT NULL,
  `km_salida` FLOAT NOT NULL,
  `km_llegada` FLOAT NOT NULL,
  `hmetro_salida` FLOAT NOT NULL,
  `hmetro_llegada` FLOAT NOT NULL,
  `hbomba_salida` FLOAT NOT NULL,
  `hbomba_llegada` FLOAT NOT NULL,
  `obs` VARCHAR(500) NULL,
  PRIMARY KEY (`id`, `compania_id`, `conductor_id`, `clave_id`),
  INDEX `fk_bitacora_compania1_idx` (`compania_id` ASC) VISIBLE,
  INDEX `fk_bitacora_conductor_maquina1_idx` (`conductor_id` ASC) VISIBLE,
  INDEX `fk_bitacora_clave1_idx` (`clave_id` ASC) VISIBLE,
  CONSTRAINT `fk_bitacora_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_conductor_maquina1`
    FOREIGN KEY (`conductor_id`)
    REFERENCES `conductor_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_clave1`
    FOREIGN KEY (`clave_id`)
    REFERENCES `clave` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mantencion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `bitacora_id` INT NOT NULL,
  `maquina_id` INT NOT NULL,
  `personal_id_responsable` INT NOT NULL,
  `compania_id` INT NOT NULL,
  `ord_trabajo` VARCHAR(45) NOT NULL,
  `n_factura` INT NOT NULL,
  `cost_ser` INT NOT NULL,
  `taller_id` INT NOT NULL,
  PRIMARY KEY (`id`, `bitacora_id`, `maquina_id`, `personal_id_responsable`, `compania_id`, `taller_id`),
  INDEX `fk_mantenciones_carro1_idx` (`maquina_id` ASC) VISIBLE,
  INDEX `fk_mantencion_personal1_idx` (`personal_id_responsable` ASC) VISIBLE,
  INDEX `fk_mantencion_compania1_idx` (`compania_id` ASC) VISIBLE,
  INDEX `fk_mantencion_taller1_idx` (`taller_id` ASC) VISIBLE,
  INDEX `fk_mantencion_bitacora1_idx` (`bitacora_id` ASC) VISIBLE,
  CONSTRAINT `fk_mantenciones_carro1`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_personal1`
    FOREIGN KEY (`personal_id_responsable`)
    REFERENCES `personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_taller1`
    FOREIGN KEY (`taller_id`)
    REFERENCES `taller` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_bitacora1`
    FOREIGN KEY (`bitacora_id`)
    REFERENCES `bitacora` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `tipo_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipo_mantencion` (
  `id` INT NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuario` (
  `id` INT NOT NULL,
  `username` VARCHAR(45) NOT NULL,
  `correo` VARCHAR(45) NOT NULL,
  `contrasena` VARCHAR(45) NOT NULL,
  `personal_id` INT NOT NULL,
  `personal_roles_personal_id` INT NOT NULL,
  PRIMARY KEY (`id`, `personal_id`, `personal_roles_personal_id`),
  INDEX `fk_usuario_personal1_idx` (`personal_id` ASC, `personal_roles_personal_id` ASC) VISIBLE,
  CONSTRAINT `fk_usuario_personal1`
    FOREIGN KEY (`personal_id` , `personal_roles_personal_id`)
    REFERENCES `personal` (`id` , `rol_personal_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `division`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `division` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `subdivision`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `subdivision` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `division_id` INT NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`, `division_id`),
  INDEX `fk_subdivision_division1_idx` (`division_id` ASC) VISIBLE,
  CONSTRAINT `fk_subdivision_division1`
    FOREIGN KEY (`division_id`)
    REFERENCES `division` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `servicio`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `servicio` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `subdivision_id` INT NOT NULL,
  `division_id` INT NOT NULL,
  `descripcion` VARCHAR(45) NULL,
  PRIMARY KEY (`id`, `subdivision_id`, `division_id`),
  INDEX `fk_servicio_subdivision1_idx` (`subdivision_id` ASC, `division_id` ASC) VISIBLE,
  CONSTRAINT `fk_servicio_subdivision1`
    FOREIGN KEY (`subdivision_id` , `division_id`)
    REFERENCES `subdivision` (`id` , `division_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `detalle_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_mantencion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mantencion_id` INT NOT NULL,
  `tipo_mantencion_id` INT NOT NULL,
  `observacion` VARCHAR(500) NULL,
  `servicio_id` INT NOT NULL,
  `subdivision_id` INT NOT NULL,
  `division_id` INT NOT NULL,
  PRIMARY KEY (`id`, `mantencion_id`, `tipo_mantencion_id`, `servicio_id`, `subdivision_id`, `division_id`),
  INDEX `fk_detalle_mantencion_mantencion1_idx` (`mantencion_id` ASC) VISIBLE,
  INDEX `fk_detalle_mantencion_tipo_mantencion1_idx` (`tipo_mantencion_id` ASC) VISIBLE,
  INDEX `fk_detalle_mantencion_servicio1_idx` (`servicio_id` ASC, `subdivision_id` ASC, `division_id` ASC) VISIBLE,
  CONSTRAINT `fk_detalle_mantencion_mantencion1`
    FOREIGN KEY (`mantencion_id`)
    REFERENCES `mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_tipo_mantencion1`
    FOREIGN KEY (`tipo_mantencion_id`)
    REFERENCES `tipo_mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_servicio1`
    FOREIGN KEY (`servicio_id` , `subdivision_id` , `division_id`)
    REFERENCES `servicio` (`id` , `subdivision_id` , `division_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)



-- -----------------------------------------------------
-- Table `proveedor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `proveedor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`))



-- -----------------------------------------------------
-- Table `carga_combustible`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `carga_combustible` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `maquina_id` INT NOT NULL,
  `maquina_tipo_maquina_id` INT NOT NULL,
  `maquina_compania_id` INT NOT NULL,
  `maquina_procedencia_id` INT NOT NULL,
  `litros` FLOAT NOT NULL,
  `valor_mon` INT NOT NULL,
  PRIMARY KEY (`id`, `maquina_id`, `maquina_tipo_maquina_id`, `maquina_compania_id`, `maquina_procedencia_id`),
  INDEX `fk_carga_combustible_maquina1_idx` (`maquina_id` ASC, `maquina_tipo_maquina_id` ASC, `maquina_compania_id` ASC, `maquina_procedencia_id` ASC) VISIBLE,
  CONSTRAINT `fk_carga_combustible_maquina1`
    FOREIGN KEY (`maquina_id` , `maquina_tipo_maquina_id` , `maquina_compania_id` , `maquina_procedencia_id`)
    REFERENCES `maquina` (`id` , `tipo_maquina_id` , `compania_id` , `procedencia_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)