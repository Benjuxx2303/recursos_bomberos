import { Router } from "express";
import {
    getDetallesMantencion,
    getDetalleMantencion,
    createDetalleMantencion,
    deleteDetalleMantencion,
    updateDetalleMantencion,
} from "../controllers/detalle_mantencion.controllers.js";

const router = Router();

const base_route = '/detalle_mantencion';

// Obtener todos los detalles de mantención
router.get(base_route, getDetallesMantencion);

// Obtener detalle de mantención por ID
router.get(`${base_route}/:id`, getDetalleMantencion);

// Crear un nuevo detalle de mantención
router.post(base_route, createDetalleMantencion);

// Eliminar detalle de mantención
router.delete(`${base_route}/:id`, deleteDetalleMantencion);

// Actualizar detalle de mantención
router.patch(`${base_route}/:id`, updateDetalleMantencion);

export default router;
