import { Request, Response } from 'express';
import { authService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
} from './auth.dto';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.utils';
import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et gestion des sessions
 */
export class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Inscription publique fermée
   *     tags: [Auth]
   *     security: []
   */
  async registrationClosed(_req: Request, res: Response): Promise<void> {
    res.status(403).json({
      success: false,
      message: 'Inscription publique fermée. Contactez l\'administration pour obtenir un compte client.',
    });
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Connexion utilisateur
   *     tags: [Auth]
   *     security: []
   */
  async login(req: Request, res: Response): Promise<void> {
    const dto = LoginDto.parse(req.body);
    const ipAddress = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await authService.login(dto, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: result,
    });
  }

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Rafraîchir les tokens
   *     tags: [Auth]
   *     security: []
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = RefreshTokenDto.parse(req.body);
    const ipAddress = req.ip ?? req.socket.remoteAddress;
    const result = await authService.refreshTokens(
      refreshToken,
      ipAddress,
      req.headers['user-agent'],
    );

    res.json({ success: true, data: result });
  }

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Déconnexion
   *     tags: [Auth]
   */
  async logout(req: AuthRequest, res: Response): Promise<void> {
    const { refreshToken } = RefreshTokenDto.parse(req.body);
    await authService.logout(refreshToken, req.user!.sub);

    res.json({ success: true, message: 'Déconnexion réussie' });
  }

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Profil de l'utilisateur connecté
   *     tags: [Auth]
   */
  async me(req: AuthRequest, res: Response): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        kycStatus: true,
        avatarUrl: true,
        emailVerified: true,
        phoneVerified: true,
        preferredLanguage: true,
        referralCode: true,
        createdAt: true,
        _count: {
          select: { subscriptions: true, referrals: true },
        },
      },
    });

    if (!user) throw ApiError.notFound('Utilisateur introuvable');

    res.json({ success: true, data: user });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = ForgotPasswordDto.parse(req.body);
    await authService.forgotPassword(email);

    res.json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = ResetPasswordDto.parse(req.body);
    await authService.resetPassword(token, newPassword);

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = VerifyEmailDto.parse(req.body);
    await authService.verifyEmail(token);

    res.json({ success: true, message: 'Email vérifié avec succès' });
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    const { currentPassword, newPassword } = ChangePasswordDto.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw ApiError.notFound('Utilisateur introuvable');

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw ApiError.badRequest('Mot de passe actuel incorrect');

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
  }
}

export const authController = new AuthController();
