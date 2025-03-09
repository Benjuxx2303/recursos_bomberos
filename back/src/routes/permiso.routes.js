import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
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
router.get(`${base_route}/categorias`, checkPermission('verCategoriasPermiso'), getCategorias);

// Rutas de permisos
router.get(base_route, checkPermission('verPermisos'), getPermisos);
router.get(`${base_route}/:id`, checkPermission('verPermisos'), getPermisoById);
router.post(base_route, checkPermission('crearPermiso'), createPermiso);
router.patch(`${base_route}/:id`, checkPermission('actualizarPermiso'), updatePermiso);
router.delete(`${base_route}/:id`, checkPermission('eliminarPermiso'), deletePermiso);

// Rutas de permisos por rol
router.get(`${base_route}/rol/:rolId`, checkPermission('verPermisosPorRol'), getPermisosByRol);

export default router;