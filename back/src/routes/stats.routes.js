import { Router } from 'express';
import {
    getCompanyData,
    getDriverData,
    getFuelData,
    getMaintenanceData,
    getServiceDataWithClaves,
    getSummaryData
} from '../controllers/stats.controllers.js';
import { filterByCompany } from '../middlewares/companyFilter.js';
const router = Router();

const base_route = '/stats';

router.get(`${base_route}/maintenance`,filterByCompany,  getMaintenanceData);
router.get(`${base_route}/service`,filterByCompany, getServiceDataWithClaves);
router.get(`${base_route}/fuel`,filterByCompany, getFuelData);
router.get(`${base_route}/company`,filterByCompany,  getCompanyData);
router.get(`${base_route}/driver`,filterByCompany,  getDriverData);
router.get(`${base_route}/summary`,filterByCompany,  getSummaryData);

export default router;