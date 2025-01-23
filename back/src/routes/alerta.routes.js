import { Router } from "express";
import { 
    sendVencimientoAlerts , 
    sendRevisionTecnicaAlerts,
    getAlertasByUsuario,
} from "../controllers/alerta.controllers.js";

const router = Router();
const base_route = '/alerta';

// Ruta para enviar alertas
router.get(`${base_route}/:usuario_id`, getAlertasByUsuario)
router.get(`${base_route}/vencimientos`, sendVencimientoAlerts);
router.get(`${base_route}/revision-tecnica`, sendRevisionTecnicaAlerts);

export default router;
