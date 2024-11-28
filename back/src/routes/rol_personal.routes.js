import { Router } from "express";
import {
    // getRolesPersonal,
    getRolesPersonalPage,
    getRolPersonal,
    createRolPersonal,
    deleteRolPersonal,
    updateRolPersonal,
} from "../controllers/rol_personal.controllers.js"
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/rol_personal'

// router.get(base_route, getRolesPersonal);
router.get(base_route, checkRole(['TELECOM']), getRolesPersonalPage);
// http://{url}/api/rol_personal
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getRolPersonal);

router.post(base_route, checkRole(['TELECOM']), createRolPersonal);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteRolPersonal);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateRolPersonal);

export default router;