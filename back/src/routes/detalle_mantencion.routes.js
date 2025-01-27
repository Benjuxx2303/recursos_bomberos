import { Router } from "express";
import {
    // getDetallesMantencion,
    getDetallesMantencionPage,
    getDetalleMantencion,
    createDetalleMantencion,
    deleteDetalleMantencion,
    updateDetalleMantencion,
    getDetalleMantencionByMantencionID // Importar la nueva función
} from "../controllers/detalle_mantencion.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/detalle_mantencion';

// Obtener todos los detalles de mantención
// router.get(base_route, getDetallesMantencion);
router.get(base_route, checkRole(['TELECOM']), getDetallesMantencionPage); // paginado
// http://{url}/api/detalle_mantencion
// QueryParams:
// page:              1
// pageSize:          10

// Obtener detalle de mantención por ID
router.get(`${base_route}/:id`, checkRole(['TELECOM']), getDetalleMantencion);

// Obtener detalles de mantención por ID de mantención
router.get(`${base_route}/mantencion/:mantencion_id`, checkRole(['TELECOM']), getDetalleMantencionByMantencionID); // Nueva ruta

// Crear un nuevo detalle de mantención
router.post(base_route, checkRole(['TELECOM']), createDetalleMantencion);

// Eliminar detalle de mantención
router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteDetalleMantencion);

// Actualizar detalle de mantención
router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateDetalleMantencion);

export default router;
