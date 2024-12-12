import { Router } from "express";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";
import {
    createPersonal,
    downPersonal,
    getPersonalWithDetailsPage,
    getPersonalbyID,
    updatePersonal,
} from "../controllers/personal.controllers.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
    { name: 'imagen' }, 
    { name: 'imgLicencia' }
]);

// TODO: Resto de rutas: busqueda con LIKE (sql)

const router = Router();
const base_route = '/personal';

// router.get(base_route, getPersonalWithDetails);
router.get(base_route, checkRole(['TELECOM']), getPersonalWithDetailsPage); // con paginación
// http://{url}/api/personal
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getPersonalbyID); // Obtener un personal por ID
router.post(base_route, checkRole(['TELECOM']), uploadFields, createPersonal); // Crear un nuevo personal
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), downPersonal); // dar de baja un personal
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), uploadFields, updatePersonal); // actualizar el personal
export default router;