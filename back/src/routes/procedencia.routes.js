import { Router } from "express";
import {
    // getProcedencias,
    getProcedenciasPage,
    getProcedenciaById,
    createProcedencia,
    deleteProcedencia,
    updateProcedencia
} from "../controllers/procedencia.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/procedencia";

// router.get(base_route, getProcedencias);
router.get(base_route, checkPermission('getProcedencia'), getProcedenciasPage); // paginado
// http://{url}/api/procedencia
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getProcedencia'), getProcedenciaById);

router.post(base_route, checkPermission('createProcedencia'), createProcedencia);

router.delete(`${base_route}/:id`, checkPermission('deleteProcedencia'), deleteProcedencia);

router.patch(`${base_route}/:id`, checkPermission('updateProcedencia'), updateProcedencia);

export default router;