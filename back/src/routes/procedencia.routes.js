import { Router } from "express";
import {
    // getProcedencias,
    getProcedenciasPage,
    getProcedenciaById,
    createProcedencia,
    deleteProcedencia,
    updateProcedencia
} from "../controllers/procedencia.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/procedencia";

// router.get(base_route, getProcedencias);
router.get(base_route, checkRole(['TELECOM']), getProcedenciasPage); // paginado
// http://{url}/api/procedencia
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getProcedenciaById);

router.post(base_route, checkRole(['TELECOM']), createProcedencia);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteProcedencia);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateProcedencia);

export default router;