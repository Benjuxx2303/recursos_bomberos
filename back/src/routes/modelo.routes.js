import { Router } from "express";
import multer from "multer";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
  createModelo,
  deleteModelo,
  getModeloById,
  getModelos,
  getModelosPage,
  updateModelo,
} from "../controllers/modelo.controllers.js";
// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([{ name: "imagen" }]);

const router = Router();

const base_route = "/modelo";

// Ruta para obtener todos los modelos (sin paginación)
router.get(base_route, checkPermission("verModelos"), getModelos);

// Ruta para obtener modelos paginados
router.get(`${base_route}/page`, checkPermission("verModelos"), getModelosPage);

// Ruta para obtener un modelo específico
router.get(`${base_route}/:id`, checkPermission("verModelos"), getModeloById);

// Ruta para crear un nuevo modelo
router.post(
  base_route,
  checkPermission("crearModelo"),
  uploadFields,
  createModelo
);

// Ruta para eliminar un modelo
router.delete(
  `${base_route}/:id`,
  checkPermission("eliminarModelo"),
  deleteModelo
);

// Ruta para actualizar un modelo
router.patch(
  `${base_route}/:id`,
  checkPermission("actualizarModelo"),
  uploadFields,
  updateModelo
);

export default router;
