import { Router } from "express";
import multer from 'multer';
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    activarMaquinaPorPatente,
    asignarConductores,
    createMaquina,
    deleteMaquina,
    getMaquinaById,
    getMaquinasDetailsPage,
    updateMaquina,
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

const router = Router();

const base_route = '/maquina'

// router.get(base_route, getMaquinasDetails);
router.get(base_route, checkPermission('getMaquina'), getMaquinasDetailsPage); // paginado
// http://{url}/api/maquina
// QueryParams:
// page:              1
// pageSize:          10
router.patch(`${base_route}/activar/:patente`, checkPermission('updateMaquina'), activarMaquinaPorPatente);
router.get(`${base_route}/:id`, checkPermission('getMaquina'), getMaquinaById); // Obtener una máquina por ID
router.post(base_route, checkPermission('createMaquina'), uploadFields, createMaquina); // Crear una nueva máquina
router.delete(`${base_route}/:id`, checkPermission('deleteMaquina'), deleteMaquina); // dar de baja una máquina
router.patch(`${base_route}/:id`, checkPermission('updateMaquina'), uploadFields, updateMaquina); // actualizar la máquina
router.get(`${base_route}/:id`, checkPermission('getMaquina'),getMaquinaById);

/* // Asignar conductor/es  a una maquina 
router.post(`${base_route}/:maquina_id/conductores`, checkPermission('updateMaquina'), asignarConductores);
 */
// Asignar conductor/es  a una maquina 
router.post(`${base_route}/asignar-conductores`, checkPermission('createMaquina'), asignarConductores);

export default router;