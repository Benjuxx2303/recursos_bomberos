import { Router } from "express";
import {
  getMantencioneswithDetails,
  getMantencionById,
  createMantencion,
  deleteMantencion,
  updateMantencion,
  // ---- reportes
  getMantencionCostosByMes
} from "../controllers/mantencion.controllers.js";

const router = Router();

const base_route = "/mantencion"; 

router.get(base_route, getMantencioneswithDetails);
router.get(`${base_route}/:id`, getMantencionById);

router.post(base_route, createMantencion);

router.delete(`${base_route}/:id`, deleteMantencion);

router.patch(`${base_route}/:id`, updateMantencion);

// ---- reportes

router.get(`/reportes${base_route}/costos/:anio`, getMantencionCostosByMes)
// ej: http://localhost:3000/api/reportes/mantencion/costos/2024

export default router;