import { Router } from "express";
import {
    // getSubdivisiones,
    getSubdivisionesPage,
    getSubdivision,
    createSubdivision,
    deleteSubdivision,
    updateSubdivision,
} from "../controllers/subdivision.controllers.js";

const router = Router();

const base_route = '/subdivision';

// router.get(base_route, getSubdivisiones);
router.get(base_route, getSubdivisionesPage);
// http://{url}/api/subdivision
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, getSubdivision);

router.post(base_route, createSubdivision);

router.delete(`${base_route}/:id`, deleteSubdivision);

router.patch(`${base_route}/:id`, updateSubdivision);

export default router;
