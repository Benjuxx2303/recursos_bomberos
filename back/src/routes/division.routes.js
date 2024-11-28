import { Router } from "express";
import {
    getDivision,
    // getDivisiones,
    getDivisionesPage,
    createDivision,
    deleteDivision,
    updateDivision,
} from "../controllers/division.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/division';

// router.get(base_route, getDivisiones);
router.get(base_route, checkRole(['TELECOM']), getDivisionesPage); // paginado
// http://{url}/api/division
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getDivision);

router.post(base_route, checkRole(['TELECOM']), createDivision);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteDivision);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateDivision);

export default router;
