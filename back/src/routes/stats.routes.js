import { Router } from 'express';
import {
    getCompanyData,
    getDriverData,
    getFuelData,
    getMaintenanceData,
    getServiceDataWithClaves
} from '../controllers/stats.controllers.js';

const router = Router();

const base_route = '/stats';

router.get(`${base_route}/maintenance`,  getMaintenanceData);
router.get(`${base_route}/service`, getServiceDataWithClaves);
router.get(`${base_route}/fuel`, getFuelData);
router.get(`${base_route}/company`,  getCompanyData);
router.get(`${base_route}/driver`,  getDriverData);

export default router;