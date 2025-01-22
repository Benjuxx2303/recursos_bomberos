import { Router } from "express";
import { sendVencimientoAlerts } from "../controllers/alerta.controllers.js";

const router = Router();
const base_route = '/alertas';

// Ruta para enviar alertas
router.get(`${base_route}/vencimientos`, sendVencimientoAlerts);

export default router;
