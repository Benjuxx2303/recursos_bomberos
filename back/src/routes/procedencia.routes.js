import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createProcedencia,
    deleteProcedencia,
    getProcedenciaById,
    // getProcedencias,
    getProcedenciasPage,
    updateProcedencia
} from "../controllers/procedencia.controllers.js";

const router = Router();

const base_route = "/procedencia";

// router.get(base_route, getProcedencias);
router.get(base_route, checkPermission('verProcedencias'), getProcedenciasPage); // paginado
// http://{url}/api/procedencia
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verProcedencias'), getProcedenciaById);

router.post(base_route, checkPermission('ingresarProcedencia'), createProcedencia);

router.delete(`${base_route}/:id`, checkPermission('eliminarProcedencia'), deleteProcedencia);

router.patch(`${base_route}/:id`, checkPermission('actualizarProcedencia'), updateProcedencia);

export default router;