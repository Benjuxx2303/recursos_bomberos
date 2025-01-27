import { Router } from "express";
import {
  getTiposClave,
  getTiposClavePage,
  getTipoClaveById,
  createTipoClave,
  deleteTipoClave,
  updateTipoClave,
} from "../controllers/tipo_clave.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/tipo_clave";

// Ruta para obtener todos los tipos de clave con paginación
router.get(base_route, checkRole(['TELECOM']), getTiposClavePage); 
// QueryParams:
// page:              1
// pageSize:          10

// Ruta para obtener tipo de clave por ID
router.get(`${base_route}/:id`, checkRole(['TELECOM']), getTipoClaveById);

// Ruta para crear un nuevo tipo de clave
router.post(base_route, checkRole(['TELECOM']), createTipoClave);

// Ruta para eliminar un tipo de clave
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteTipoClave);

// Ruta para actualizar un tipo de clave
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateTipoClave);

export default router;
