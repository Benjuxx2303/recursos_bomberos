import { Router } from "express";
import {
    getDetallesMantencionPage,
    getDetalleMantencion,
    createDetalleMantencion,
    deleteDetalleMantencion,
    updateDetalleMantencion,
    getDetalleMantencionByMantencionID // Importar la nueva función
} from "../controllers/detalle_mantencion.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/detalle_mantencion';

// Obtener todos los detalles de mantención
router.get(base_route, checkPermission('getDetalle_mantencion'), getDetallesMantencionPage); // paginado
// http://{url}/api/detalle_mantencion
// QueryParams:
// page:              1
// pageSize:          10

// Obtener detalle de mantención por ID
router.get(`${base_route}/:id`, checkPermission('getDetalle_mantencion'), getDetalleMantencion);

// Obtener detalles de mantención por ID de mantención
router.get(`${base_route}/mantencion/:mantencion_id`, checkPermission('getDetalle_mantencion'), getDetalleMantencionByMantencionID); // Nueva ruta

// Crear un nuevo detalle de mantención
router.post(base_route, checkPermission('createDetalle_mantencion'), createDetalleMantencion);

// Eliminar detalle de mantención
router.delete(`${base_route}/:id`, checkPermission('deleteDetalle_mantencion'), deleteDetalleMantencion);

// Actualizar detalle de mantención
router.patch(`${base_route}/:id`, checkPermission('updateDetalle_mantencion'), updateDetalleMantencion);

export default router;
