import { Router } from "express";
import {
    // getPersonalWithDetails,
    getPersonalWithDetailsPage,
    getPersonalbyID,
    createPersonal,
    downPersonal,
    updatePersonal,
    updateImage,
} from "../controllers/personal.controllers.js";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// TODO: Resto de rutas: busqueda con LIKE (sql)

const router = Router();
const base_route = '/personal';

// router.get(base_route, getPersonalWithDetails);
router.get(base_route, checkRole(['TELECOM']), getPersonalWithDetailsPage); // con paginación
// http://{url}/api/personal
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getPersonalbyID);

router.post(base_route, checkRole(['TELECOM']), createPersonal);

// Dar de baja (marcar como inactivo)
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), downPersonal);

// Actualizar personal
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updatePersonal);

// Nueva ruta para actualizar la imagen
router.patch(`${base_route}/:id/image`, checkRole(['TELECOM']), upload.single('file'), updateImage); // Ruta para actualizar la imagen

export default router;