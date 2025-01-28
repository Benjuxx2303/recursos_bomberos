import { Router } from "express";
import {
    // getTiposMaquinas,
    getTiposMaquinasPage,
    getTipoMaquinaById,
    createTipoMaquina,
    deleteTipoMaquina,
    updateTipoMaquina
} from "../controllers/tipo_maquina.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/tipo_maquina";

// router.get(base_route, getTiposMaquinas);
router.get(base_route, checkPermission('getTipo_maquina'), getTiposMaquinasPage); // paginado
// http://{url}/api/tipo_maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getTipo_maquina'), getTipoMaquinaById);

router.post(base_route, checkPermission('createTipo_maquina'), createTipoMaquina);

router.delete(`${base_route}/:id`, checkPermission('deleteTipo_maquina'), deleteTipoMaquina);

router.patch(`${base_route}/:id`, checkPermission('updateTipo_maquina'), updateTipoMaquina);

export default router;