import { Router } from 'express';
import { penaltiesController } from './penalties.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const penaltiesRouter = Router();

penaltiesRouter.use(authenticate);

// Client: view my penalties
penaltiesRouter.get('/me', penaltiesController.listMine.bind(penaltiesController));

// Admin only
penaltiesRouter.get('/', authorize('ADMIN', 'SUPER_ADMIN'), penaltiesController.list.bind(penaltiesController));
penaltiesRouter.post('/', authorize('ADMIN', 'SUPER_ADMIN'), penaltiesController.add.bind(penaltiesController));
penaltiesRouter.patch('/:id', authorize('ADMIN', 'SUPER_ADMIN'), penaltiesController.update.bind(penaltiesController));
penaltiesRouter.patch('/:id/waive', authorize('ADMIN', 'SUPER_ADMIN'), penaltiesController.waive.bind(penaltiesController));
