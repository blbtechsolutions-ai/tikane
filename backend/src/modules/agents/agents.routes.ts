import { Router } from 'express';
import { agentsController } from './agents.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const agentsRouter = Router();

agentsRouter.use(authenticate);

agentsRouter.get('/me/workspace', authorize('AGENT'), agentsController.getWorkspace.bind(agentsController));
agentsRouter.get('/', authorize('ADMIN', 'SUPER_ADMIN'), agentsController.listAgents.bind(agentsController));
agentsRouter.post('/', authorize('ADMIN', 'SUPER_ADMIN'), agentsController.createAgent.bind(agentsController));
agentsRouter.get('/:id/stats', agentsController.getMyStats.bind(agentsController));
