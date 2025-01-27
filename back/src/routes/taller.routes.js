import { Router } from "express";
import { 
    // getTalleres,
    getTalleresPage,
    getTallerById,
    createTaller,
    deleteTaller,
    updateTaller
} from "../controllers/taller.controllers.js";
import { checkRole } from "../controllers/authMiddleware.js";

const router = Router();

const base_route = '/taller'

// router.get(base_route, getTalleres);
router.get(base_route, checkRole(['TELECOM']), getTalleresPage);
// http://{url}/api/taller
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkRole(['TELECOM']), getTallerById);

router.post(base_route, checkRole(['TELECOM']), createTaller);

router.delete(`${base_route}/:id`, checkRole(['TELECOM']), deleteTaller);

router.patch(`${base_route}/:id`, checkRole(['TELECOM']), updateTaller);

export default router;