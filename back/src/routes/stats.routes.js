import { Router } from 'express';
import { checkPermission } from '../controllers/authMiddleware.js';
import {
    getCompanyData,
    getDriverData,
    getFuelData,
    getMaintenanceData,
    getServiceDataWithClaves,
    getSummaryData
} from '../controllers/stats.controllers.js';

const router = Router();

const base_route = '/stats';

router.get(`${base_route}/maintenance`,  getMaintenanceData , checkPermission("verMantenciones"));
router.get(`${base_route}/service`, getServiceDataWithClaves, checkPermission("verMantenciones"));
router.get(`${base_route}/fuel`, getFuelData, checkPermission("verMantenciones"));
router.get(`${base_route}/company`,  getCompanyData, checkPermission("verMantenciones"));
router.get(`${base_route}/driver`,  getDriverData, checkPermission("verMantenciones"));
router.get(`${base_route}/summary`,  getSummaryData, checkPermission("verMantenciones"));

export default router;