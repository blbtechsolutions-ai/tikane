import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';
import {
  generateReferralCode,
  buildPaginatedResult,
  getPaginationParams,
} from '../../common/utils/helpers';
import { hashPassword } from '../../common/utils/bcrypt.utils';
import { CreateClientDtoType, CreateAdminDtoType, UpdateProfileDtoType, UpdateKycStatusDtoType } from './users.dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class UsersService {
  async createClient(dto: CreateClientDtoType, adminId: string) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw ApiError.conflict('Cet email est déjà utilisé');
      }
      throw ApiError.conflict('Ce numéro de téléphone est déjà utilisé');
    }

    const passwordHash = await hashPassword(dto.password);
    const referralCode = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone?.trim() || null,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'CLIENT',
        status: 'ACTIVE',
        preferredLanguage: dto.preferredLanguage,
        referralCode,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        kycStatus: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { subscriptions: true, referrals: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        description: `Compte client créé pour ${user.firstName} ${user.lastName}`,
      },
    });

    return user;
  }

  async createAdmin(dto: CreateAdminDtoType, creatorId: string) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email === dto.email) throw ApiError.conflict('Cet email est déjà utilisé');
      throw ApiError.conflict('Ce numéro de téléphone est déjà utilisé');
    }

    const passwordHash = await hashPassword(dto.password);
    const referralCode = generateReferralCode();

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone?.trim() || null,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: 'ADMIN',
        status: 'ACTIVE',
        preferredLanguage: dto.preferredLanguage,
        referralCode,
      },
      select: {
        id: true, email: true, phone: true,
        firstName: true, lastName: true,
        role: true, status: true, kycStatus: true,
        emailVerified: true, createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: creatorId,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        description: `Compte admin créé pour ${user.firstName} ${user.lastName}`,
      },
    });

    return user;
  }

  async updateKycStatus(userId: string, dto: UpdateKycStatusDtoType, adminId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: dto.kycStatus as any },
      select: { id: true, firstName: true, lastName: true, kycStatus: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        entity: 'User',
        entityId: userId,
        description: `KYC mis à jour: ${dto.kycStatus}${dto.reason ? '. Raison: ' + dto.reason : ''}`,
      },
    });

    return user;
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
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
        nationalIdNumber: true,
        dateOfBirth: true,
        address: true,
        city: true,
        country: true,
        preferredLanguage: true,
        referralCode: true,
        emailVerified: true,
        phoneVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            subscriptions: true,
            referrals: true,
            payments: true,
          },
        },
      },
    });

    if (!user) throw ApiError.notFound('Utilisateur introuvable');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDtoType) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async getDashboardStats(userId: string) {
    const [subscriptions, recentPayments, pendingWithdrawals, pendingPayments] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
        include: {
          plan: { select: { name: true, type: true } },
          payments: {
            where: { status: 'SUCCESS' },
            select: { amount: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.payment.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              subscriptionNumber: true,
              plan: { select: { name: true, type: true } },
            },
          },
        },
      }),
      prisma.withdrawal.count({
        where: { userId, status: 'PENDING' },
      }),
      prisma.payment.count({
        where: { userId, status: 'PENDING' },
      }),
    ]);

    const totalInvested = subscriptions.reduce(
      (sum, s) => sum + parseFloat(s.totalPaid.toString()),
      0,
    );

    return {
      subscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(
        (s) => s.status === 'ACTIVE',
      ).length,
      totalInvested,
      totalPaid: totalInvested,
      recentPayments,
      pendingPayments,
      pendingWithdrawals,
    };
  }

  async listUsers(params: any, actorRole?: string) {
    const { skip, take, page, limit } = getPaginationParams(params);
    const isAgent = actorRole === 'AGENT';

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(isAgent ? { role: 'CLIENT', status: 'ACTIVE' } : {}),
      ...(!isAgent && params.role && { role: params.role }),
      ...(!isAgent && params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { email: { contains: params.search, mode: 'insensitive' } },
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { phone: { contains: params.search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          kycStatus: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { subscriptions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async updateUserStatus(userId: string, status: string, adminId: string, reason?: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: status === 'ACTIVE' ? 'ACTIVATE' : 'SUSPEND',
        entity: 'User',
        entityId: userId,
        description: `Statut changé vers ${status}. Raison: ${reason ?? 'N/A'}`,
      },
    });

    return user;
  }

  async softDelete(userId: string, adminId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: 'BANNED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE',
        entity: 'User',
        entityId: userId,
        description: 'Compte supprimé',
      },
    });
  }

  /**
   * Admin force-resets a user's password.
   * Returns the raw reset token so the admin can transmit it out-of-band.
   */
  async adminResetUserPassword(targetUserId: string, adminId: string): Promise<{ token: string }> {
    const user = await prisma.user.findUnique({ where: { id: targetUserId, deletedAt: null } });
    if (!user) throw ApiError.notFound('Utilisateur introuvable');

    // Invalidate any previous reset tokens
    await prisma.passwordReset.updateMany({
      where: { userId: targetUserId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = uuidv4();
    await prisma.passwordReset.create({
      data: { userId: targetUserId, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        entity: 'User',
        entityId: targetUserId,
        description: `Réinitialisation de mot de passe forcée pour ${user.email}`,
      },
    });

    return { token };
  }
}

export const usersService = new UsersService();
