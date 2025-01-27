import { Router } from 'express';
import {
    getCalendarMaintenances,
    getKPIs,
    getMaintenanceByCompany,
    getMaintenanceHistory,
    getMonthlyStats
} from '../controllers/stats_mantenciones.controllers.js';

const router = Router();

const base_route = '/stats-mantenciones';

// Rutas para estadísticas de mantenciones
router.get(`${base_route}/calendar-maintenances`, getCalendarMaintenances);
router.get(`${base_route}/monthly-stats`, getMonthlyStats);
router.get(`${base_route}/kpis`, getKPIs);
router.get(`${base_route}/by-company`, getMaintenanceByCompany);
router.get(`${base_route}/maintenance-history`, getMaintenanceHistory);

export default router;