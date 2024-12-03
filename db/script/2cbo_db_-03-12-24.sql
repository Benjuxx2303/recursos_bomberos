-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema cbo_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema cbo_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `cbo_db` DEFAULT CHARACTER SET utf8mb4 ;
USE `cbo_db` ;

-- -----------------------------------------------------
-- Table `cbo_db`.`clave`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`clave` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5;


-- -----------------------------------------------------
-- Table `cbo_db`.`compania`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`compania` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 14;


-- -----------------------------------------------------
-- Table `cbo_db`.`procedencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`procedencia` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(30) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5;


-- -----------------------------------------------------
-- Table `cbo_db`.`tipo_maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`tipo_maquina` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `clasificacion` VARCHAR(50) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5;


-- -----------------------------------------------------
-- Table `cbo_db`.`maquina`
-- -----------------------------------------------------
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
  `img_url` TEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `patente_UNIQUE` (`patente` ASC),
  INDEX `fk_maquina_tipo_maquina1_idx` (`tipo_maquina_id` ASC),
  INDEX `fk_maquina_compania1_idx` (`compania_id` ASC),
  INDEX `fk_maquina_procedencia1_idx` (`procedencia_id` ASC),
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
AUTO_INCREMENT = 9;


-- -----------------------------------------------------
-- Table `cbo_db`.`bitacora`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`bitacora` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `compania_id` INT(11) NOT NULL,
  `conductor_id` INT(11) NOT NULL,
  `maquina_id` INT(11) NOT NULL,
  `clave_id` INT(11) NOT NULL,
  `direccion` VARCHAR(100) NOT NULL,
  `fh_salida` DATETIME NULL DEFAULT NULL,
  `fh_llegada` DATETIME NULL DEFAULT NULL,
  `km_salida` FLOAT NOT NULL,
  `km_llegada` FLOAT NOT NULL,
  `hmetro_salida` FLOAT NOT NULL,
  `hmetro_llegada` FLOAT NOT NULL,
  `hbomba_salida` FLOAT NOT NULL,
  `hbomba_llegada` FLOAT NOT NULL,
  `obs` VARCHAR(500) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_bitacora_compania1_idx` (`compania_id` ASC),
  INDEX `fk_bitacora_clave1_idx` (`clave_id` ASC),
  INDEX `fk_bitacora_maquina1_idx` (`maquina_id` ASC),
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
  CONSTRAINT `fk_bitacora_maquina1`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `cbo_db`.`maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 89;


-- -----------------------------------------------------
-- Table `cbo_db`.`carga_combustible`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`carga_combustible` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `bitacora_id` INT(11) NOT NULL,
  `litros` FLOAT NOT NULL,
  `valor_mon` INT(11) NOT NULL,
  `img_url` TEXT NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_carga_combustible_maquina_idx` (`bitacora_id` ASC),
  CONSTRAINT `fk_carga_combustible_bitacora1`
    FOREIGN KEY (`bitacora_id`)
    REFERENCES `cbo_db`.`bitacora` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 19;


-- -----------------------------------------------------
-- Table `cbo_db`.`estado_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`estado_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 14;


-- -----------------------------------------------------
-- Table `cbo_db`.`taller`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`taller` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `fono` VARCHAR(15) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5;


-- -----------------------------------------------------
-- Table `cbo_db`.`mantencion`
-- -----------------------------------------------------
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
  INDEX `fk_mantenciones_carro1_idx` (`maquina_id` ASC),
  INDEX `fk_mantencion_taller1_idx` (`taller_id` ASC),
  INDEX `fk_mantencion_bitacora1_idx` (`bitacora_id` ASC),
  INDEX `fk_mantencion_estado_mantencion1_idx` (`estado_mantencion_id` ASC),
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
AUTO_INCREMENT = 61;


-- -----------------------------------------------------
-- Table `cbo_db`.`division`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`division` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 4;


-- -----------------------------------------------------
-- Table `cbo_db`.`subdivision`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`subdivision` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `division_id` INT(11) NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_subdivision_division1_idx` (`division_id` ASC),
  CONSTRAINT `fk_subdivision_division1`
    FOREIGN KEY (`division_id`)
    REFERENCES `cbo_db`.`division` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 4;


-- -----------------------------------------------------
-- Table `cbo_db`.`servicio`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`servicio` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `subdivision_id` INT(11) NOT NULL,
  `descripcion` VARCHAR(45) NULL DEFAULT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_servicio_subdivision1_idx` (`subdivision_id` ASC),
  CONSTRAINT `fk_servicio_subdivision1`
    FOREIGN KEY (`subdivision_id`)
    REFERENCES `cbo_db`.`subdivision` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 4;


-- -----------------------------------------------------
-- Table `cbo_db`.`tipo_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`tipo_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 5;


-- -----------------------------------------------------
-- Table `cbo_db`.`detalle_mantencion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`detalle_mantencion` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `mantencion_id` INT(11) NOT NULL,
  `tipo_mantencion_id` INT(11) NOT NULL,
  `observacion` VARCHAR(500) NULL DEFAULT NULL,
  `servicio_id` INT(11) NOT NULL,
  `isDeleted` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_detalle_mantencion_mantencion1_idx` (`mantencion_id` ASC),
  INDEX `fk_detalle_mantencion_tipo_mantencion1_idx` (`tipo_mantencion_id` ASC),
  INDEX `fk_detalle_mantencion_servicio1_idx` (`servicio_id` ASC),
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
AUTO_INCREMENT = 4;


-- -----------------------------------------------------
-- Table `cbo_db`.`cargo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`cargo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(45) NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cbo_db`.`personal`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`personal` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `rut` VARCHAR(13) NOT NULL,
  `nombre` VARCHAR(60) NOT NULL,
  `apellido` VARCHAR(60) NOT NULL,
  `compania_id` INT(11) NOT NULL,
  `fec_nac` DATE NOT NULL,
  `fec_ingreso` DATE NULL DEFAULT NULL,
  `img_url` TEXT NULL DEFAULT NULL,
  `obs` VARCHAR(500) NULL DEFAULT NULL,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isDeleted` TINYINT(1) NOT NULL,
  `cargo_id` INT NOT NULL,
  `venc_licencia` DATE NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `rut_UNIQUE` (`rut` ASC),
  INDEX `fk_personal_compania1_idx` (`compania_id` ASC),
  INDEX `fk_personal_cargo1_idx` (`cargo_id` ASC),
  CONSTRAINT `fk_personal_compania1`
    FOREIGN KEY (`compania_id`)
    REFERENCES `cbo_db`.`compania` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_personal_cargo1`
    FOREIGN KEY (`cargo_id`)
    REFERENCES `cbo_db`.`cargo` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 38;


-- -----------------------------------------------------
-- Table `cbo_db`.`rol`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`rol` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(500) NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
AUTO_INCREMENT = 18;


-- -----------------------------------------------------
-- Table `cbo_db`.`usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`usuario` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `correo` VARCHAR(45) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `personal_id` INT NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `eliminado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rol_id` INT NOT NULL,
  PRIMARY KEY (`id`, `rol_id`),
  INDEX `fk_usuario_personal1_idx` (`personal_id` ASC),
  UNIQUE INDEX `personal_id_UNIQUE` (`personal_id` ASC),
  INDEX `fk_usuario_rol1_idx` (`rol_id` ASC),
  CONSTRAINT `fk_usuario_personal1`
    FOREIGN KEY (`personal_id`)
    REFERENCES `cbo_db`.`personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_usuario_rol1`
    FOREIGN KEY (`rol_id`)
    REFERENCES `cbo_db`.`rol` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
AUTO_INCREMENT = 6;


-- -----------------------------------------------------
-- Table `cbo_db`.`permisos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`permisos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cbo_db`.`rol_permisos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`rol_permisos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `permisos_id` INT NOT NULL,
  `rol_id` INT NOT NULL,
  PRIMARY KEY (`id`, `permisos_id`, `rol_id`),
  INDEX `fk_Permisos_has_rol_personal_rol_personal1_idx` (`rol_id` ASC),
  INDEX `fk_Permisos_has_rol_personal_Permisos1_idx` (`permisos_id` ASC),
  CONSTRAINT `fk_Permisos_has_rol_personal_Permisos1`
    FOREIGN KEY (`permisos_id`)
    REFERENCES `cbo_db`.`permisos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Permisos_has_rol_personal_rol_personal1`
    FOREIGN KEY (`rol_id`)
    REFERENCES `cbo_db`.`rol` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cbo_db`.`auditoria`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`auditoria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `tabla_afectada` VARCHAR(45) NOT NULL,
  `registro_afectado_id` INT NOT NULL,
  `accion` VARCHAR(45) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `fecha` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_auditoria_usuario1_idx` (`usuario_id` ASC),
  CONSTRAINT `fk_auditoria_usuario1`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `cbo_db`.`usuario` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cbo_db`.`grupos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`grupos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `descripcion` TEXT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cbo_db`.`grupo_permisos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`grupo_permisos` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `permisos_id` INT NOT NULL,
  `grupos_id` INT NOT NULL,
  PRIMARY KEY (`id`, `permisos_id`, `grupos_id`),
  INDEX `fk_permisos_has_grupos_grupos1_idx` (`grupos_id` ASC),
  INDEX `fk_permisos_has_grupos_permisos1_idx` (`permisos_id` ASC),
  CONSTRAINT `fk_permisos_has_grupos_permisos1`
    FOREIGN KEY (`permisos_id`)
    REFERENCES `cbo_db`.`permisos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_permisos_has_grupos_grupos1`
    FOREIGN KEY (`grupos_id`)
    REFERENCES `cbo_db`.`grupos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cbo_db`.`usuario_grupo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`usuario_grupo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `grupos_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  PRIMARY KEY (`id`, `grupos_id`, `usuario_id`),
  INDEX `fk_grupos_has_usuario_usuario1_idx` (`usuario_id` ASC),
  INDEX `fk_grupos_has_usuario_grupos1_idx` (`grupos_id` ASC),
  CONSTRAINT `fk_grupos_has_usuario_grupos1`
    FOREIGN KEY (`grupos_id`)
    REFERENCES `cbo_db`.`grupos` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_grupos_has_usuario_usuario1`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `cbo_db`.`usuario` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `cbo_db`.`personal_maquina`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `cbo_db`.`personal_maquina` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `personal_id` INT(11) NOT NULL,
  `maquina_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`, `personal_id`, `maquina_id`),
  INDEX `fk_personal_has_maquina_maquina1_idx` (`maquina_id` ASC),
  INDEX `fk_personal_has_maquina_personal1_idx` (`personal_id` ASC),
  CONSTRAINT `fk_personal_has_maquina_personal1`
    FOREIGN KEY (`personal_id`)
    REFERENCES `cbo_db`.`personal` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_personal_has_maquina_maquina1`
    FOREIGN KEY (`maquina_id`)
    REFERENCES `cbo_db`.`maquina` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
-- begin attached script 'script'
CREATE TABLE auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_afectado_id INT NOT NULL,
    accion VARCHAR(20) NOT NULL,
    descripcion TEXT,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id)
        REFERENCES usuario (id)
);

-- end attached script 'script'