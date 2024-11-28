import { Router } from "express";
import {
  // getTipoMantenciones,
  getTipoMantencionesPage,
  getTipoMantencionById,
  createTipoMantencion,
  deleteTipoMantencion,
  updateTipoMantencion,
} from "../controllers/tipo_mantencion.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/tipo_mantencion";

// router.get(base_route, getTipoMantenciones); 
router.get(base_route, checkRole(['TELECOM']), getTipoMantencionesPage); // paginado
// http://{url}/api/tipo_mantencion
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getTipoMantencionById);

router.post(base_route, checkRole(['TELECOM']), createTipoMantencion);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteTipoMantencion);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateTipoMantencion);

export default router;