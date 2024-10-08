import { Router } from "express";
import {
  getTipoMantenciones,
  getTipoMantencionById,
  createTipoMantencion,
  deleteTipoMantencion,
  updateTipoMantencion,
} from "../controllers/tipo_mantencion.controllers.js";

const router = Router();

const base_route = "/tipo_mantencion";

router.get(base_route, getTipoMantenciones); 
router.get(`${base_route}/:id`, getTipoMantencionById);

router.post(base_route, createTipoMantencion);

router.delete(`${base_route}/:id`, deleteTipoMantencion);

router.patch(`${base_route}/:id`, updateTipoMantencion);

export default router;