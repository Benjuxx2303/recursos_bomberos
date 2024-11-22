import { Router } from "express";
import {
    getDivision,
    // getDivisiones,
    getDivisionesPage,
    createDivision,
    deleteDivision,
    updateDivision,
} from "../controllers/division.controllers.js";

const router = Router();

const base_route = '/division';

// router.get(base_route, getDivisiones);
router.get(base_route, getDivisionesPage); // paginado
// http://{url}/api/division
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, getDivision);

router.post(base_route, createDivision);

router.delete(`${base_route}/:id`, deleteDivision);

router.patch(`${base_route}/:id`, updateDivision);

export default router;
