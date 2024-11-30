import { Router } from "express";
import { checkRole } from "../controllers/authMiddleware.js";
import {
    createCompania,
    deleteCompania,
    getCompania,
    // getCompanias,
    getCompaniasPage,
    updateCompania,
} from "../controllers/compania.controllers.js";

const router = Router();
const base_route = '/compania';

// router.get(base_route, getCompanias);
router.get(base_route, getCompaniasPage); // paginado
// http://{url}/api/compania
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`,getCompania);

router.post(base_route, checkRole(['TELECOM']), createCompania);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteCompania);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateCompania);

export default router;
