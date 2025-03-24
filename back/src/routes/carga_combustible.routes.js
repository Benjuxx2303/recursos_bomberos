import { Router } from "express";
import multer from 'multer';
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createCargaCombustible,
    createCargaCombustibleBitacora,
    downCargaCombustible,
    getCargaCombustibleByID,
    getCargaCombustibleDetailsSearch,
    getCargaCombustibleFull,
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

// Rutas GET (ordenadas de más específica a menos específica)
router.get(`${base_route}/full`, checkPermission('verCargasCombustible'), getCargaCombustibleFull);
router.get(`${base_route}/:id`, checkPermission('getCarga_cumbustible'), getCargaCombustibleByID);
router.get(base_route, checkPermission('verCargasCombustible'), getCargaCombustibleDetailsSearch);

// Rutas POST
router.post(`${base_route}/simple`, checkPermission('ingresarCargaCombustible'), uploadFields, createCargaCombustible);
router.post(base_route, checkPermission('ingresarCargaCombustible'), uploadFields, createCargaCombustibleBitacora);

// Rutas DELETE y PATCH
router.delete(`${base_route}/:id`, checkPermission('eliminarCargaCombustible'), downCargaCombustible);
router.patch(`${base_route}/:id`, checkPermission('actualizarCargaCombustible'), uploadFields, updateCargaCombustible);

export default router;
