-- MySQL Workbench Synchronization
-- Generated: 2024-12-08 16:53
-- Model: New Model
-- Version: 1.0
-- Project: Name of the project
-- Author: fabia

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

ALTER TABLE `cbo_db`.`mantencion` 
DROP FOREIGN KEY `fk_mantencion_estado_mantencion1`;

ALTER TABLE `cbo_db`.`clave` 
DROP COLUMN `codigo`,
ADD COLUMN `nombre` VARCHAR(15) NOT NULL AFTER `id`;

ALTER TABLE `cbo_db`.`compania` 
ADD COLUMN `img_url` TEXT NULL DEFAULT NULL AFTER `nombre`,
ADD COLUMN `direccion` VARCHAR(100) NULL DEFAULT NULL AFTER `img_url`;

ALTER TABLE `cbo_db`.`mantencion` 
ADD COLUMN `tipo_mantencion_id` INT(11) NOT NULL AFTER `estado_mantencion_id`,
CHANGE COLUMN `estado_mantencion_id` `estado_mantencion_id` INT(11) NOT NULL ,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`id`, `tipo_mantencion_id`),
ADD INDEX `fk_mantencion_tipo_mantencion1_idx` (`tipo_mantencion_id` ASC) VISIBLE;
;

ALTER TABLE `cbo_db`.`maquina` 
ADD COLUMN `peso_kg` INT(11) NULL DEFAULT NULL AFTER `img_url`;

ALTER TABLE `cbo_db`.`personal` 
ADD COLUMN `ultima_fec_servicio` DATETIME NULL DEFAULT NULL AFTER `obs`;

ALTER TABLE `cbo_db`.`tipo_maquina` 
DROP COLUMN `clasificacion`,
ADD COLUMN `nombre` VARCHAR(50) NOT NULL AFTER `id`;

ALTER TABLE `cbo_db`.`mantencion` 
ADD CONSTRAINT `fk_mantencion_estado_mantencion1`
  FOREIGN KEY (`estado_mantencion_id`)
  REFERENCES `cbo_db`.`estado_mantencion` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_mantencion_tipo_mantencion1`
  FOREIGN KEY (`tipo_mantencion_id`)
  REFERENCES `cbo_db`.`tipo_mantencion` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
