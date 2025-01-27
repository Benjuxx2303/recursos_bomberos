import { Router } from "express";
import {
    // getTiposMaquinas,
    getTiposMaquinasPage,
    getTipoMaquinaById,
    createTipoMaquina,
    deleteTipoMaquina,
    updateTipoMaquina
} from "../controllers/tipo_maquina.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = "/tipo_maquina";

// router.get(base_route, getTiposMaquinas);
router.get(base_route, checkRole(['TELECOM']), getTiposMaquinasPage); // paginado
// http://{url}/api/tipo_maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getTipoMaquinaById);

router.post(base_route, checkRole(['TELECOM']), createTipoMaquina);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteTipoMaquina);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateTipoMaquina);

export default router;