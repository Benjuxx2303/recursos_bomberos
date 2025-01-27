import { Router } from "express";
import { 
    // getClaves,
  getModeloById,
  getModelosPage,
  getModelos,
  createModelo,
  deleteModelo,
  updateModelo   
} from "../controllers/modelo.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/modelo'

// router.get(base_route, getClaves);
router.get(base_route,  getModelos); // paginado
// http://{url}/api/clave
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`,  getModeloById);

router.post(base_route, createModelo);

router.delete(`${base_route}/:id`, deleteModelo);

// TODO: reemplazar PUT por PATCH
router.patch(`${base_route}/:id`,  updateModelo);

export default router;