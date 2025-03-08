import { Router } from "express";
import multer from 'multer';
import cron from 'node-cron';
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    activatePersonal,
    asignarMaquinas,
    createPersonal,
    deactivatePersonal,
    downPersonal,
    getPersonalLowData,
    getPersonalWithDetailsPage,
    getPersonalbyID,
    quitarMaquinas,
    updatePersonal,
    updateUltimaFecServicio,
    verificarVencimientoLicencia
} from "../controllers/personal.controllers.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
    { name: 'imagen' }, 
    { name: 'imgLicencia' }
]);

// Programar la verificación de vencimiento de licencia todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
    try {
        await verificarVencimientoLicencia();
        console.log('Verificación de vencimiento de licencia completada.');
    } catch (error) {
        console.error('Error al programar la verificación de licencia:', error);
    }
});

// TODO: Resto de rutas: busqueda con LIKE (sql)

const router = Router();
const base_route = '/personal';

// Endpoint para ejecutar la verificación manualmente
router.get(`${base_route}/verificar-licencia`, async (req, res) => {
    try {
        await verificarVencimientoLicencia();
        res.status(200).json({ message: 'Verificación de vencimiento de licencia completada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar vencimiento de licencia.', error: error.message });
    }
});

router.get(`${base_route}/update-last-service-date`, checkPermission('getPersonal'), updateUltimaFecServicio);

// router.get(base_route, getPersonalWithDetails);
router.get(base_route, checkPermission('getPersonal'), getPersonalWithDetailsPage); // con paginación
// http://{url}/api/personal/
// QueryParams:
// id:          61
// rut:         23904666-5

router.get(`${base_route}/low-data`, checkPermission('getPersonal'), getPersonalLowData);
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

// Agregar la ruta para asignar máquinas con middleware de autenticación
router.post(`${base_route}/:personal_id/maquinas`, checkPermission('updatePersonal'), asignarMaquinas);

//Quitar asignacion de maquinas
router.delete(`${base_route}/:personal_id/maquinas/:maquina_id`, checkPermission('updatePersonal'), quitarMaquinas);

export default router;  