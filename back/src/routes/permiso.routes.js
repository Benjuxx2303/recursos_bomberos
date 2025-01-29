import { Router } from "express";
import {
    getPermisos,
    getPermisoById,
    createPermiso,
    updatePermiso,
    deletePermiso
} from "../controllers/permiso.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/permiso";

router.get(base_route, checkPermission('getPermiso'), getPermisos);

router.get(`${base_route}/:id`, checkPermission('getPermiso'), getPermisoById);

router.post(base_route, checkPermission('createPermiso'), createPermiso);

router.patch(`${base_route}/:id`, checkPermission('updatePermiso'), updatePermiso);

router.delete(`${base_route}/:id`, checkPermission('deletePermiso'), deletePermiso);

export default router;