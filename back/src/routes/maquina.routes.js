import { Router } from "express";
import { 
    getMaquinas,
    // getMaquinasDetails,
    getMaquinasDetailsPage,
    getMaquinaById,
    createMaquina,
    deleteMaquina,
    updateMaquina,
    updateImage
} from "../controllers/maquina.controllers.js";
import multer from 'multer';
import { checkRole } from "../controllers/authMiddleware.js";

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

const base_route = '/maquina'

// router.get(base_route, getMaquinasDetails);
router.get(base_route, checkRole(['TELECOM']), getMaquinasDetailsPage); // paginado
// http://{url}/api/maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getMaquinaById);

router.post(base_route, checkRole(['TELECOM']), createMaquina);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteMaquina);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateMaquina);
router.patch(`${base_route}/:id/image`, checkRole(['TELECOM']), upload.single('file'), updateImage); // Ruta para actualizar la imagen


export default router;