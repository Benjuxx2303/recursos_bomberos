import { Router } from "express";
import {
  getMantencionesWithDetails,
  getMantencionById,
  createMantencion,
  deleteMantencion,
  updateMantencion,
  // ---- reportes
  getMantencionCostosByMes,
  getReporteMantencionesEstadoCosto,
} from "../controllers/mantencion.controllers.js";

const router = Router();

const base_route = "/mantencion"; 

router.get(base_route, getMantencionesWithDetails);
router.get(`${base_route}/:id`, getMantencionById);

router.post(base_route, createMantencion);

router.delete(`${base_route}/:id`, deleteMantencion);

router.patch(`${base_route}/:id`, updateMantencion);

// ---- reportes

router.get(`/reportes${base_route}/costosPorAnio`, getMantencionCostosByMes)
// ej: {url}/api/reportes/mantencion/costos/2024

router.get(`/reportes${base_route}/datosMantencion`, getReporteMantencionesEstadoCosto);
// http://{url}/api/reportes/mantencion/datosMantencion
// QueryParams:
// startDate:   01-01-2024
// endDate:     01-01-2025
// companiaId:  2

export default router;