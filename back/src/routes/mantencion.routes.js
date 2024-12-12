import { Router } from "express";
import {
  getMantencionesAllDetailsSearch,
  getMantencionAllDetailsById,
  createMantencion,
  createMantencionBitacora,
  deleteMantencion,
  updateMantencion,
} from "../controllers/mantencion.controllers.js";
import { 
  getMantencionCostosByAnio,
  getReporteGeneral, 
  getReporteMantencionesEstadoCosto
} from "../controllers/stats_mantencion.js";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";

// Configuración de multers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
  { name: 'imagen' }
]);

const router = Router();

const base_route = "/mantencion"; 

router.get(base_route, checkRole(['TELECOM']), getMantencionesAllDetailsSearch);
// http://{url}/api/mantencion
// QueryParams:
// page:              1
// pageSize:          10

// taller:            test
// estado_mantencion: rechazada
// ord_trabajo:       OT-12345
// compania:          compañia 1

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getMantencionAllDetailsById);
router.post(base_route, uploadFields, createMantencionBitacora);
router.post(`${base_route}/old`, checkRole(['TELECOM']), createMantencion);
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteMantencion);
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), uploadFields, updateMantencion);

// ---- reportes
router.get(`/reportes${base_route}/costos`, checkRole(['TELECOM']), getMantencionCostosByAnio)
// ej: {url}/api/reportes/mantencion/costos
// QueryParams:
// year:   2024

router.get(`/reportes${base_route}/stats`, checkRole(['TELECOM']), getReporteMantencionesEstadoCosto);
// http://{url}/api/reportes/mantencion/datosMantencion
// QueryParams:
// startDate:   01-01-2024
// endDate:     01-01-2025
// companiaId:  2

router.get(`/reportes${base_route}/dashboard`, checkRole(['TELECOM']), getReporteGeneral);
// http://{url}/api/reportes/mantencion/dashboard

export default router;