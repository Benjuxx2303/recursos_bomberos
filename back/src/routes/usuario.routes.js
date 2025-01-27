import { Router } from "express";
import { checkRole } from "../controllers/authMiddleware.js";
import {
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
router.post(`${base_route}/register`, registerUser);

// Iniciar sesión
router.post(`${base_route}/login`, loginUser); // Iniciar sesión
router.post(`${base_route}/recover-password`, recoverPassword); // Recuperar contraseña
router.post(`${base_route}/verify-reset-token`, verifyResetToken); // Verificar token de restablecimiento
router.post(`${base_route}/reset-password`, resetPassword); // Resetear contraseña
router.get(`${base_route}/verify-email/:token`, verifyEmail); // Ruta para verificar correo


export default router;
