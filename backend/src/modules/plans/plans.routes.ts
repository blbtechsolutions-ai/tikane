import { Router } from 'express';
import { plansController } from './plans.controller';
import { authenticate, authorize, optionalAuth } from '../../common/middleware/auth.middleware';

export const plansRouter = Router();

// Public - list active plans
plansRouter.get('/', optionalAuth, plansController.listPlans.bind(plansController));
plansRouter.get('/:id', optionalAuth, plansController.getPlan.bind(plansController));

// Admin only
plansRouter.use(authenticate);
plansRouter.post('/preview-schedule', plansController.previewSchedule.bind(plansController));
plansRouter.post('/', authorize('ADMIN', 'SUPER_ADMIN'), plansController.createPlan.bind(plansController));
plansRouter.put('/:id', authorize('ADMIN', 'SUPER_ADMIN'), plansController.updatePlan.bind(plansController));
plansRouter.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), plansController.updateStatus.bind(plansController));
plansRouter.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN'), plansController.deletePlan.bind(plansController));
