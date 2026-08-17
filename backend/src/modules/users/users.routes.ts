import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

export const usersRouter = Router();

usersRouter.use(authenticate);

// Client routes
usersRouter.get('/me', usersController.getMe.bind(usersController));
usersRouter.patch('/me', usersController.updateMe.bind(usersController));
usersRouter.get('/me/dashboard', usersController.getDashboard.bind(usersController));

// Admin / Agent routes
usersRouter.post('/', authorize('ADMIN', 'SUPER_ADMIN'), usersController.createClient.bind(usersController));
usersRouter.post('/create-admin', authorize('SUPER_ADMIN'), usersController.createAdmin.bind(usersController));
usersRouter.get('/', authorize('ADMIN', 'SUPER_ADMIN', 'AGENT'), usersController.listUsers.bind(usersController));
usersRouter.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), usersController.getUserById.bind(usersController));
usersRouter.patch('/:id/status', authorize('ADMIN', 'SUPER_ADMIN'), usersController.updateUserStatus.bind(usersController));
usersRouter.patch('/:id/kyc', authorize('ADMIN', 'SUPER_ADMIN'), usersController.updateKycStatus.bind(usersController));
usersRouter.post('/:id/reset-password', authorize('ADMIN', 'SUPER_ADMIN'), usersController.adminResetPassword.bind(usersController));
usersRouter.delete('/:id', authorize('SUPER_ADMIN'), usersController.deleteUser.bind(usersController));
