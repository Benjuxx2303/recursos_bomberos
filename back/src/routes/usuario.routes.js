import { Router } from "express";
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  deleteUsuario,
  updateUsuario,
  registerUser,    // Función para registrar usuario
  loginUser        // Función para iniciar sesión
} from "../controllers/usuario.controllers.js";

const router = Router();

const base_route = "/usuario";

// Rutas para la gestión de usuarios
router.get(base_route, getUsuarios);                      // Obtener todos los usuarios
router.get(`${base_route}/:id`, getUsuarioById);          // Obtener usuario por ID

router.post(base_route, createUsuario);                   // Crear un nuevo usuario

router.delete(`${base_route}/:id`, deleteUsuario);         // Eliminar usuario por ID
router.patch(`${base_route}/:id`, updateUsuario);          // Actualizar usuario por ID

// Rutas para autenticación
router.post(`${base_route}/register`, registerUser);       // Ruta para registrar usuario
router.post(`${base_route}/login`, loginUser);             // Ruta para iniciar sesión

export default router;
