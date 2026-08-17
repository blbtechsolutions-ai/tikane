import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/me', notificationsController.listMine.bind(notificationsController));
notificationsRouter.patch('/me/read-all', notificationsController.markAllRead.bind(notificationsController));
notificationsRouter.patch('/:id/read', notificationsController.markRead.bind(notificationsController));
