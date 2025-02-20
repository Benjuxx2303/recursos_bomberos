import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
  createBitacora,
  deleteBitacora,
  getBitacora,
  getBitacoraById, // habilitado
  getLastBitacora,
  updateBitacora,
  startServicio,
  endServicio,
} from "../controllers/bitacora.controllers.js";

const router = Router();

const base_route = "/bitacora";

router.get(base_route, checkPermission('getBitacora'), getBitacora); // paginado
router.get(`${base_route}/search`, checkPermission('getBitacora'), getBitacora); // nueva ruta de búsqueda
// http://{url}/api/bitacora
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getBitacora'), getBitacoraById);
router.get(`${base_route}/last`, checkPermission('getBitacora'),  getLastBitacora);
router.post(base_route, checkPermission('createBitacora'), createBitacora);

router.delete(`${base_route}/:id`, checkPermission('deleteBitacora'),deleteBitacora);

router.patch(`${base_route}/:id`, checkPermission('updateBitacora'),updateBitacora);
router.patch(`${base_route}/:id/start`, checkPermission('updateBitacora'), startServicio);
router.patch(`${base_route}/:id/end`, checkPermission('updateBitacora'), endServicio);

export default router;
