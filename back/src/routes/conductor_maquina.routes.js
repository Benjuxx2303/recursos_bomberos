import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createConductorMaquina,
    deleteConductorMaquina,
    getConductorMaquinaById,
    getConductorMaquinaPage,
    updateConductorMaquina
} from "../controllers/conductor_maquina.controllers.js";

const router = Router();

const base_route = '/conductor_maquina'

router.get(base_route, checkPermission('verAsignacionesMaquinas'), getConductorMaquinaPage); // paginado
// http://{url}/api/conductor_maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verAsignacionesMaquinas'), getConductorMaquinaById);

router.post(base_route, checkPermission('asignarMaquina'), createConductorMaquina);

router.delete(`${base_route}/:id`, checkPermission('eliminarAsignacionMaquina'), deleteConductorMaquina);

router.patch(`${base_route}/:id`, checkPermission('asignarMaquina'), updateConductorMaquina);

export default router;