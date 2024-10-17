import { Router } from "express";
import {
    getUsuarios,
    getUsuariosWithDetails,
    getUsuarioById,
    deleteUsuario,
    updateUsuario,
    registerUser,
    loginUser,
} from "../controllers/usuario.controllers.js";

const router = Router();

const base_route = "/usuario"; 

// Obtener todos los usuarios
router.get(base_route, getUsuarios);
// Obtener usuarios con detalles
router.get(`${base_route}/detalles`, getUsuariosWithDetails);
// Obtener usuario por ID
router.get(`${base_route}/:id`, getUsuarioById);
// Eliminar usuario (cambiar estado)
router.delete(`${base_route}/:id`, deleteUsuario);
// Actualizar usuario
router.patch(`${base_route}/:id`, updateUsuario);

// -----Logica login
// Registrar nuevo usuario (con validaciones y encriptación)
router.post(`${base_route}/register`, registerUser);
// Iniciar sesión
router.post(`${base_route}/login`, loginUser);

export default router;
