import { Router } from "express";
import cron from 'node-cron';
import {
    deleteOldAlerts,
    getAlertasByUsuario,
    markAlertAsRead,
    markAllAlertsAsRead,
    sendMantencionAlerts,
    sendProximaMantencionAlerts,
    sendRevisionTecnicaAlerts,
    sendVencimientoAlerts
} from "../controllers/alerta.controllers.js";

const router = Router();
const base_route = '/alerta';

// Función para simular el objeto 'res' en el cron job
const createResSimulado = () => {
    const resSimulado = {
        status: (statusCode) => {
            console.log(`Status: ${statusCode}`);
            return resSimulado; // Encadenamos el objeto resSimulado para poder llamar json() después
        },
        json: (message) => {
            console.log('Response:', message);
        }
    };
    
    return resSimulado; // Regresamos el objeto resSimulado
};

// Configuración de los cron jobs para las alertas automáticas
// Ejecutar todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
    try {
        const resSimulado = createResSimulado();
        await Promise.all([
            sendVencimientoAlerts({}, resSimulado),
            sendRevisionTecnicaAlerts({}, resSimulado),
            sendMantencionAlerts({}, resSimulado),
            sendProximaMantencionAlerts({}, resSimulado)
        ]);
        console.log('Alertas programadas enviadas exitosamente');
    } catch (error) {
        console.error('Error al enviar alertas programadas:', error);
    }
});

// Verificar mantenciones próximas cada 4 horas
cron.schedule('0 */4 * * *', async () => {
    try {
        const resSimulado = createResSimulado();
        await sendProximaMantencionAlerts({}, resSimulado);
        console.log('Verificación de mantenciones próximas completada');
    } catch (error) {
        console.error('Error al verificar mantenciones próximas:', error);
    }
});

// Limpiar alertas antiguas todos los días a la 1:00 AM
cron.schedule('0 1 * * *', async () => {
    try {
        const resSimulado = createResSimulado();
        await deleteOldAlerts({}, resSimulado);
    } catch (error) {
        console.error('Error al limpiar alertas antiguas:', error);
    }
});

// Rutas para gestionar alertas
router.get(`${base_route}/usuario/:usuario_id`, getAlertasByUsuario);
router.put(`${base_route}/usuario/:usuario_id/read`, markAllAlertsAsRead);
router.put(`${base_route}/:alerta_id/read`, markAlertAsRead);

// Rutas para enviar alertas manualmente
router.get(`${base_route}/vencimientos`, sendVencimientoAlerts);
router.get(`${base_route}/revision-tecnica`, sendRevisionTecnicaAlerts);
router.get(`${base_route}/mantencion`, sendMantencionAlerts);
router.get(`${base_route}/proximas-mantenciones`, sendProximaMantencionAlerts);

export default router;