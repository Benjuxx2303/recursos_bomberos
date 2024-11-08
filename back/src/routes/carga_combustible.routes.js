import { Router } from "express";
import {
    getCargasCombustible,
    getCargaCombustibleByID,
    // createCargaCombustible,
    createCargaCombustibleBitacora,
    downCargaCombustible,
    updateCargaCombustible,
    updateImage,
} from "../controllers/carga_combustible.controllers.js";
import multer from 'multer';

// Configuración de multer 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const router = Router();
const base_route = '/carga_combustible';

router.get(base_route, getCargasCombustible);

router.get(`${base_route}/:id`, getCargaCombustibleByID);

// router.post(base_route, createCargaCombustible);
router.post(base_route, createCargaCombustibleBitacora);

router.delete(`${base_route}/:id`, downCargaCombustible);

router.patch(`${base_route}/:id`, updateCargaCombustible);
// Nueva ruta para actualizar la imagen
router.patch(`${base_route}/:id/image`, upload.single('file'), updateImage); // Ruta para actualizar la imagen

export default router;
