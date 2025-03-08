import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createDetalleMantencion,
    deleteDetalleMantencion,
    getDetalleMantencion,
    getDetalleMantencionByMantencionID // Importar la nueva función
    ,


    getDetallesMantencionPage,
    updateDetalleMantencion
} from "../controllers/detalle_mantencion.controllers.js";

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
router.post(base_route, checkPermission('ingresarMantencion'), createDetalleMantencion);

// Eliminar detalle de mantención
router.delete(`${base_route}/:id`, checkPermission('eliminarMantencion'), deleteDetalleMantencion);

// Actualizar detalle de mantención
router.patch(`${base_route}/:id`, checkPermission('actualizarMantencion'), updateDetalleMantencion);

export default router;
