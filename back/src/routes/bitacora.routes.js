import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
  createBitacora,
  deleteBitacora,
  endServicio,
  getBitacora,
  getBitacoraById,
  getBitacoraFull, // habilitado
  getLastBitacora,
  startServicio,
  updateBitacora,
  updateBitacorasDisponibilidad
} from "../controllers/bitacora.controllers.js";

const router = Router();

const base_route = "/bitacora";

router.get(base_route, checkPermission('verServicios'), getBitacora); // paginado
router.get(`${base_route}/search`, checkPermission('verServicios'), getBitacora); // nueva ruta de búsqueda
// http://{url}/api/bitacora
// QueryParams:
// page:              1
// pageSize:          10
router.get(`${base_route}/full`,  getBitacoraFull);
// http://{url}/api/bitacora/full
router.get(`${base_route}/:id`, checkPermission('verServicios'), getBitacoraById);
router.get(`${base_route}/last`, checkPermission('verServicios'),  getLastBitacora);
router.post(base_route, checkPermission('ingresarServicio'), createBitacora);

router.delete(`${base_route}/:id`, checkPermission('eliminarServicio'),deleteBitacora);

router.patch(`${base_route}/:id`, checkPermission('actualizarServicio'),updateBitacora);
router.post(`${base_route}/start`, checkPermission('actualizarServicio'), startServicio);
router.patch(`${base_route}/:id/end`, checkPermission('actualizarServicio'), endServicio);
router.put(`${base_route}/update-disponibilidad`, updateBitacorasDisponibilidad);
export default router;
