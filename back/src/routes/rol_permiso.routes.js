import { Router } from "express";
import {
    getRolPermisos,
    getRolPermisoById,
    createRolPermiso,
    deleteRolPermiso,
    updateRolPermiso
} from "../controllers/rol_permisos.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/rol_permiso";

router.get(base_route, checkPermission('getRol_permiso'), getRolPermisos); // Devuelve todos los permisos por rol

router.get(`${base_route}/:id`, checkPermission('getRol_permiso'), getRolPermisoById); // Devuelve un rol_permiso por ID

router.post(base_route, checkPermission('createRol_permiso'), createRolPermiso); // Crear rol_permiso

router.delete(`${base_route}/:id`, checkPermission('deleteRol_permiso'), deleteRolPermiso); // Dar de baja rol_permiso

router.patch(`${base_route}/:id`, checkPermission('updateRol_permiso'), updateRolPermiso); // Actualizar rol_permiso

export default router;