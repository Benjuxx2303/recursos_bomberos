-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: database-cbo.ct0u44ymurca.us-east-2.rds.amazonaws.com    Database: cbo_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.11.9-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bitacora`
--

DROP TABLE IF EXISTS `bitacora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `compania_id` int(11) NOT NULL,
  `conductor_id` int(11) NOT NULL,
  `maquina_id` int(11) NOT NULL,
  `clave_id` int(11) NOT NULL,
  `direccion` varchar(100) NOT NULL,
  `fh_salida` datetime DEFAULT NULL,
  `fh_llegada` datetime DEFAULT NULL,
  `km_salida` float NOT NULL,
  `km_llegada` float NOT NULL,
  `hmetro_salida` float NOT NULL,
  `hmetro_llegada` float NOT NULL,
  `hbomba_salida` float NOT NULL,
  `hbomba_llegada` float NOT NULL,
  `obs` varchar(500) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_bitacora_compania1_idx` (`compania_id`),
  KEY `fk_bitacora_conductor_maquina1_idx` (`conductor_id`),
  KEY `fk_bitacora_clave1_idx` (`clave_id`),
  KEY `fk_bitacora_maquina1_idx` (`maquina_id`),
  CONSTRAINT `fk_bitacora_clave1` FOREIGN KEY (`clave_id`) REFERENCES `clave` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_compania1` FOREIGN KEY (`compania_id`) REFERENCES `compania` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_conductor_maquina1` FOREIGN KEY (`conductor_id`) REFERENCES `conductor_maquina` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_bitacora_maquina1` FOREIGN KEY (`maquina_id`) REFERENCES `maquina` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carga_combustible`
--

DROP TABLE IF EXISTS `carga_combustible`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carga_combustible` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bitacora_id` int(11) NOT NULL,
  `litros` float NOT NULL,
  `valor_mon` int(11) NOT NULL,
  `img_url` text DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_carga_combustible_maquina_idx` (`bitacora_id`),
  CONSTRAINT `fk_carga_combustible_bitacora1` FOREIGN KEY (`bitacora_id`) REFERENCES `bitacora` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `clave`
--

DROP TABLE IF EXISTS `clave`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clave` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(45) NOT NULL,
  `descripcion` varchar(45) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `compania`
--

DROP TABLE IF EXISTS `compania`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compania` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `conductor_maquina`
--

DROP TABLE IF EXISTS `conductor_maquina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conductor_maquina` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personal_id` int(11) NOT NULL,
  `maquina_id` int(11) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_conductor_maquina_personal_idx` (`personal_id`),
  KEY `fk_conductor_maquina_maquina_idx` (`maquina_id`),
  CONSTRAINT `fk_conductor_maquina_maquina` FOREIGN KEY (`maquina_id`) REFERENCES `maquina` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_conductor_maquina_personal` FOREIGN KEY (`personal_id`) REFERENCES `personal` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detalle_mantencion`
--

DROP TABLE IF EXISTS `detalle_mantencion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detalle_mantencion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mantencion_id` int(11) NOT NULL,
  `tipo_mantencion_id` int(11) NOT NULL,
  `observacion` varchar(500) DEFAULT NULL,
  `servicio_id` int(11) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_mantencion_mantencion1_idx` (`mantencion_id`),
  KEY `fk_detalle_mantencion_tipo_mantencion1_idx` (`tipo_mantencion_id`),
  KEY `fk_detalle_mantencion_servicio1_idx` (`servicio_id`),
  CONSTRAINT `fk_detalle_mantencion_mantencion1` FOREIGN KEY (`mantencion_id`) REFERENCES `mantencion` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_servicio1` FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_detalle_mantencion_tipo_mantencion1` FOREIGN KEY (`tipo_mantencion_id`) REFERENCES `tipo_mantencion` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `division`
--

DROP TABLE IF EXISTS `division`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `division` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `estado_mantencion`
--

DROP TABLE IF EXISTS `estado_mantencion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_mantencion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mantencion`
--

DROP TABLE IF EXISTS `mantencion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mantencion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bitacora_id` int(11) NOT NULL,
  `maquina_id` int(11) NOT NULL,
  `taller_id` int(11) NOT NULL,
  `estado_mantencion_id` int(11) NOT NULL,
  `fec_inicio` date DEFAULT NULL,
  `fec_termino` date DEFAULT NULL,
  `ord_trabajo` varchar(45) NOT NULL,
  `n_factura` int(11) DEFAULT NULL,
  `img_url` text DEFAULT NULL,
  `cost_ser` int(11) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_mantenciones_carro1_idx` (`maquina_id`),
  KEY `fk_mantencion_taller1_idx` (`taller_id`),
  KEY `fk_mantencion_bitacora1_idx` (`bitacora_id`),
  KEY `fk_mantencion_estado_mantencion1_idx` (`estado_mantencion_id`),
  CONSTRAINT `fk_mantencion_bitacora1` FOREIGN KEY (`bitacora_id`) REFERENCES `bitacora` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_estado_mantencion1` FOREIGN KEY (`estado_mantencion_id`) REFERENCES `estado_mantencion` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantencion_taller1` FOREIGN KEY (`taller_id`) REFERENCES `taller` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_mantenciones_carro1` FOREIGN KEY (`maquina_id`) REFERENCES `maquina` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `maquina`
--

DROP TABLE IF EXISTS `maquina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maquina` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_maquina_id` int(11) NOT NULL,
  `compania_id` int(11) NOT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT 1,
  `codigo` varchar(10) NOT NULL,
  `patente` varchar(8) NOT NULL,
  `num_chasis` varchar(17) NOT NULL,
  `vin` varchar(17) NOT NULL,
  `bomba` tinyint(1) NOT NULL,
  `hmetro_bomba` float NOT NULL,
  `hmetro_motor` float NOT NULL,
  `kmetraje` float NOT NULL,
  `num_motor` varchar(30) NOT NULL,
  `ven_patente` date NOT NULL,
  `procedencia_id` int(11) NOT NULL,
  `cost_rev_tec` int(11) NOT NULL,
  `ven_rev_tec` date NOT NULL,
  `cost_seg_auto` int(11) NOT NULL,
  `ven_seg_auto` date NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  `img_url` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patente_UNIQUE` (`patente`),
  KEY `fk_maquina_tipo_maquina1_idx` (`tipo_maquina_id`),
  KEY `fk_maquina_compania1_idx` (`compania_id`),
  KEY `fk_maquina_procedencia1_idx` (`procedencia_id`),
  CONSTRAINT `fk_maquina_compania1` FOREIGN KEY (`compania_id`) REFERENCES `compania` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_procedencia1` FOREIGN KEY (`procedencia_id`) REFERENCES `procedencia` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_maquina_tipo_maquina1` FOREIGN KEY (`tipo_maquina_id`) REFERENCES `tipo_maquina` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personal`
--

DROP TABLE IF EXISTS `personal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rol_personal_id` int(11) NOT NULL,
  `rut` varchar(13) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `apellido` varchar(60) NOT NULL,
  `compania_id` int(11) NOT NULL,
  `ven_licencia` date DEFAULT NULL,
  `fec_nac` date NOT NULL,
  `fec_ingreso` date DEFAULT NULL,
  `img_url` text DEFAULT NULL,
  `obs` varchar(500) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rut_UNIQUE` (`rut`),
  KEY `fk_personal_roles_personal_idx` (`rol_personal_id`),
  KEY `fk_personal_compania1_idx` (`compania_id`),
  CONSTRAINT `fk_personal_compania1` FOREIGN KEY (`compania_id`) REFERENCES `compania` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `fk_personal_roles_personal` FOREIGN KEY (`rol_personal_id`) REFERENCES `rol_personal` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `procedencia`
--

DROP TABLE IF EXISTS `procedencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procedencia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(30) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rol_personal`
--

DROP TABLE IF EXISTS `rol_personal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol_personal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicio`
--

DROP TABLE IF EXISTS `servicio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subdivision_id` int(11) NOT NULL,
  `descripcion` varchar(45) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_servicio_subdivision1_idx` (`subdivision_id`),
  CONSTRAINT `fk_servicio_subdivision1` FOREIGN KEY (`subdivision_id`) REFERENCES `subdivision` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subdivision`
--

DROP TABLE IF EXISTS `subdivision`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subdivision` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `division_id` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_subdivision_division1_idx` (`division_id`),
  CONSTRAINT `fk_subdivision_division1` FOREIGN KEY (`division_id`) REFERENCES `division` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `taller`
--

DROP TABLE IF EXISTS `taller`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taller` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `fono` varchar(15) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipo_mantencion`
--

DROP TABLE IF EXISTS `tipo_mantencion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_mantencion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(45) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipo_maquina`
--

DROP TABLE IF EXISTS `tipo_maquina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipo_maquina` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clasificacion` varchar(50) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(45) NOT NULL,
  `correo` varchar(45) NOT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `contrasena` varchar(255) NOT NULL,
  `personal_id` int(11) NOT NULL,
  `isDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_usuario_personal1_idx` (`personal_id`),
  CONSTRAINT `fk_usuario_personal1` FOREIGN KEY (`personal_id`) REFERENCES `personal` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-03 18:49:26
