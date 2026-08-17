import { Router } from 'express';
import { subscriptionsController } from './subscriptions.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const subscriptionsRouter = Router();

subscriptionsRouter.use(authenticate);

subscriptionsRouter.post('/', subscriptionsController.subscribe.bind(subscriptionsController));
subscriptionsRouter.post('/admin-create', authorize('ADMIN', 'SUPER_ADMIN', 'AGENT'), subscriptionsController.createManaged.bind(subscriptionsController));
subscriptionsRouter.get('/me', subscriptionsController.listMine.bind(subscriptionsController));
subscriptionsRouter.get('/:id', subscriptionsController.getDetail.bind(subscriptionsController));
subscriptionsRouter.patch('/:id/cancel', subscriptionsController.cancel.bind(subscriptionsController));
subscriptionsRouter.patch('/:id/touch', authorize('ADMIN', 'SUPER_ADMIN', 'AGENT'), subscriptionsController.markTouched.bind(subscriptionsController));

// Admin
subscriptionsRouter.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'AGENT'), subscriptionsController.listAll.bind(subscriptionsController));
