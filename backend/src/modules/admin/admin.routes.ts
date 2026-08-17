import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

adminRouter.get('/stats', adminController.getStats.bind(adminController));
adminRouter.get('/charts/revenue', adminController.getRevenueChart.bind(adminController));
adminRouter.get('/charts/popular-plans', adminController.getPopularPlans.bind(adminController));
adminRouter.get('/audit-logs', adminController.getAuditLogs.bind(adminController));
adminRouter.get('/system/health', adminController.getSystemHealth.bind(adminController));
adminRouter.get('/export/users', adminController.exportUsers.bind(adminController));

// Reports
adminRouter.get('/reports', adminController.getReport.bind(adminController));

// System settings
adminRouter.get('/settings', adminController.getSettings.bind(adminController));
adminRouter.put('/settings/:key', adminController.upsertSetting.bind(adminController));
adminRouter.post('/settings/bulk', authorize('SUPER_ADMIN'), adminController.bulkUpsertSettings.bind(adminController));
