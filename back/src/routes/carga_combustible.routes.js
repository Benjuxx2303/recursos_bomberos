import { Router } from "express";
import {
    getCargasCombustible,
    getCargaCombustibleByID,
    createCargaCombustible,
    downCargaCombustible,
    updateCargaCombustible,
} from "../controllers/carga_combustible.controllers.js";

const router = Router();
const base_route = '/carga_combustible';

router.get(base_route, getCargasCombustible);

router.get(`${base_route}/:id`, getCargaCombustibleByID);

router.post(base_route, createCargaCombustible);

router.delete(`${base_route}/:id`, downCargaCombustible);

router.put(`${base_route}/:id`, updateCargaCombustible);

export default router;
