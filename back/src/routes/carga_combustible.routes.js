import { Router } from "express";
import {
    getCargaCombustibleByID,
    getCargaCombustibleDetailsSearch,
    createCargaCombustibleBitacora,
    downCargaCombustible,
    updateCargaCombustible,
    createCargaCombustible
} from "../controllers/carga_combustible.controllers.js";
import multer from 'multer';
import { checkPermission } from "../controllers/authMiddleware.js";

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
router.get(base_route, checkPermission('getCarga_combustible'), getCargaCombustibleDetailsSearch); // paginado
// http://{url}/api/carga_combustible
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getCarga_cumbustible'), getCargaCombustibleByID); // Obtener una carga de combustible por ID
router.post(`${base_route}/simple`, checkPermission('createCarga_combustible'), uploadFields, createCargaCombustible); // Crear una nueva carga de combustible
router.post(base_route, checkPermission('createCarga_combustible'), uploadFields, createCargaCombustibleBitacora); // Crear una nueva carga de combustible
router.delete(`${base_route}/:id`, checkPermission('deleteCarga_combustible'), downCargaCombustible); // dar de baja una carga de combustible
router.patch(`${base_route}/:id`, checkPermission('updateCarga_combustible'), uploadFields, updateCargaCombustible); // actualizar la carga de combustible

export default router;
