import { Router } from "express";
import {
    getPersonalWithDetails,
    getPersonalbyID,
    createPersonal,
    downPersonal,
    updatePersonal,
    updateImage,
} from "../controllers/personal.controllers.js";
import multer from 'multer';

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// TODO: Resto de rutas: busqueda con LIKE (sql)

const router = Router();
const base_route = '/personal';

router.get(base_route, getPersonalWithDetails);

router.get(`${base_route}/:id`, getPersonalbyID);

router.post(base_route, createPersonal);

// Dar de baja (marcar como inactivo)
router.delete(`${base_route}/:id`, downPersonal);

// Actualizar personal
router.patch(`${base_route}/:id`, updatePersonal);

// Nueva ruta para actualizar la imagen
router.patch(`${base_route}/:id/image`, upload.single('file'), updateImage); // Ruta para actualizar la imagen

export default router;