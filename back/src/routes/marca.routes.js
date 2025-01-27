import { Router } from "express";
import {
    getMarcas,
    getMarcasPage,
    getMarcaById,
    createMarca,
    deleteMarca,
    updateMarca
} from "../controllers/marca.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/marca";

// router.get(base_route, getMarcas);
router.get(base_route, checkRole(['TELECOM']), getMarcasPage); // paginado
// http://{url}/api/marca
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getMarcaById);

router.post(base_route, checkRole(['TELECOM']), createMarca);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteMarca);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateMarca);

export default router;
