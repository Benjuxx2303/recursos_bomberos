import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    asignarPermisosRol,
    createRolPermiso,
    deleteRolPermiso,
    getRolPermisoById,
    getRolPermisos
} from "../controllers/rol_permisos.controllers.js";

const router = Router();

const base_route = "/rol_permiso";

router.get(base_route, checkPermission('verPermisos'), getRolPermisos); // Devuelve todos los permisos por rol

router.get(`${base_route}/:id`, checkPermission('verPermisos'), getRolPermisoById); // Devuelve un rol_permiso por ID

router.post(base_route, checkPermission('asignarPermisosRol'), createRolPermiso); // Crear rol_permiso

router.delete(`${base_route}/:id`, checkPermission('eliminarPermiso'), deleteRolPermiso); // Dar de baja rol_permiso

/* router.patch(`${base_route}/:id`, checkPermission('updateRol_permiso'), updateRolPermiso); // Actualizar rol_permiso */

router.post(`${base_route}/:rolId/asignar`, checkPermission('asignarPermisosRol'), asignarPermisosRol);

export default router;