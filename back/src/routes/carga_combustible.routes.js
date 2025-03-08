import { Router } from "express";
import multer from 'multer';
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createCargaCombustible,
    createCargaCombustibleBitacora,
    downCargaCombustible,
    getCargaCombustibleByID,
    getCargaCombustibleDetailsSearch,
    updateCargaCombustible
} from "../controllers/carga_combustible.controllers.js";

// Configuración de multer 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
    { name: 'imagen', maxCount: 1 }
]);

const router = Router();
const base_route = '/carga_combustible';

// router.get(base_route, getCargasCombustible);
router.get(base_route, checkPermission('verCargasCombustible'), getCargaCombustibleDetailsSearch); // paginado
// http://{url}/api/carga_combustible
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getCarga_cumbustible'), getCargaCombustibleByID); // Obtener una carga de combustible por ID
router.post(`${base_route}/simple`, checkPermission('ingresarCargaCombustible'), uploadFields, createCargaCombustible); // Crear una nueva carga de combustible
router.post(base_route, checkPermission('ingresarCargaCombustible'), uploadFields, createCargaCombustibleBitacora); // Crear una nueva carga de combustible
router.delete(`${base_route}/:id`, checkPermission('eliminarCargaCombustible'), downCargaCombustible); // dar de baja una carga de combustible
router.patch(`${base_route}/:id`, checkPermission('actualizarCargaCombustible'), uploadFields, updateCargaCombustible); // actualizar la carga de combustible

export default router;
