import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
  createTipoMantencion,
  deleteTipoMantencion,
  getTipoMantencionById,
  // getTipoMantenciones,
  getTipoMantencionesPage,
  updateTipoMantencion,
} from "../controllers/tipo_mantencion.controllers.js";

const router = Router();

const base_route = "/tipo_mantencion";

// router.get(base_route, getTipoMantenciones); 
router.get(base_route, checkPermission('verMantenciones'), getTipoMantencionesPage); // paginado
// http://{url}/api/tipo_mantencion
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verMantenciones'), getTipoMantencionById);

router.post(base_route, checkPermission('verMantenciones'), createTipoMantencion);

router.delete(`${base_route}/:id`, checkPermission('verMantenciones'), deleteTipoMantencion);

router.patch(`${base_route}/:id`, checkPermission('verMantenciones'), updateTipoMantencion);

export default router;