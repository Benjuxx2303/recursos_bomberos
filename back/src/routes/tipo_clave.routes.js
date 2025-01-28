import { Router } from "express";
import {
  getTiposClave,
  getTiposClavePage,
  getTipoClaveById,
  createTipoClave,
  deleteTipoClave,
  updateTipoClave,
} from "../controllers/tipo_clave.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/tipo_clave";

// Ruta para obtener todos los tipos de clave con paginación
router.get(base_route, checkPermission('getTipo_clave'), getTiposClavePage); 
// QueryParams:
// page:              1
// pageSize:          10

// Ruta para obtener tipo de clave por ID
router.get(`${base_route}/:id`, checkPermission('getTipo_clave'), getTipoClaveById);

// Ruta para crear un nuevo tipo de clave
router.post(base_route, checkPermission('createTipo_clave'), createTipoClave);

// Ruta para eliminar un tipo de clave
router.delete(`${base_route}/:id`, checkPermission('deleteTipo_clave'), deleteTipoClave);

// Ruta para actualizar un tipo de clave
router.patch(`${base_route}/:id`, checkPermission('updateTipo_clave'), updateTipoClave);

export default router;
