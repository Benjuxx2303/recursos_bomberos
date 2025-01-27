import { Router } from "express";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";
import {
    asignarConductores,
    createMaquina,
    deleteMaquina,
    getMaquinaById,
    getMaquinasDetailsPage,
    updateMaquina,
    activarMaquinaPorPatente,
} from "../controllers/maquina.controllers.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configuración de multer para los campos o "key" de imagen
const uploadFields = upload.fields([
    { name: 'imagen' }
]);

const router = Router();

const base_route = '/maquina'

// router.get(base_route, getMaquinasDetails);
router.get(base_route,  getMaquinasDetailsPage); // paginado
// http://{url}/api/maquina
// QueryParams:
// page:              1
// pageSize:          10
router.patch(`${base_route}/activar/:patente`, checkRole(['TELECOM']), activarMaquinaPorPatente);
router.get(`${base_route}/:id`, checkRole(['TELECOM']), getMaquinaById); // Obtener una máquina por ID
router.post(base_route, checkRole(['TELECOM']), uploadFields, createMaquina); // Crear una nueva máquina
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteMaquina); // dar de baja una máquina
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), uploadFields, updateMaquina); // actualizar la máquina
router.get(`${base_route}/:id`, getMaquinaById);

// Asignar conductor/es  a una maquina 
router.post(`${base_route}/asignar-conductores`, asignarConductores);


export default router;