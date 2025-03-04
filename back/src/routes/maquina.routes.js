import { Router } from "express";
import multer from 'multer';
import cron from 'node-cron';
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    activarMaquinaPorPatente,
    asignarConductores,
    createMaquina,
    deleteMaquina,
    getMaquinaById,
    getMaquinasDetailsPage,
    updateMaquina,
    verificarEstadoMantencion,
    verificarEstadoPermisoCirculacion,
} from "../controllers/maquina.controllers.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
    { name: 'imagen' },
    { name: 'img_rev_tecnica' },
    { name: 'img_seguro' },
    { name: 'img_permiso_circulacion' }
]);

// Programar la verificación de estado de mantención todos los días a las 6:00 AM
cron.schedule('0 6 * * *', async () => {
    try {
        await verificarEstadoMantencion();
        console.log('Verificación de estado de mantención completada.');
    } catch (error) {
        console.error('Error al programar la verificación de mantención:', error);
    }
});

// Programar la verificación de estado de permiso de circulación todos los días a las 7:00 AM
cron.schedule('0 7 * * *', async () => {
    try {
        await verificarEstadoPermisoCirculacion();
        console.log('Verificación de estado de permiso de circulación completada.');
    } catch (error) {
        console.error('Error al programar la verificación de permiso de circulación:', error);
    }
});

const router = Router();

const base_route = '/maquina'

// Endpoint para ejecutar la verificación manualmente
router.get(`${base_route}/verificar-mantencion`, async (req, res) => {
    try {
        await verificarEstadoMantencion();
        res.status(200).json({ message: 'Verificación de estado de mantención completada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar estado de mantención.', error: error.message });
    }
});

// Endpoint para ejecutar la verificación manualmente
router.get(`${base_route}/verificar-permiso-circulacion`, async (req, res) => {
    try {
        await verificarEstadoPermisoCirculacion();
        res.status(200).json({ message: 'Verificación de estado de permiso de circulación completada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar estado de permiso de circulación.', error: error.message });
    }
});

// router.get(base_route, getMaquinasDetails);
router.get(base_route, checkPermission('getMaquina'), getMaquinasDetailsPage); // paginado
// http://{url}/api/maquina
// QueryParams:
// page:              1
// pageSize:          10
router.patch(`${base_route}/activar/:patente`, checkPermission('updateMaquina'), activarMaquinaPorPatente);
router.get(`${base_route}/:id`, checkPermission('getMaquina'), getMaquinaById); // Obtener una máquina por ID
router.post(base_route, checkPermission('crearMaquina'), uploadFields, createMaquina); // Crear una nueva máquina
router.delete(`${base_route}/:id`, checkPermission('eliminarMaquina'), deleteMaquina); // dar de baja una máquina
router.patch(`${base_route}/:id`, checkPermission('actualizarMaquina'), uploadFields, updateMaquina); // actualizar la máquina
router.get(`${base_route}/:id`, checkPermission('getMaquina'),getMaquinaById);

/* // Asignar conductor/es  a una maquina 
router.post(`${base_route}/:maquina_id/conductores`, checkPermission('updateMaquina'), asignarConductores);
*/
// Asignar conductor/es  a una maquina 
router.post(`${base_route}/asignar-conductores`, checkPermission('crearMaquina'), asignarConductores);


export default router;