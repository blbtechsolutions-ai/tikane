import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../common/utils/bcrypt.utils';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseDuration,
} from '../../common/utils/jwt.utils';
import { ApiError } from '../../common/errors/ApiError';
import { config } from '../../config';
import { v4 as uuidv4 } from 'uuid';
import {
  LoginDtoType,
} from './auth.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthResponse extends TokenPair {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    preferredLanguage: string;
  };
}

export class AuthService {
  async login(dto: LoginDtoType, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw ApiError.unauthorized(
        `Compte verrouillé. Réessayez dans ${minutesLeft} minute(s)`,
      );
    }

    const validPassword = await comparePassword(dto.password, user.passwordHash);
    if (!validPassword) {
      // Increment failed attempts
      const attempts = user.loginAttempts + 1;
      const lockData =
        attempts >= 5
          ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
          : {};

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, ...lockData },
      });

      throw ApiError.unauthorized('Email ou mot de passe incorrect');
    }

    if (user.status === 'BANNED') {
      throw ApiError.forbidden('Compte banni. Contactez le support.');
    }
    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Compte suspendu. Contactez le support.');
    }

    // Reset failed attempts, update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        description: 'Connexion réussie',
        ipAddress,
        userAgent,
      },
    });

    return this.generateAuthResponse(user, ipAddress, userAgent);
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Refresh token invalide ou expiré');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      // Potential token reuse - revoke all tokens for this user
      if (stored && !stored.isRevoked) {
        await prisma.refreshToken.updateMany({
          where: { userId: payload.sub },
          data: { isRevoked: true, revokedAt: new Date() },
        });
      }
      throw ApiError.unauthorized('Refresh token invalide');
    }

    // Rotate: revoke old token
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw ApiError.unauthorized('Utilisateur inactif');
    }

    return this.issueTokenPair(user, ipAddress, userAgent);
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken, userId },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        description: 'Déconnexion',
      },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent - don't reveal user existence

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    // TODO: Send email with reset link
    // await notificationsService.sendPasswordResetEmail(user, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw ApiError.badRequest('Token de réinitialisation invalide ou expiré');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);
  }

  async verifyEmail(token: string): Promise<void> {
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
      throw ApiError.badRequest('Token de vérification invalide ou expiré');
    }

    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email: verification.email },
        data: { emailVerified: true, emailVerifiedAt: new Date(), status: 'ACTIVE' },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  // ─── Private helpers ─────────────────────────────────────────

  private async createEmailVerificationToken(email: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.emailVerification.create({
      data: { email, token, expiresAt },
    });

    return token;
  }

  private async generateAuthResponse(
    user: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const tokens = await this.issueTokenPair(user, ipAddress, userAgent);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        preferredLanguage: user.preferredLanguage,
      },
    };
  }

  private async issueTokenPair(
    user: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const expiresAt = new Date(
      Date.now() + parseDuration(config.jwt.refreshExpiresIn),
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseDuration(config.jwt.accessExpiresIn) / 1000,
    };
  }
}

export const authService = new AuthService();
