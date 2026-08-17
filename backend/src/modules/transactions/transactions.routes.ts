import { Router } from 'express';
import { transactionsController } from './transactions.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const transactionsRouter = Router();

transactionsRouter.use(authenticate);

transactionsRouter.get('/me', transactionsController.listMine.bind(transactionsController));
transactionsRouter.get('/me/summary', transactionsController.getSummary.bind(transactionsController));
transactionsRouter.get('/', authorize('ADMIN', 'SUPER_ADMIN'), transactionsController.listAll.bind(transactionsController));
