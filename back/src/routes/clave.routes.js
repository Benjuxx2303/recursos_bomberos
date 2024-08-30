import { Router } from "express";
import { 
    getClaves,
    getClaveById,
    createClave,
    deleteClave,
    updateClave
} from "../controllers/clave.controllers.js";

const router = Router();

const base_route = '/clave'

router.get(base_route, getClaves);
router.get(`${base_route}/:id`, getClaveById);

router.post(base_route, createClave);

router.delete(`${base_route}/:id`, deleteClave);

// TODO: reemplazar PUT por PATCH
router.patch(`${base_route}/:id`, updateClave);

export default router;