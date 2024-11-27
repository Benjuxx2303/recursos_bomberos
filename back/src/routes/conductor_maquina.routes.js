import { Router } from "express";
import { 
    // getConductorMaquina,
    getConductorMaquinaPage,
    getConductorMaquinaById,
    createConductorMaquina,
    deleteConductorMaquina,
    updateConductorMaquina
} from "../controllers/conductor_maquina.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/conductor_maquina'

// router.get(base_route, getConductorMaquina);
router.get(base_route, checkRole(['TELECOM']), getConductorMaquinaPage); // paginado
// http://{url}/api/conductor_maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getConductorMaquinaById);

router.post(base_route, createConductorMaquina);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteConductorMaquina);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateConductorMaquina);

export default router;