import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createMarca,
    deleteMarca,
    getMarcaById,
    getMarcasPage,
    updateMarca
} from "../controllers/marca.controllers.js";

const router = Router();

const base_route = "/marca";

// router.get(base_route, getMarcas);
router.get(base_route, checkPermission('verMarcas'), getMarcasPage); // paginado
// http://{url}/api/marca
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verMarcas'), getMarcaById);

router.post(base_route, checkPermission('ingresarMarca'), createMarca);

router.delete(`${base_route}/:id`, checkPermission('eliminarMarca'), deleteMarca);

router.patch(`${base_route}/:id`, checkPermission('actualizarMarca'), updateMarca);

export default router;
