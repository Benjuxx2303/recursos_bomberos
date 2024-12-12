import { Router } from "express";
import { 
    getMaquinasDetailsPage,
    getMaquinaById,
    createMaquina,
    deleteMaquina,
    updateMaquina,
} from "../controllers/maquina.controllers.js";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";

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
router.get(base_route, checkRole(['TELECOM']), getMaquinasDetailsPage); // paginado
// http://{url}/api/maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getMaquinaById); // Obtener una máquina por ID
router.post(base_route, checkRole(['TELECOM']), uploadFields, createMaquina); // Crear una nueva máquina
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteMaquina); // dar de baja una máquina
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), uploadFields, updateMaquina); // actualizar la máquina

export default router;