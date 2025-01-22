import { Router } from "express";
import { sendVencimientoAlerts } from "../controllers/alertas.controllers.js";

const router = Router();
const base_route = '/alertas';

// Ruta para enviar alertas
router.get(`${base_route}/vencimientos`, sendVencimientoAlerts);

export default router;
