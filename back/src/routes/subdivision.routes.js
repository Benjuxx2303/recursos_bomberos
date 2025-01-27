import { Router } from "express";
import {
    // getSubdivisiones,
    getSubdivisionesPage,
    getSubdivision,
    createSubdivision,
    deleteSubdivision,
    updateSubdivision,
} from "../controllers/subdivision.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/subdivision';

// router.get(base_route, getSubdivisiones);
router.get(base_route, checkRole(['TELECOM']), getSubdivisionesPage);
// http://{url}/api/subdivision
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getSubdivision);

router.post(base_route, checkRole(['TELECOM']), createSubdivision);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteSubdivision);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateSubdivision);

export default router;
