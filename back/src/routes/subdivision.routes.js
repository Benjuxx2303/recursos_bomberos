import { Router } from "express";
import {
    // getSubdivisiones,
    getSubdivisionesPage,
    getSubdivision,
    createSubdivision,
    deleteSubdivision,
    updateSubdivision,
} from "../controllers/subdivision.controllers.js";
import { checkPermission } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/subdivision';

// router.get(base_route, getSubdivisiones);
router.get(base_route, checkPermission('getSubdivision'), getSubdivisionesPage);
// http://{url}/api/subdivision
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getSubdivision'), getSubdivision);

router.post(base_route, checkPermission('createSubdivision'), createSubdivision);

router.delete(`${base_route}/:id`, checkPermission('deleteSubdivision'), deleteSubdivision);

router.patch(`${base_route}/:id`, checkPermission('updateSubdivision'), updateSubdivision);

export default router;
