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
router.get(base_route, checkPermission("getModelo"), getModelos);

// Ruta para obtener modelos paginados
router.get(`${base_route}/page`, checkPermission("getModelo"), getModelosPage);

// Ruta para obtener un modelo específico
router.get(`${base_route}/:id`, checkPermission("getModelo"), getModeloById);

// Ruta para crear un nuevo modelo
router.post(
  base_route,
  checkPermission("createModelo"),
  uploadFields,
  createModelo
);

// Ruta para eliminar un modelo
router.delete(
  `${base_route}/:id`,
  checkPermission("deleteModelo"),
  deleteModelo
);

// Ruta para actualizar un modelo
router.patch(
  `${base_route}/:id`,
  checkPermission("updateModelo"),
  uploadFields,
  updateModelo
);

export default router;
