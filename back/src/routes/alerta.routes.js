import { Router } from "express";
import { sendVencimientoAlerts , sendRevisionTecnicaAlerts} from "../controllers/alerta.controllers.js";

const router = Router();
const base_route = '/alertas';

// Ruta para enviar alertas
router.get(`${base_route}/vencimientos`, sendVencimientoAlerts);
router.get(`${base_route}/revision-tecnica`, sendRevisionTecnicaAlerts);

export default router;
