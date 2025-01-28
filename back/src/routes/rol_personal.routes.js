import { Router } from "express";
import {
    // getRolesPersonal,
    getRolesPersonalPage,
    getRolPersonal,
    createRolPersonal,
    deleteRolPersonal,
    updateRolPersonal,
} from "../controllers/rol_personal.controllers.js"
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/rol_personal'

// router.get(base_route, getRolesPersonal);
router.get(base_route, checkPermission('getRol_personal'), getRolesPersonalPage);
// http://{url}/api/rol_personal
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getRol_personal'), getRolPersonal);

router.post(base_route, checkPermission('createRol_personal'), createRolPersonal);

router.delete(`${base_route}/:id`, checkPermission('deleteRol_personal'), deleteRolPersonal);

router.patch(`${base_route}/:id`, checkPermission('updateRol_personal'), updateRolPersonal);

export default router;