import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';
import {
  generateReference,
  buildPaginatedResult,
  getPaginationParams,
  toNumber,
} from '../../common/utils/helpers';
import { RequestWithdrawalDtoType } from './withdrawals.dto';

export class WithdrawalsService {
  async requestWithdrawal(userId: string, dto: RequestWithdrawalDtoType) {
    const sub = await prisma.subscription.findFirst({
      where: { id: dto.subscriptionId, userId, status: 'COMPLETED' },
    });

    if (!sub) {
      throw ApiError.notFound(
        'Souscription introuvable. Elle doit être complétée pour effectuer un retrait.',
      );
    }

    if (sub.touchStatus === 'TOUCHED') {
      throw ApiError.conflict('Ce carnet a deja ete touche.');
    }

    // Check withdrawal delay
    if (sub.withdrawalAllowedAt && sub.withdrawalAllowedAt > new Date()) {
      const days = Math.ceil(
        (sub.withdrawalAllowedAt.getTime() - Date.now()) / 86400000,
      );
      throw ApiError.conflict(
        `Retrait disponible dans ${days} jour(s)`,
      );
    }

    // Check existing pending withdrawal
    const pending = await prisma.withdrawal.findFirst({
      where: {
        subscriptionId: dto.subscriptionId,
        status: { in: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED'] },
      },
    });
    if (pending) {
      throw ApiError.conflict('Une demande de touche existe deja pour ce carnet');
    }

    const plan = await prisma.plan.findUnique({ where: { id: sub.planId } });
    const netAmount = toNumber(sub.totalPaid); // In real app: plan.finalAmount
    const fee = 0; // Could apply withdrawal fee

    const referenceNumber = generateReference('WIT');
    const withdrawal = await prisma.withdrawal.create({
      data: {
        referenceNumber,
        subscriptionId: dto.subscriptionId,
        userId,
        amount: netAmount,
        fee,
        netAmount: netAmount - fee,
        currency: plan?.currency ?? 'HTG',
        method: dto.method as any,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        phoneNumber: dto.phoneNumber,
        notes: dto.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        entity: 'Withdrawal',
        entityId: withdrawal.id,
        description: `Demande de retrait: ${referenceNumber}`,
      },
    });

    return withdrawal;
  }

  async approveWithdrawal(id: string, adminId: string) {
    const w = await prisma.withdrawal.findUnique({ where: { id } });
    if (!w || w.status !== 'PENDING') throw ApiError.notFound('Retrait introuvable ou déjà traité');

    await prisma.withdrawal.update({
      where: { id },
      data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: adminId },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'APPROVE',
        entity: 'Withdrawal',
        entityId: id,
        description: 'Retrait approuvé',
      },
    });
  }

  async rejectWithdrawal(id: string, adminId: string, reason: string) {
    const w = await prisma.withdrawal.findUnique({ where: { id } });
    if (!w || w.status !== 'PENDING') throw ApiError.notFound('Retrait introuvable ou déjà traité');

    await prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectionReason: reason,
      },
    });
  }

  async completeWithdrawal(id: string, adminId: string) {
    const w = await prisma.withdrawal.findUnique({ where: { id } });
    if (!w || w.status !== 'APPROVED') throw ApiError.conflict('Retrait doit être approuvé d\'abord');

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      const transactionRef = generateReference('TXN');
      await tx.transaction.create({
        data: {
          transactionRef,
          userId: w.userId,
          withdrawalId: w.id,
          type: 'WITHDRAWAL',
          status: 'SUCCESS',
          amount: w.amount,
          currency: w.currency,
          fee: w.fee,
          netAmount: w.netAmount,
          description: `Retrait ${w.referenceNumber}`,
          processedAt: new Date(),
        },
      });

      const subscription = await tx.subscription.findUnique({
        where: { id: w.subscriptionId },
        select: { touchStatus: true, touchReference: true },
      });

      if (subscription && subscription.touchStatus !== 'TOUCHED') {
        await tx.subscription.update({
          where: { id: w.subscriptionId },
          data: {
            touchStatus: 'TOUCHED',
            touchedAt: new Date(),
            touchedBy: adminId,
            ...(subscription.touchReference
              ? {}
              : { touchReference: generateReference('TCH') }),
          },
        });
      }
    });
  }

  async listMyWithdrawals(userId: string, params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const [data, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            select: {
              subscriptionNumber: true,
              dossierNumber: true,
              plan: { select: { name: true, type: true } },
            },
          },
        },
      }),
      prisma.withdrawal.count({ where: { userId } }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async listAllWithdrawals(params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const statuses = typeof params.status === 'string'
      ? params.status.split(',').map((status: string) => status.trim()).filter(Boolean)
      : [];

    const where: any = {
      ...(statuses.length === 1 && { status: statuses[0] }),
      ...(statuses.length > 1 && { status: { in: statuses } }),
      ...(params.userId && { userId: params.userId }),
    };

    const [data, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          subscription: {
            select: {
              subscriptionNumber: true,
              dossierNumber: true,
              touchReference: true,
              plan: { select: { name: true, type: true } },
            },
          },
        },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }
}

export const withdrawalsService = new WithdrawalsService();
