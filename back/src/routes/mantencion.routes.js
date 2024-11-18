import { Router } from "express";
import {
  // getMantencionesWithDetails,
  getMantencionesAllDetails,
  getMantencionesAllDetailsSearch,
  getMantencionAllDetailsById,
  createMantencion,
  createMantencionBitacora,
  deleteMantencion,
  updateMantencion,
  updateImage,
  // ---- reportes
  getMantencionCostosByAnio,
  getReporteMantencionesEstadoCosto,
  getReporteGeneral,
} from "../controllers/mantencion.controllers.js";
import multer from 'multer';

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

const base_route = "/mantencion"; 

// router.get(base_route, getMantencionesWithDetails);
router.get(base_route, getMantencionesAllDetails);

router.get(`${base_route}/search`, getMantencionesAllDetailsSearch);
// http://{url}/api/mantencion/search
// QueryParams:
// taller:            test
// estado_mantencion: rechazada
// ord_trabajo:       OT-12345
// compania:          compañia 1

router.get(`${base_route}/:id`, getMantencionAllDetailsById);

router.post(base_route, createMantencionBitacora);
router.post(`${base_route}/old`, createMantencion);

router.delete(`${base_route}/:id`, deleteMantencion);

router.patch(`${base_route}/:id`, updateMantencion);
router.patch(`${base_route}/:id/image`, upload.single('file'), updateImage); // Ruta para actualizar la imagen


// ---- reportes
router.get(`/reportes${base_route}/costos`, getMantencionCostosByAnio)
// ej: {url}/api/reportes/mantencion/costos
// QueryParams:
// year:   2024

router.get(`/reportes${base_route}/stats`, getReporteMantencionesEstadoCosto);
// http://{url}/api/reportes/mantencion/datosMantencion
// QueryParams:
// startDate:   01-01-2024
// endDate:     01-01-2025
// companiaId:  2

router.get(`/reportes${base_route}/dashboard`, getReporteGeneral);
// http://{url}/api/reportes/mantencion/dashboard

export default router;