import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createClave,
    deleteClave,
    getClaveById,
    // getClaves,
    getClavesPage,
    updateClave
} from "../controllers/clave.controllers.js";

const router = Router();

const base_route = '/clave'

// router.get(base_route, getClaves);
router.get(base_route, checkPermission('verClaves'), getClavesPage); // paginado
// http://{url}/api/clave
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verClaves'), getClaveById);

router.post(base_route, checkPermission('ingresarClave'), createClave);

router.delete(`${base_route}/:id`, checkPermission('eliminarClave'), deleteClave);

router.patch(`${base_route}/:id`, checkPermission('actualizarClave'), updateClave);

export default router;