import { Router } from "express";
import { 
    // getClaves,
    getClavesPage,
    getClaveById,
    createClave,
    deleteClave,
    updateClave
} from "../controllers/clave.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/clave'

// router.get(base_route, getClaves);
router.get(base_route, checkPermission('getClave'), getClavesPage); // paginado
// http://{url}/api/clave
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getClave'), getClaveById);

router.post(base_route, checkPermission('createClave'), createClave);

router.delete(`${base_route}/:id`, checkPermission('deleteClave'), deleteClave);

router.patch(`${base_route}/:id`, checkPermission('updateClave'), updateClave);

export default router;