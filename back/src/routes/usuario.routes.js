import { Router } from "express";
import {
    getUsuarios,
    // getUsuariosWithDetails,
    getUsuariosWithDetailsPage,
    getUsuarioById,
    deleteUsuario,
    updateUsuario,
    registerUser,
    loginUser,
} from "../controllers/usuario.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/usuario"; 

// Obtener todos los usuarios
// router.get(base_route, getUsuarios);

// Obtener usuarios con detalles
// router.get(`${base_route}/detalles`, getUsuariosWithDetails);
// router.get(base_route, getUsuariosWithDetails);
router.get(base_route, checkRole(['TELECOM']), getUsuariosWithDetailsPage); // paginado
// http://{url}/api/usuario
// QueryParams:
// page:              1
// pageSize:          10

// Obtener usuario por ID
router.get(`${base_route}/:id`, checkRole(['TELECOM']), getUsuarioById);

// Eliminar usuario (cambiar estado)
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteUsuario);

// Actualizar usuario
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateUsuario);

// -----Logica login
// Registrar nuevo usuario (con validaciones y encriptación)
router.post(`${base_route}/register`, checkRole(['TELECOM']), registerUser);

// Iniciar sesión
router.post(`${base_route}/login`, loginUser);

export default router;
