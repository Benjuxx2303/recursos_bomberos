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
router.get(base_route, checkPermission('verTalleres'), getTalleresPage);
// http://{url}/api/taller
// QueryParams:
// page:              1
// pageSize:          10

router.get(`${base_route}/tipos_taller`, checkPermission('verTiposTaller'), getTiposTaller);
router.get(`${base_route}/:id`, checkPermission('verTaller'), getTallerById);

router.post(base_route, checkPermission('ingresarTaller'), createTaller);

router.delete(`${base_route}/:id`, checkPermission('eliminarTaller'), deleteTaller);

router.patch(`${base_route}/:id`, checkPermission('actualizarTaller'), updateTaller);

export default router;