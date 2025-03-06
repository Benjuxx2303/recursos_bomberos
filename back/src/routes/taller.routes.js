import { Router } from "express";
import { checkPermission } from "../controllers/authMiddleware.js";
import {
    createTaller,
    deleteTaller,
    getTallerById,
    // getTalleres,
    getTalleresPage,
    getTiposTaller,
    updateTaller
} from "../controllers/taller.controllers.js";

const router = Router();

const base_route = '/taller'

// router.get(base_route, getTalleres);
router.get(base_route, checkPermission('getTaller'), getTalleresPage);
// http://{url}/api/taller
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/:id`, checkPermission('getTaller'), getTallerById);

router.post(base_route, checkPermission('createTaller'), createTaller);

router.delete(`${base_route}/:id`, checkPermission('deleteTaller'), deleteTaller);

router.patch(`${base_route}/:id`, checkPermission('updateTaller'), updateTaller);

router.get(`${base_route}/tipos_taller`, getTiposTaller);

export default router;