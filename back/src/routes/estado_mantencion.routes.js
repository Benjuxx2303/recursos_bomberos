import { Router } from "express";
import {
    // getEstadosMantencion,
    getEstadosMantencionPage,
    getEstadoMantencionById,
    createEstadoMantencion,
    deleteEstadoMantencion,
    updateEstadoMantencion
} from "../controllers/estado_mantencion.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/estado_mantencion"; 

// router.get(base_route, getEstadosMantencion);
router.get(base_route, checkRole(['TELECOM']), getEstadosMantencionPage); // paginado
// http://{url}/api/estado_mantencion
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getEstadoMantencionById);

router.post(base_route, checkRole(['TELECOM']), createEstadoMantencion);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteEstadoMantencion);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateEstadoMantencion);

export default router;
