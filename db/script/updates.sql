-- MySQL Workbench Synchronization
-- Generated: 2024-12-03 01:19
-- Model: New Model
-- Version: 1.0
-- Project: Name of the project
-- Author: fabia

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `cbo_db_my` ;

CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8 ;

CREATE SCHEMA IF NOT EXISTS `cbo_db` DEFAULT CHARACTER SET utf8mb4 ;

CREATE TABLE IF NOT EXISTS `cbo_db`.`bitacora` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `compania_id` INT(11) NOT NULL,
  `conductor_id` INT(11) NOT NULL,
  `maquina_id` INT(11) NOT NULL,
  `clave_id` INT(11) NOT NULL,
  `direccion` VARCHAR(100) NOT NULL,
  `fh_salida` DATETIME NULL DEFAULT NULL,
  `fh_llegada` DATETIME NULL DEFAULT NULL,
  `km_salida` FLOAT(11) NOT NULL,
  `km_llegada` FLOAT(11) NOT NULL,
  `hmetro_salida` FLOAT(11) NOT NULL,
  `hmetro_llegada` FLOAT(11) NOT NULL,
  `hbomba_salida` FLOAT(11) NOT NULL,
  `hbomba_llegada` FLOAT(11) NOT NULL,
  `obs` VARCHAR(500) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_bitacora_compania1_idx` (`compania_id` ASC) VISIBLE,
  INDEX `fk_bitacora_conductor_maquina1_idx` (`conductor_id` ASC) VISIBLE,
  INDEX `fk_bitacora_clave1_idx` (`clave_id` ASC) VISIBLE,
  INDEX `fk_bitacora_maquina1_idx` (`maquina_id` ASC) VISIBLE,
  CONSTRAINT `fk_bitacora_clave1`
    FOREIGN KEY (`clave_id`)
    REFERENCES `cbo_db`.`clave` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `cbo_db`.`compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_conductor_maquina1`
    FOREIGN KEY (`conductor_id`)
    REFERENCES `cbo_db`.`conductor_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_maquina1`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `cbo_db`.`maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 89
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`carga_combustible` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `bitacora_id` INT(11) NOT NULL,
  `litros` FLOAT(11) NOT NULL,
  `valor_mon` INT(11) NOT NULL,
  `img_url` TEXT NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_carga_combustible_maquina_idx` (`bitacora_id` ASC) VISIBLE,
  CONSTRAINT `fk_carga_combustible_bitacora1`
    FOREIGN KEY (`bitacora_id`)
    REFERENCES `cbo_db`.`bitacora` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 19
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`clave` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`compania` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 14
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`conductor_maquina` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `personal_id` INT(11) NOT NULL,
  `maquina_id` INT(11) NOT NULL,
  `tipo_maquina_id` INT(11) NOT NULL,
  `ven_licencia` DATE NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_conductor_maquina_maquina_idx` (`maquina_id` ASC, `tipo_maquina_id` ASC) VISIBLE,
  INDEX `fk_conductor_maquina_personal_idx` (`personal_id` ASC) VISIBLE,
  INDEX `fk_conductor_maquina_tipo_maquina` (`tipo_maquina_id` ASC) VISIBLE,
  CONSTRAINT `fk_conductor_maquina_maquina`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `cbo_db`.`maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_conductor_maquina_personal`
    FOREIGN KEY (`personal_id`)
    REFERENCES `cbo_db`.`personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_conductor_maquina_tipo_maquina`
    FOREIGN KEY (`tipo_maquina_id`)
    REFERENCES `cbo_db`.`tipo_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 3
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`detalle_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `mantencion_id` INT(11) NOT NULL,
  `tipo_mantencion_id` INT(11) NOT NULL,
  `observacion` VARCHAR(500) NULL DEFAULT NULL,
  `servicio_id` INT(11) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_detalle_mantencion_mantencion1_idx` (`mantencion_id` ASC) VISIBLE,
  INDEX `fk_detalle_mantencion_tipo_mantencion1_idx` (`tipo_mantencion_id` ASC) VISIBLE,
  INDEX `fk_detalle_mantencion_servicio1_idx` (`servicio_id` ASC) VISIBLE,
  CONSTRAINT `fk_detalle_mantencion_mantencion1`
    FOREIGN KEY (`mantencion_id`)
    REFERENCES `cbo_db`.`mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_servicio1`
    FOREIGN KEY (`servicio_id`)
    REFERENCES `cbo_db`.`servicio` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_tipo_mantencion1`
    FOREIGN KEY (`tipo_mantencion_id`)
    REFERENCES `cbo_db`.`tipo_mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`division` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`estado_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 14
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `bitacora_id` INT(11) NOT NULL,
  `maquina_id` INT(11) NOT NULL,
  `taller_id` INT(11) NOT NULL,
  `estado_mantencion_id` INT(11) NOT NULL,
  `fec_inicio` DATE NULL DEFAULT NULL,
  `fec_termino` DATE NULL DEFAULT NULL,
  `ord_trabajo` VARCHAR(45) NOT NULL,
  `n_factura` INT(11) NULL DEFAULT NULL,
  `img_url` TEXT NULL DEFAULT NULL,
  `cost_ser` INT(11) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_mantenciones_carro1_idx` (`maquina_id` ASC) VISIBLE,
  INDEX `fk_mantencion_taller1_idx` (`taller_id` ASC) VISIBLE,
  INDEX `fk_mantencion_bitacora1_idx` (`bitacora_id` ASC) VISIBLE,
  INDEX `fk_mantencion_estado_mantencion1_idx` (`estado_mantencion_id` ASC) VISIBLE,
  CONSTRAINT `fk_mantencion_bitacora1`
    FOREIGN KEY (`bitacora_id`)
    REFERENCES `cbo_db`.`bitacora` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_estado_mantencion1`
    FOREIGN KEY (`estado_mantencion_id`)
    REFERENCES `cbo_db`.`estado_mantencion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_taller1`
    FOREIGN KEY (`taller_id`)
    REFERENCES `cbo_db`.`taller` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantenciones_carro1`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `cbo_db`.`maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 61
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`maquina` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `tipo_maquina_id` INT(11) NOT NULL,
  `compania_id` INT(11) NOT NULL,
  `disponible` TINYINT(1) NOT NULL DEFAULT 1,
  `codigo` VARCHAR(10) NOT NULL,
  `patente` VARCHAR(8) NOT NULL,
  `num_chasis` VARCHAR(17) NOT NULL,
  `vin` VARCHAR(17) NOT NULL,
  `bomba` TINYINT(1) NOT NULL,
  `hmetro_bomba` FLOAT(11) NOT NULL,
  `hmetro_motor` FLOAT(11) NOT NULL,
  `kmetraje` FLOAT(11) NOT NULL,
  `num_motor` VARCHAR(30) NOT NULL,
  `ven_patente` DATE NOT NULL,
  `procedencia_id` INT(11) NOT NULL,
  `cost_rev_tec` INT(11) NOT NULL,
  `ven_rev_tec` DATE NOT NULL,
  `cost_seg_auto` INT(11) NOT NULL,
  `ven_seg_auto` DATE NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  `img_url` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `patente_UNIQUE` (`patente` ASC) VISIBLE,
  INDEX `fk_maquina_tipo_maquina1_idx` (`tipo_maquina_id` ASC) VISIBLE,
  INDEX `fk_maquina_compania1_idx` (`compania_id` ASC) VISIBLE,
  INDEX `fk_maquina_procedencia1_idx` (`procedencia_id` ASC) VISIBLE,
  CONSTRAINT `fk_maquina_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `cbo_db`.`compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_procedencia1`
    FOREIGN KEY (`procedencia_id`)
    REFERENCES `cbo_db`.`procedencia` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_tipo_maquina1`
    FOREIGN KEY (`tipo_maquina_id`)
    REFERENCES `cbo_db`.`tipo_maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`personal` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `rol_personal_id` INT(11) NOT NULL,
  `rut` VARCHAR(13) NOT NULL,
  `nombre` VARCHAR(60) NOT NULL,
  `apellido` VARCHAR(60) NOT NULL,
  `compania_id` INT(11) NOT NULL,
  `fec_nac` DATE NOT NULL,
  `fec_ingreso` DATE NULL DEFAULT NULL,
  `img_url` TEXT NULL DEFAULT NULL,
  `obs` VARCHAR(500) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `rut_UNIQUE` (`rut` ASC) VISIBLE,
  INDEX `fk_personal_roles_personal_idx` (`rol_personal_id` ASC) VISIBLE,
  INDEX `fk_personal_compania1_idx` (`compania_id` ASC) VISIBLE,
  CONSTRAINT `fk_personal_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `cbo_db`.`compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_personal_roles_personal`
    FOREIGN KEY (`rol_personal_id`)
    REFERENCES `cbo_db`.`rol_personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 39
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`procedencia` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(30) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`proveedor` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`rol_personal` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(500) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 18
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`servicio` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `subdivision_id` INT(11) NOT NULL,
  `descripcion` VARCHAR(45) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_servicio_subdivision1_idx` (`subdivision_id` ASC) VISIBLE,
  CONSTRAINT `fk_servicio_subdivision1`
    FOREIGN KEY (`subdivision_id`)
    REFERENCES `cbo_db`.`subdivision` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`subdivision` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `division_id` INT(11) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_subdivision_division1_idx` (`division_id` ASC) VISIBLE,
  CONSTRAINT `fk_subdivision_division1`
    FOREIGN KEY (`division_id`)
    REFERENCES `cbo_db`.`division` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 4
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`taller` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `fono` VARCHAR(15) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`tipo_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`tipo_maquina` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `clasificacion` VARCHAR(50) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5
DEFAULT CHARACTER SET = utf8mb4;

CREATE TABLE IF NOT EXISTS `cbo_db`.`usuario` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `correo` VARCHAR(45) NOT NULL,
  `isVerified` TINYINT(1) NULL DEFAULT 0,
  `contrasena` VARCHAR(255) NOT NULL,
  `personal_id` INT(11) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_usuario_personal1_idx` (`personal_id` ASC) VISIBLE,
  CONSTRAINT `fk_usuario_personal1`
    FOREIGN KEY (`personal_id`)
    REFERENCES `cbo_db`.`personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 9
DEFAULT CHARACTER SET = utf8mb4;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
