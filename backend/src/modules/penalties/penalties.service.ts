import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';
import { buildPaginatedResult, getPaginationParams, toNumber } from '../../common/utils/helpers';

export interface AddPenaltyDto {
  subscriptionId: string;
  type: 'LATE_PAYMENT' | 'MISSED_PAYMENT' | 'EARLY_WITHDRAWAL' | 'BREACH_OF_CONTRACT';
  amount: number;
  reason: string;
  dayNumber?: number;
}

export interface UpdatePenaltyDto {
  amount?: number;
  reason?: string;
}

export class PenaltiesService {
  async addPenalty(dto: AddPenaltyDto, adminId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      select: { id: true, userId: true, status: true },
    });

    if (!subscription) throw ApiError.notFound('Souscription introuvable');

    const penalty = await prisma.penalty.create({
      data: {
        userId: subscription.userId,
        subscriptionId: dto.subscriptionId,
        type: dto.type as any,
        amount: dto.amount,
        reason: dto.reason,
        dayNumber: dto.dayNumber,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        subscription: { select: { subscriptionNumber: true } },
      },
    });

    // Update subscription totalPenalties
    await prisma.subscription.update({
      where: { id: dto.subscriptionId },
      data: { totalPenalties: { increment: dto.amount } },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entity: 'Penalty',
        entityId: penalty.id,
        description: `Pénalité ${dto.type} de ${dto.amount} HTG ajoutée à la souscription ${subscription.id}`,
      },
    });

    return penalty;
  }

  async waivePenalty(penaltyId: string, adminId: string) {
    const penalty = await prisma.penalty.findUnique({ where: { id: penaltyId } });
    if (!penalty) throw ApiError.notFound('Pénalité introuvable');
    if (penalty.waivedAt) throw ApiError.conflict('Pénalité déjà annulée');

    const updated = await prisma.penalty.update({
      where: { id: penaltyId },
      data: { waivedAt: new Date(), waivedBy: adminId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        subscription: { select: { subscriptionNumber: true } },
      },
    });

    // Deduct from subscription totalPenalties
    await prisma.subscription.update({
      where: { id: penalty.subscriptionId },
      data: { totalPenalties: { decrement: toNumber(penalty.amount) } },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        entity: 'Penalty',
        entityId: penaltyId,
        description: `Pénalité annulée (waived)`,
      },
    });

    return updated;
  }

  async updatePenalty(penaltyId: string, dto: UpdatePenaltyDto, adminId: string) {
    const penalty = await prisma.penalty.findUnique({ where: { id: penaltyId } });
    if (!penalty) throw ApiError.notFound('Pénalité introuvable');
    if (penalty.waivedAt) throw ApiError.conflict('Impossible de modifier une pénalité annulée');

    const oldAmount = toNumber(penalty.amount);

    const updated = await prisma.penalty.update({
      where: { id: penaltyId },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        subscription: { select: { subscriptionNumber: true } },
      },
    });

    if (dto.amount !== undefined && dto.amount !== oldAmount) {
      const diff = dto.amount - oldAmount;
      await prisma.subscription.update({
        where: { id: penalty.subscriptionId },
        data: { totalPenalties: { increment: diff } },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        entity: 'Penalty',
        entityId: penaltyId,
        description: `Pénalité modifiée`,
      },
    });

    return updated;
  }

  async listPenalties(params: Record<string, any>) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const where: any = {};
    if (params.subscriptionId) where.subscriptionId = params.subscriptionId;
    if (params.userId) where.userId = params.userId;
    if (params.type) where.type = params.type;
    if (params.isPaid !== undefined) where.isPaid = params.isPaid === 'true';

    const [data, total] = await Promise.all([
      prisma.penalty.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          subscription: { select: { subscriptionNumber: true, dossierNumber: true } },
        },
      }),
      prisma.penalty.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async getMyPenalties(userId: string, params: Record<string, any>) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const [data, total] = await Promise.all([
      prisma.penalty.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: { select: { subscriptionNumber: true, dossierNumber: true } },
        },
      }),
      prisma.penalty.count({ where: { userId } }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }
}

export const penaltiesService = new PenaltiesService();
