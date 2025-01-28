import { Router } from "express";
import {
    getDivision,
    // getDivisiones,
    getDivisionesPage,
    createDivision,
    deleteDivision,
    updateDivision,
} from "../controllers/division.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/division';

// router.get(base_route, getDivisiones);
router.get(base_route, checkPermission('getDivision'), getDivisionesPage); // paginado
// http://{url}/api/division
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getDivision'), getDivision);

router.post(base_route, checkPermission('createDivision'), createDivision);

router.delete(`${base_route}/:id`, checkPermission('deleteDivision'), deleteDivision);

router.patch(`${base_route}/:id`, checkPermission('updateDivision'), updateDivision);

export default router;
