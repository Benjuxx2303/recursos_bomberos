import { Router } from "express";
import {
    getEstadosMantencionPage,
    getEstadoMantencionById,
    createEstadoMantencion,
    deleteEstadoMantencion,
    updateEstadoMantencion
} from "../controllers/estado_mantencion.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/estado_mantencion"; 

router.get(base_route, checkPermission('getEstado_mantencion'), getEstadosMantencionPage); // paginado
// http://{url}/api/estado_mantencion
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getEstado_mantencion'), getEstadoMantencionById);

router.post(base_route, checkPermission('createEstado_mantencion'), createEstadoMantencion);

router.delete(`${base_route}/:id`, checkPermission('deleteEstado_mantencion'), deleteEstadoMantencion);

router.patch(`${base_route}/:id`, checkPermission('updateEstado_mantencion'), updateEstadoMantencion);

export default router;
