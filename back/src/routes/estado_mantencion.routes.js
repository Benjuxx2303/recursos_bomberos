import { Router } from "express";
import {
    // getEstadosMantencion,
    getEstadosMantencionPage,
    getEstadoMantencionById,
    createEstadoMantencion,
    deleteEstadoMantencion,
    updateEstadoMantencion
} from "../controllers/estado_mantencion.controllers.js";

const router = Router();

const base_route = "/estado_mantencion"; 

// router.get(base_route, getEstadosMantencion);
router.get(base_route, getEstadosMantencionPage); // paginado
// http://{url}/api/estado_mantencion
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, getEstadoMantencionById);

router.post(base_route, createEstadoMantencion);

router.delete(`${base_route}/:id`, deleteEstadoMantencion);

router.patch(`${base_route}/:id`, updateEstadoMantencion);

export default router;
