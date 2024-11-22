import { Router } from "express";
import {
    // getTiposMaquinas,
    getTiposMaquinasPage,
    getTipoMaquinaById,
    createTipoMaquina,
    deleteTipoMaquina,
    updateTipoMaquina
} from "../controllers/tipo_maquina.controllers.js";

const router = Router();

const base_route = "/tipo_maquina";

// router.get(base_route, getTiposMaquinas);
router.get(base_route, getTiposMaquinasPage); // paginado
// http://{url}/api/tipo_maquina
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, getTipoMaquinaById);

router.post(base_route, createTipoMaquina);

router.delete(`${base_route}/:id`, deleteTipoMaquina);

router.patch(`${base_route}/:id`, updateTipoMaquina);

export default router;