import { Router } from 'express';
import { checkPermission } from '../controllers/authMiddleware.js';
import {
    getCalendarMaintenances,
    getKPIs,
    getMaintenanceByCompany,
    getMaintenanceHistory,
    getMonthlyStats
} from '../controllers/stats_mantenciones.controllers.js';
import { filterByCompany } from '../middlewares/companyFilter.js';
const router = Router();
const base_route = '/stats-mantenciones';

// Rutas para estadísticas de mantenciones
router.get(`${base_route}/calendar-maintenances`, filterByCompany,checkPermission('verServicios'),getCalendarMaintenances);
router.get(`${base_route}/monthly-stats`, filterByCompany, checkPermission('verServicios'),getMonthlyStats);
router.get(`${base_route}/kpis`,filterByCompany, checkPermission('verServicios'),getKPIs);
router.get(`${base_route}/by-company`,filterByCompany, checkPermission('verServicios'),getMaintenanceByCompany);
router.get(`${base_route}/maintenance-history`, filterByCompany, checkPermission('verServicios'),getMaintenanceHistory);

export default router;