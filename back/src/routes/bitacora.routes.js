import { Router } from "express";
import {
  // getBitacora,
  getBitacoraPage,
  getBitacoraById,
  createBitacora,
  deleteBitacora,
  updateBitacora,
} from "../controllers/bitacora.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/bitacora";

// router.get(base_route, getBitacora);
router.get(base_route, checkRole(['TELECOM']), getBitacoraPage); // paginado
// http://{url}/api/bitacora
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getBitacoraById);

router.post(base_route, checkRole(['TELECOM']), createBitacora);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']),deleteBitacora);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']),updateBitacora);

export default router;
