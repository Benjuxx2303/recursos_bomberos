import { Router } from "express";
import {
    // getServicios,
    getServiciosPage,
    getServicio,
    createServicio,
    deleteServicio,
    updateServicio,
} from "../controllers/servicio.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/servicio';

// router.get(base_route, getServicios); // Obtener todos los servicios
router.get(base_route, checkRole(['TELECOM']), getServiciosPage); // paginación
// http://{url}/api/servicio
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getServicio); // Obtener un servicio por ID
router.post(base_route, checkRole(['TELECOM']), createServicio); // Crear un nuevo servicio
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteServicio); // Eliminar un servicio
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateServicio); // Actualizar un servicio

export default router;
