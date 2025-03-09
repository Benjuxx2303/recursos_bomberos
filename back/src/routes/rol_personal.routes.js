import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createRolPersonal,
    deleteRolPersonal,
    // getRolesPersonal,
    getRolesPersonalPage,
    getRolPersonal,
    updateRolPersonal,
} from "../controllers/rol_personal.controllers.js";

const router = Router();

const base_route = '/rol_personal'

// router.get(base_route, getRolesPersonal);
router.get(base_route, checkPermission('verRolesPersonal'), getRolesPersonalPage);
// http://{url}/api/rol_personal
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verRolesPersonal'), getRolPersonal);

router.post(base_route, checkPermission('crearRolPersonal'), createRolPersonal);

router.delete(`${base_route}/:id`, checkPermission('eliminarRolPersonal'), deleteRolPersonal);

router.patch(`${base_route}/:id`, checkPermission('actualizarRolPersonal'), updateRolPersonal);

export default router;