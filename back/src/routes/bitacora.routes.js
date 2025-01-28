import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
  createBitacora,
  deleteBitacora,
  getBitacora,
  getBitacoraById, // habilitado
  getBitacoraPage,
  getLastBitacora,
  updateBitacora
} from "../controllers/bitacora.controllers.js";

const router = Router();

const base_route = "/bitacora";

// router.get(base_route, getBitacora);
router.get(base_route, checkPermission('getBitacora'), getBitacoraPage); // paginado
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

export default router;
