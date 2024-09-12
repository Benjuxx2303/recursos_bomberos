import { Router } from "express";
import {
    getCompanias,
    getCompania,
    createCompania,
    deleteCompania,
    updateCompania,
} from "../controllers/compania.controllers.js";

const router = Router();
const base_route = '/compania';

router.get(base_route, getCompanias);

router.get(`${base_route}/:id`, getCompania);

router.post(base_route, createCompania);

router.delete(`${base_route}/:id`, deleteCompania);

router.patch(`${base_route}/:id`, updateCompania);

export default router;
