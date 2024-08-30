import { Router } from "express";
import {
    getPersonal,
    getPersonalWithDetails,
    getPersonalbyID,
    createPersonal,
    downPersonal,
    updatePersonal,
} from "../controllers/personal.controllers.js";

// TODO: Resto de rutas: busqueda con LIKE

const router = Router();
const base_route = '/personal';

router.get(base_route, getPersonalWithDetails);

// router.get(`${base_route}/details`, getPersonalWithDetails)

router.get(`${base_route}/:id`, getPersonalbyID);

router.post(base_route, createPersonal);

// Dar de baja (marcar como inactivo)
router.put(`${base_route}/:id/down`, downPersonal);

// Actualizar personal
router.put(`${base_route}/:id`, updatePersonal);

export default router;