import { Router } from "express";
import { 
    // getTalleres,
    getTalleresPage,
    getTallerById,
    createTaller,
    deleteTaller,
    updateTaller
} from "../controllers/taller.controllers.js";

const router = Router();

const base_route = '/taller'

// router.get(base_route, getTalleres);
router.get(base_route, getTalleresPage);
// http://{url}/api/taller
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, getTallerById);

router.post(base_route, createTaller);

router.delete(`${base_route}/:id`, deleteTaller);

router.patch(`${base_route}/:id`, updateTaller);

export default router;