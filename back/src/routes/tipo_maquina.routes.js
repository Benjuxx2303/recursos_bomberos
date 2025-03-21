import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createTipoMaquina,
    deleteTipoMaquina,
    getTipoMaquinaById,
    // getTiposMaquinas,
    getTiposMaquinasPage,
    updateTipoMaquina
} from "../controllers/tipo_maquina.controllers.js";

const router = Router();

const base_route = "/tipo_maquina";

// router.get(base_route, getTiposMaquinas);
router.get(base_route, checkPermission('verModelos'), getTiposMaquinasPage); // paginado
// http://{url}/api/tipo_maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('verTiposMaquina'), getTipoMaquinaById);

router.post(base_route, checkPermission('createTipo_maquina'), createTipoMaquina);

router.delete(`${base_route}/:id`, checkPermission('deleteTipo_maquina'), deleteTipoMaquina);

router.patch(`${base_route}/:id`, checkPermission('updateTipo_maquina'), updateTipoMaquina);

export default router;