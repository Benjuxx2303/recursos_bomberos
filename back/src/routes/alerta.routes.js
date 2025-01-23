import { Router } from "express";
import { 
    sendVencimientoAlerts , 
    sendRevisionTecnicaAlerts,
    getAlertasByUsuario,
    sendMantencionAlerts
} from "../controllers/alerta.controllers.js";

const router = Router();
const base_route = '/alerta';

// Ruta para enviar alertas
router.get(`${base_route}/usuario/:usuario_id`, getAlertasByUsuario)
router.get(`${base_route}/vencimientos`, sendVencimientoAlerts);
router.get(`${base_route}/revision-tecnica`, sendRevisionTecnicaAlerts);
router.get(`${base_route}/mantencion`, sendMantencionAlerts);

export default router;
