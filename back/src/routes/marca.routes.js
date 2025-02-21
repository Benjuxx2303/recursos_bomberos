import { Router } from "express";
import {
    getMarcasPage,
    getMarcaById,
    createMarca,
    deleteMarca,
    updateMarca
} from "../controllers/marca.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/marca";

// router.get(base_route, getMarcas);
router.get(base_route, checkPermission('getMarca'), getMarcasPage); // paginado
// http://{url}/api/marca
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getMarca'), getMarcaById);

router.post(base_route, checkPermission('createMarca'), createMarca);

router.delete(`${base_route}/:id`, checkPermission('deleteMarca'), deleteMarca);

router.patch(`${base_route}/:id`, checkPermission('updateMarca'), updateMarca);

export default router;
