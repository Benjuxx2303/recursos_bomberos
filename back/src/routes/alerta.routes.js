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
    sendVencimientoAlerts,
    sendVencimientoPatenteAlerts,
    sendVencimientoSeguroAlerts
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
    console.log('Iniciando ejecución de cronjob de alertas diarias (08:00 AM)...');
    const resSimulado = createResSimulado();
    try {
        console.log('Ejecutando sendVencimientoAlerts...');
        await sendVencimientoAlerts({}, resSimulado);
        console.log('sendVencimientoAlerts completado.');

        console.log('Ejecutando sendRevisionTecnicaAlerts...');
        await sendRevisionTecnicaAlerts({}, resSimulado);
        console.log('sendRevisionTecnicaAlerts completado.');

        console.log('Ejecutando sendVencimientoPatenteAlerts...');
        await sendVencimientoPatenteAlerts({}, resSimulado);
        console.log('sendVencimientoPatenteAlerts completado.');

        console.log('Ejecutando sendVencimientoSeguroAlerts...');
        await sendVencimientoSeguroAlerts({}, resSimulado);
        console.log('sendVencimientoSeguroAlerts completado.');

        console.log('Ejecutando sendMantencionAlerts...');
        await sendMantencionAlerts({}, resSimulado); // Esta función maneja alertas de mantenciones (15, 5 días, atrasadas)
        console.log('sendMantencionAlerts completado.');

        console.log('Ejecutando sendProximaMantencionAlerts...');
        await sendProximaMantencionAlerts({}, resSimulado); // Ahora ajustada para 15/5 días
        console.log('sendProximaMantencionAlerts completado.');

        console.log('Todas las alertas programadas han sido procesadas secuencialmente.');
    } catch (error) {
        console.error('Error durante la ejecución secuencial de alertas programadas:', error);
    }
});

// El cronjob de sendProximaMantencionAlerts que se ejecutaba cada 4 horas ha sido eliminado.
// Ahora se ejecuta junto con las demás alertas diarias a las 08:00 AM.

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