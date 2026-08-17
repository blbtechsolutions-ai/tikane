import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

export const authRouter = Router();

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Trop de tentatives. Réessayez dans 15 min.' },
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Trop de demandes de réinitialisation.' },
});

// Public routes
authRouter.post('/register', authLimiter, authController.registrationClosed.bind(authController));
authRouter.post('/login', authLimiter, authController.login.bind(authController));
authRouter.post('/refresh', authController.refresh.bind(authController));
authRouter.post('/forgot-password', passwordLimiter, authController.forgotPassword.bind(authController));
authRouter.post('/reset-password', authController.resetPassword.bind(authController));
authRouter.post('/verify-email', authController.verifyEmail.bind(authController));

// Protected routes
authRouter.use(authenticate);
authRouter.get('/me', authController.me.bind(authController));
authRouter.post('/logout', authController.logout.bind(authController));
authRouter.post('/change-password', authController.changePassword.bind(authController));
