import { Router } from "express";
import {
    // getCompanias,
    getCompaniasPage,
    getCompania,
    createCompania,
    deleteCompania,
    updateCompania,
} from "../controllers/compania.controllers.js";

const router = Router();
const base_route = '/compania';
import { checkRole } from "../controllers/authMiddleware.js";

// router.get(base_route, getCompanias);
router.get(base_route, getCompaniasPage); // paginado
// http://{url}/api/compania
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getCompania);

router.post(base_route, checkRole(['TELECOM']), createCompania);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteCompania);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateCompania);

export default router;
