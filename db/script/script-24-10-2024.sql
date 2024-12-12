-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema mydb_1
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mydb_1
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mydb_1` DEFAULT CHARACTER SET utf8 ;
USE `mydb_1` ;

-- -----------------------------------------------------
-- Table `clave`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `clave` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `compania`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `compania` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `procedencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `procedencia` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(30) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `tipo_maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipo_maquina` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `clasificacion` VARCHAR(50) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `maquina` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tipo_maquina_id` INT(11) NOT NULL,
  `compania_id` INT(11) NOT NULL,
  `img_url` TEXT NULL,
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
  `procedencia_id` INT(11) NOT NULL,
  `cost_rev_tec` INT(11) NOT NULL,
  `ven_rev_tec` DATE NOT NULL,
  `cost_seg_auto` INT(11) NOT NULL,
  `ven_seg_auto` DATE NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `patente_UNIQUE` (`patente` ASC) ,
  INDEX `fk_maquina_tipo_maquina1_idx` (`tipo_maquina_id` ASC) ,
  INDEX `fk_maquina_compania1_idx` (`compania_id` ASC) ,
  INDEX `fk_maquina_procedencia1_idx` (`procedencia_id` ASC) ,
  CONSTRAINT `fk_maquina_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_procedencia1`
    FOREIGN KEY (`procedencia_id`)
    REFERENCES `procedencia` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_tipo_maquina1`
    FOREIGN KEY (`tipo_maquina_id`)
    REFERENCES `tipo_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `rol_personal`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `rol_personal` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(500) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `personal`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `personal` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `rol_personal_id` INT(11) NOT NULL,
  `rut` VARCHAR(13) NOT NULL,
  `nombre` VARCHAR(60) NOT NULL,
  `apellido` VARCHAR(60) NOT NULL,
  `compania_id` INT(11) NOT NULL,
  `fec_nac` DATE NOT NULL,
  `img_url` TEXT NULL,
  `obs` VARCHAR(500) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_personal_roles_personal_idx` (`rol_personal_id` ASC) ,
  INDEX `fk_personal_compania1_idx` (`compania_id` ASC) ,
  CONSTRAINT `fk_personal_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_personal_roles_personal`
    FOREIGN KEY (`rol_personal_id`)
    REFERENCES `rol_personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `conductor_maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `conductor_maquina` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `personal_id` INT(11) NOT NULL,
  `maquina_id` INT(11) NOT NULL,
  `tipo_maquina_id` INT(11) NOT NULL,
  `ven_licencia` DATE NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_conductor_maquina_maquina_idx` (`maquina_id` ASC, `tipo_maquina_id` ASC) ,
  INDEX `fk_conductor_maquina_personal_idx` (`personal_id` ASC) ,
  INDEX `fk_conductor_maquina_tipo_maquina` (`tipo_maquina_id` ASC) ,
  CONSTRAINT `fk_conductor_maquina_maquina`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_conductor_maquina_personal`
    FOREIGN KEY (`personal_id`)
    REFERENCES `personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_conductor_maquina_tipo_maquina`
    FOREIGN KEY (`tipo_maquina_id`)
    REFERENCES `tipo_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `bitacora`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `bitacora` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `compania_id` INT(11) NOT NULL,
  `conductor_id` INT(11) NOT NULL,
  `direccion` VARCHAR(100) NOT NULL,
  `fecha` DATE NOT NULL,
  `h_salida` TIME NOT NULL,
  `h_llegada` TIME NOT NULL,
  `clave_id` INT(11) NOT NULL,
  `km_salida` FLOAT NOT NULL,
  `km_llegada` FLOAT NOT NULL,
  `hmetro_salida` FLOAT NOT NULL,
  `hmetro_llegada` FLOAT NOT NULL,
  `hbomba_salida` FLOAT NOT NULL,
  `hbomba_llegada` FLOAT NOT NULL,
  `obs` VARCHAR(500) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_bitacora_compania1_idx` (`compania_id` ASC) ,
  INDEX `fk_bitacora_conductor_maquina1_idx` (`conductor_id` ASC) ,
  INDEX `fk_bitacora_clave1_idx` (`clave_id` ASC) ,
  CONSTRAINT `fk_bitacora_clave1`
    FOREIGN KEY (`clave_id`)
    REFERENCES `clave` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_conductor_maquina1`
    FOREIGN KEY (`conductor_id`)
    REFERENCES `conductor_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `carga_combustible`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `carga_combustible` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `maquina_id` INT(11) NOT NULL,
  `litros` FLOAT NOT NULL,
  `valor_mon` INT(11) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_carga_combustible_maquina_idx` (`maquina_id` ASC) ,
  CONSTRAINT `fk_carga_combustible_maquina`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `estado_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `estado_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `taller`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `taller` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `fono` VARCHAR(15) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `bitacora_id` INT(11) NOT NULL,
  `maquina_id` INT(11) NOT NULL,
  `personal_id_responsable` INT(11) NOT NULL,
  `compania_id` INT(11) NOT NULL,
  `ord_trabajo` VARCHAR(45) NOT NULL,
  `n_factura` INT(11) NOT NULL,
  `cost_ser` INT(11) NOT NULL,
  `taller_id` INT(11) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  `estado_mantencion_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_mantenciones_carro1_idx` (`maquina_id` ASC) ,
  INDEX `fk_mantencion_personal1_idx` (`personal_id_responsable` ASC) ,
  INDEX `fk_mantencion_compania1_idx` (`compania_id` ASC) ,
  INDEX `fk_mantencion_taller1_idx` (`taller_id` ASC) ,
  INDEX `fk_mantencion_bitacora1_idx` (`bitacora_id` ASC) ,
  INDEX `fk_mantencion_estado_mantencion1_idx` (`estado_mantencion_id` ASC) ,
  CONSTRAINT `fk_mantencion_bitacora1`
    FOREIGN KEY (`bitacora_id`)
    REFERENCES `bitacora` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_estado_mantencion1`
    FOREIGN KEY (`estado_mantencion_id`)
    REFERENCES `estado_mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_personal1`
    FOREIGN KEY (`personal_id_responsable`)
    REFERENCES `personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_taller1`
    FOREIGN KEY (`taller_id`)
    REFERENCES `taller` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantenciones_carro1`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `division`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `division` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `subdivision`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `subdivision` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `division_id` INT(11) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_subdivision_division1_idx` (`division_id` ASC) ,
  CONSTRAINT `fk_subdivision_division1`
    FOREIGN KEY (`division_id`)
    REFERENCES `division` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `servicio`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `servicio` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `subdivision_id` INT(11) NOT NULL,
  `descripcion` VARCHAR(45) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_servicio_subdivision1_idx` (`subdivision_id` ASC) ,
  CONSTRAINT `fk_servicio_subdivision1`
    FOREIGN KEY (`subdivision_id`)
    REFERENCES `subdivision` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

AUTO_INCREMENT = 2
DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `tipo_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tipo_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `detalle_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalle_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `mantencion_id` INT(11) NOT NULL,
  `tipo_mantencion_id` INT(11) NOT NULL,
  `observacion` VARCHAR(500) NULL DEFAULT NULL,
  `servicio_id` INT(11) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_detalle_mantencion_mantencion1_idx` (`mantencion_id` ASC) ,
  INDEX `fk_detalle_mantencion_tipo_mantencion1_idx` (`tipo_mantencion_id` ASC) ,
  INDEX `fk_detalle_mantencion_servicio1_idx` (`servicio_id` ASC) ,
  CONSTRAINT `fk_detalle_mantencion_mantencion1`
    FOREIGN KEY (`mantencion_id`)
    REFERENCES `mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_servicio1`
    FOREIGN KEY (`servicio_id`)
    REFERENCES `servicio` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_tipo_mantencion1`
    FOREIGN KEY (`tipo_mantencion_id`)
    REFERENCES `tipo_mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `proveedor`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `proveedor` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`))

DEFAULT CHARACTER SET = utf8;


-- -----------------------------------------------------
-- Table `usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuario` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `correo` VARCHAR(45) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `personal_id` INT(11) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_usuario_personal1_idx` (`personal_id` ASC) ,
  CONSTRAINT `fk_usuario_personal1`
    FOREIGN KEY (`personal_id`)
    REFERENCES `personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)

AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
