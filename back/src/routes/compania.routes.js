import { Router } from "express";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";
import {
    createCompania,
    deleteCompania,
    getCompania,
    getCompaniasPage,
    updateCompania,
} from "../controllers/compania.controllers.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
    { name: 'imagen' }
]);

const router = Router();
const base_route = '/compania';

// router.get(base_route, getCompanias);
router.get(base_route, getCompaniasPage); // paginado
// http://{url}/api/compania
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`,getCompania); // Obtener una compañía por ID
router.post(base_route, checkRole(['TELECOM']), uploadFields, createCompania); // Crear una nueva compañía
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteCompania); // dar de baja una compañía
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), uploadFields, updateCompania); // actualizar la compañía

export default router;
