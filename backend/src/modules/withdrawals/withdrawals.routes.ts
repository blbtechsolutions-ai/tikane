import { Router } from 'express';
import { withdrawalsController } from './withdrawals.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const withdrawalsRouter = Router();

withdrawalsRouter.use(authenticate);

withdrawalsRouter.post('/', withdrawalsController.request.bind(withdrawalsController));
withdrawalsRouter.get('/me', withdrawalsController.listMine.bind(withdrawalsController));

withdrawalsRouter.get('/', authorize('ADMIN', 'SUPER_ADMIN'), withdrawalsController.listAll.bind(withdrawalsController));
withdrawalsRouter.patch('/:id/approve', authorize('ADMIN', 'SUPER_ADMIN'), withdrawalsController.approve.bind(withdrawalsController));
withdrawalsRouter.patch('/:id/reject', authorize('ADMIN', 'SUPER_ADMIN'), withdrawalsController.reject.bind(withdrawalsController));
withdrawalsRouter.patch('/:id/complete', authorize('ADMIN', 'SUPER_ADMIN'), withdrawalsController.complete.bind(withdrawalsController));
