import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    changePassword,
    createUser,
    deleteUsuario,
    getUsuarioById,
    // getUsuariosWithDetails,
    getUsuariosWithDetailsPage,
    loginUser,
    recoverPassword,
    registerUser,
    resetPassword,
    updateUsuario,
    verifyEmail,
    verifyResetToken
} from "../controllers/usuario.controllers.js";

const router = Router();

const base_route = "/usuario"; 

// Obtener todos los usuarios
// router.get(base_route, getUsuarios);

// Obtener usuarios con detalles
// router.get(`${base_route}/detalles`, getUsuariosWithDetails);
// router.get(base_route, getUsuariosWithDetails);
router.get(base_route, checkPermission('getUsuario'), getUsuariosWithDetailsPage); // paginado
// http://{url}/api/usuario
// QueryParams:
// page:              1
// pageSize:          10

// Obtener usuario por ID
router.get(`${base_route}/:id`, checkPermission('getUsuario'), getUsuarioById);

// Eliminar usuario (cambiar estado)
router.delete(`${base_route}/:id`, checkPermission('deleteUsuario'), deleteUsuario);

// Actualizar usuario
router.patch(`${base_route}/:id`, checkPermission('updateUsuario'), updateUsuario);

// -----Logica login
// Registrar nuevo usuario (con validaciones y encriptación)
router.post(`${base_route}/register`, registerUser);

// Rutas públicas de autenticación
router.post(`${base_route}/login`, loginUser);
router.post(`${base_route}/recover-password`, recoverPassword);
router.post(`${base_route}/verify-reset-token`, verifyResetToken);
router.post(`${base_route}/reset-password`, resetPassword);
router.post(`${base_route}/change-password`, changePassword);
router.get(`${base_route}/verify-email/:token`, verifyEmail);

// Rutas protegidas
router.post(`${base_route}/crear`, checkPermission('crearUsuario'), createUser);

export default router;
