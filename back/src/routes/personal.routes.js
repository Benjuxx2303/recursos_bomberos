import { Router } from "express";
import multer from 'multer';
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createPersonal,
    downPersonal,
    getPersonalWithDetailsPage,
    getPersonalbyID,
    updatePersonal,
    activatePersonal,
    deactivatePersonal,
    updateUltimaFecServicio
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

router.get(`${base_route}/update-last-service-date`, checkPermission('getPersonal'), updateUltimaFecServicio);

// router.get(base_route, getPersonalWithDetails);
router.get(base_route, checkPermission('getPersonal'), getPersonalWithDetailsPage); // con paginación
// http://{url}/api/personal/
// QueryParams:
// id:          61
// rut:         23904666-5

router.patch(`${base_route}/activate`, checkPermission('updatePersonal'), activatePersonal);
// http://{url}/api/personal/activate
// QueryParams:
// id:          61
// rut:         23904666-5

router.patch(`${base_route}/deactivate`, checkPermission('updatePersonal'), deactivatePersonal);
// http://{url}/api/personal/deactivate
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getPersonal'), getPersonalbyID); // Obtener un personal por ID
router.post(base_route, checkPermission('createPersonal'), uploadFields, createPersonal); // Crear un nuevo personal
router.delete(`${base_route}/:id`, checkPermission('deletePersonal'), downPersonal); // dar de baja un personal
router.patch(`${base_route}/:id`, checkPermission('updatePersonal'), uploadFields, updatePersonal); // actualizar el personal
export default router;