import { Router } from "express";
import { 
    // getClaves,
    getClavesPage,
    getClaveById,
    createClave,
    deleteClave,
    updateClave
} from "../controllers/clave.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/clave'

// router.get(base_route, getClaves);
router.get(base_route, checkRole(['TELECOM']), getClavesPage); // paginado
// http://{url}/api/clave
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getClaveById);

router.post(base_route, checkRole(['TELECOM']), createClave);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteClave);

// TODO: reemplazar PUT por PATCH
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateClave);

export default router;