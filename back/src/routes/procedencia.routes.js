import { Router } from "express";
import {
    getProcedencias,
    getProcedenciaById,
    createProcedencia,
    deleteProcedencia,
    updateProcedencia
} from "../controllers/procedencia.controllers.js";

const router = Router();

const base_route = "/procedencia";

router.get(base_route, getProcedencias);
router.get(`${base_route}/:id`, getProcedenciaById);

router.post(base_route, createProcedencia);

router.delete(`${base_route}/:id`, deleteProcedencia);

router.patch(`${base_route}/:id`, updateProcedencia);

export default router;