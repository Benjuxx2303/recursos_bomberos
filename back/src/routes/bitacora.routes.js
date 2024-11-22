import { Router } from "express";
import {
  // getBitacora,
  getBitacoraPage,
  getBitacoraById,
  createBitacora,
  deleteBitacora,
  updateBitacora,
} from "../controllers/bitacora.controllers.js";

const router = Router();

const base_route = "/bitacora";

// router.get(base_route, getBitacora);
router.get(base_route, getBitacoraPage); // paginado
// http://{url}/api/bitacora
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, getBitacoraById);

router.post(base_route, createBitacora);

router.delete(`${base_route}/:id`,deleteBitacora);

router.patch(`${base_route}/:id`,updateBitacora);

export default router;
