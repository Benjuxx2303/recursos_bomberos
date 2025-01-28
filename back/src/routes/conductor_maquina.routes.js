import { Router } from "express";
import { 
    // getConductorMaquina,
    getConductorMaquinaPage,
    getConductorMaquinaById,
    createConductorMaquina,
    deleteConductorMaquina,
    updateConductorMaquina
} from "../controllers/conductor_maquina.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/conductor_maquina'

// router.get(base_route, getConductorMaquina);
router.get(base_route, checkPermission('getConductor_maquina'), getConductorMaquinaPage); // paginado
// http://{url}/api/conductor_maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getConductor_maquina'), getConductorMaquinaById);

router.post(base_route, checkPermission('createConductor_maquina'), createConductorMaquina);

router.delete(`${base_route}/:id`, checkPermission('deleteConductor_maquina'), deleteConductorMaquina);

router.patch(`${base_route}/:id`, checkPermission('updateConductor_maquina'), updateConductorMaquina);

export default router;