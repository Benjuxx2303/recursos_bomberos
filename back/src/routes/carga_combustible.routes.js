import { Router } from "express";
import {
    // getCargasCombustible,
    getCargasCombustiblePage,
    getCargaCombustibleByID,
    // createCargaCombustible,
    createCargaCombustibleBitacora,
    downCargaCombustible,
    updateCargaCombustible,
    updateImage,
} from "../controllers/carga_combustible.controllers.js";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";

// Configuración de multer 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const router = Router();
const base_route = '/carga_combustible';

// router.get(base_route, getCargasCombustible);
router.get(base_route, checkRole(['TELECOM']), getCargasCombustiblePage); // paginado
// http://{url}/api/carga_combustible
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getCargaCombustibleByID);

// router.post(base_route, createCargaCombustible);
router.post(base_route, checkRole(['TELECOM']), createCargaCombustibleBitacora);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), downCargaCombustible);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateCargaCombustible);
// Nueva ruta para actualizar la imagen
router.patch(`${base_route}/:id/image`, checkRole(['TELECOM']), upload.single('file'), updateImage); // Ruta para actualizar la imagen

export default router;
