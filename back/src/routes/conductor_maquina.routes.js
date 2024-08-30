import { Router } from "express";
import { 
    getConductorMaquina,
    getConductorMaquinaById,
    createConductorMaquina,
    deleteConductorMaquina,
    updateConductorMaquina
} from "../controllers/conductor_maquina.controllers.js";

const router = Router();

const base_route = '/conductor_maquina'

router.get(base_route, getConductorMaquina);
router.get(`${base_route}/:id`, getConductorMaquinaById);

router.post(base_route, createConductorMaquina);

router.delete(`${base_route}/:id`, deleteConductorMaquina);

router.patch(`${base_route}/:id`, updateConductorMaquina);

export default router;