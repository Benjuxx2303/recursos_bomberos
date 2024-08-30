import { Router } from "express";
import { 
    getMaquina,
    getMaquinaById,
    createMaquina,
    deleteMaquina,
    updateMaquina
} from "../controllers/maquina.controllers.js";

const router = Router();

const base_route = '/maquina'

router.get(base_route, getMaquina);
router.get(`${base_route}/:id`, getMaquinaById);

router.post(base_route, createMaquina);

router.delete(`${base_route}/:id`, deleteMaquina);

router.patch(`${base_route}/:id`, updateMaquina);

export default router;