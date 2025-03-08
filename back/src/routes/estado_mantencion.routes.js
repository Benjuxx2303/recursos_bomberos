import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createEstadoMantencion,
    deleteEstadoMantencion,
    getEstadoMantencionById,
    getEstadosMantencionPage,
    updateEstadoMantencion
} from "../controllers/estado_mantencion.controllers.js";

const router = Router();

const base_route = "/estado_mantencion"; 

router.get(base_route, checkPermission('verEstadosMantencion'), getEstadosMantencionPage); // paginado
// http://{url}/api/estado_mantencion
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verEstadosMantencion'), getEstadoMantencionById);

router.post(base_route, checkPermission('crearEstadoMantencion'), createEstadoMantencion);

router.delete(`${base_route}/:id`, checkPermission('eliminarEstadoMantencion'), deleteEstadoMantencion);

router.patch(`${base_route}/:id`, checkPermission('actualizarEstadoMantencion'), updateEstadoMantencion);

export default router;
