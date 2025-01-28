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
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/modelo'

// router.get(base_route, getClaves);
router.get(base_route, checkPermission('getModelo'),  getModelos); // paginado
// http://{url}/api/clave
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getModelo'), getModeloById);

router.post(base_route, checkPermission('createModelo'), createModelo);

router.delete(`${base_route}/:id`, checkPermission('deleteModelo'), deleteModelo);

// TODO: reemplazar PUT por PATCH
router.patch(`${base_route}/:id`, checkPermission('updateModelo'), updateModelo);

export default router;