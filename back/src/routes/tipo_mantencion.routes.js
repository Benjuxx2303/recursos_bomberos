import { Router } from "express";
import {
  // getTipoMantenciones,
  getTipoMantencionesPage,
  getTipoMantencionById,
  createTipoMantencion,
  deleteTipoMantencion,
  updateTipoMantencion,
} from "../controllers/tipo_mantencion.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/tipo_mantencion";

// router.get(base_route, getTipoMantenciones); 
router.get(base_route, checkPermission('getTipo_mantencion'), getTipoMantencionesPage); // paginado
// http://{url}/api/tipo_mantencion
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getTipo_mantencion'), getTipoMantencionById);

router.post(base_route, checkPermission('createTipo_mantencion'), createTipoMantencion);

router.delete(`${base_route}/:id`, checkPermission('deleteTipo_mantencion'), deleteTipoMantencion);

router.patch(`${base_route}/:id`, checkPermission('updateTipo_mantencion'), updateTipoMantencion);

export default router;