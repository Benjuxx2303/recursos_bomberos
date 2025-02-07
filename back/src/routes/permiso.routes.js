import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    asignarPermisosRol,
    createPermiso,
    deletePermiso,
    getCategorias,
    getPermisoById,
    getPermisos,
    getPermisosByRol,
    updatePermiso
} from "../controllers/permiso.controllers.js";

const router = Router();

const base_route = "/permiso";

// Rutas de categorías
router.get(`${base_route}/categorias`, checkPermission('getPermiso'), getCategorias);

// Rutas de permisos
router.get(base_route, checkPermission('getPermiso'), getPermisos);
router.get(`${base_route}/:id`, checkPermission('getPermiso'), getPermisoById);
router.post(base_route, checkPermission('createPermiso'), createPermiso);
router.patch(`${base_route}/:id`, checkPermission('updatePermiso'), updatePermiso);
router.delete(`${base_route}/:id`, checkPermission('deletePermiso'), deletePermiso);

// Rutas de permisos por rol
router.get(`${base_route}/rol/:rolId`, checkPermission('getPermiso'), getPermisosByRol);
router.post(`${base_route}/rol/:rolId/asignar`, checkPermission('updatePermiso'), asignarPermisosRol);

export default router;