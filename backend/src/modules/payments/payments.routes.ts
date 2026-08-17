import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const paymentsRouter = Router();

paymentsRouter.use(authenticate);

// Client
paymentsRouter.post('/', paymentsController.createPayment.bind(paymentsController));
paymentsRouter.post('/collect', authorize('AGENT'), paymentsController.collectPayment.bind(paymentsController));
paymentsRouter.post('/admin-collect', authorize('ADMIN', 'SUPER_ADMIN'), paymentsController.adminCollect.bind(paymentsController));
paymentsRouter.get('/me', paymentsController.listMyPayments.bind(paymentsController));

// Admin / Agent
paymentsRouter.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'AGENT'), paymentsController.listAllPayments.bind(paymentsController));
paymentsRouter.patch('/:id/confirm', authorize('ADMIN', 'SUPER_ADMIN', 'AGENT'), paymentsController.confirmPayment.bind(paymentsController));
paymentsRouter.patch('/:id/reject', authorize('ADMIN', 'SUPER_ADMIN'), paymentsController.rejectPayment.bind(paymentsController));
