import { Router } from "express";
import {
    getRolPersonal,
    getRolesPersonal,
    createRolPersonal,
    deleteRolPersonal,
    updateRolPersonal,
} from "../controllers/rol_personal.controllers.js"

const router = Router();

const base_route = '/rol_personal'

router.get(base_route, getRolesPersonal);

router.get(`${base_route}/:id`, getRolPersonal);

router.post(base_route, createRolPersonal);

router.delete(`${base_route}/:id`, deleteRolPersonal);

router.patch(`${base_route}/:id`, updateRolPersonal);

export default router;