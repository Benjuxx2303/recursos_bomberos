import { Router } from "express";
import { 
    getMaquinas,
    getMaquinasDetails,
    getMaquinaById,
    createMaquina,
    deleteMaquina,
    updateMaquina,
    updateImage
} from "../controllers/maquina.controllers.js";
import multer from 'multer';

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

const base_route = '/maquina'

router.get(base_route, getMaquinasDetails);
router.get(`${base_route}/:id`, getMaquinaById);

router.post(base_route, createMaquina);

router.delete(`${base_route}/:id`, deleteMaquina);

router.patch(`${base_route}/:id`, updateMaquina);
router.patch(`${base_route}/:id/image`, upload.single('file'), updateImage); // Ruta para actualizar la imagen


export default router;