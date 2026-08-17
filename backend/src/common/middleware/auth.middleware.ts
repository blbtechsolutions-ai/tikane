import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.utils';
import { ApiError } from '../errors/ApiError';
import { prisma } from '../../config/database';

export interface AuthRequest extends Request {
  user?: JwtPayload & { dbUser?: any };
}

/**
 * Verify JWT access token
 */
export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Token d\'authentification manquant'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return next(new ApiError(401, 'Utilisateur introuvable'));
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return next(new ApiError(403, 'Compte suspendu ou banni'));
    }

    req.user = { ...payload, dbUser: user };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expiré'));
    }
    return next(new ApiError(401, 'Token invalide'));
  }
}

/**
 * Require specific roles
 */
export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Non authentifié'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Accès refusé - permissions insuffisantes'));
    }
    next();
  };
}

/**
 * Optional auth - attach user if token present, but don't require it
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
}
