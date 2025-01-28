import { Router } from "express";
import cron from 'node-cron';
import {
    getAlertasByUsuario,
    sendMantencionAlerts,
    sendProximaMantencionAlerts,
    sendRevisionTecnicaAlerts,
    sendVencimientoAlerts
} from "../controllers/alerta.controllers.js";

const router = Router();
const base_route = '/alerta';

// Configuración de los cron jobs para las alertas automáticas
// Ejecutar todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
    try {
        await Promise.all([
            sendVencimientoAlerts(),
            sendRevisionTecnicaAlerts(),
            sendMantencionAlerts(),
            sendProximaMantencionAlerts()
        ]);
        console.log('Alertas programadas enviadas exitosamente');
    } catch (error) {
        console.error('Error al enviar alertas programadas:', error);
    }
});

// Verificar mantenciones próximas cada 4 horas
cron.schedule('0 */4 * * *', async () => {
    try {
        await sendProximaMantencionAlerts();
        console.log('Verificación de mantenciones próximas completada');
    } catch (error) {
        console.error('Error al verificar mantenciones próximas:', error);
    }
});

// Rutas para enviar alertas manualmente
router.get(`${base_route}/usuario/:usuario_id`, getAlertasByUsuario);
router.get(`${base_route}/vencimientos`, sendVencimientoAlerts);
router.get(`${base_route}/revision-tecnica`, sendRevisionTecnicaAlerts);
router.get(`${base_route}/mantencion`, sendMantencionAlerts);
router.get(`${base_route}/proximas-mantenciones`, sendProximaMantencionAlerts);

export default router;
