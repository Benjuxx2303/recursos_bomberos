import { Router } from "express";
import {
    getDetallesMantencion,
    getDetalleMantencion,
    createDetalleMantencion,
    deleteDetalleMantencion,
    updateDetalleMantencion,
    getDetalleMantencionByMantencionID // Importar la nueva función
} from "../controllers/detalle_mantencion.controllers.js";

const router = Router();

const base_route = '/detalle_mantencion';

// Obtener todos los detalles de mantención
router.get(base_route, getDetallesMantencion);

// Obtener detalle de mantención por ID
router.get(`${base_route}/:id`, getDetalleMantencion);

// Obtener detalles de mantención por ID de mantención
router.get(`${base_route}/mantencion/:mantencion_id`, getDetalleMantencionByMantencionID); // Nueva ruta

// Crear un nuevo detalle de mantención
router.post(base_route, createDetalleMantencion);

// Eliminar detalle de mantención
router.delete(`${base_route}/:id`, deleteDetalleMantencion);

// Actualizar detalle de mantención
router.patch(`${base_route}/:id`, updateDetalleMantencion);

export default router;
