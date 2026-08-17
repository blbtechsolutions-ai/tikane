import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';
import {
  generateReference,
  buildPaginatedResult,
  getPaginationParams,
  addDays,
  toNumber,
} from '../../common/utils/helpers';
import { CreateSubscriptionDtoType, ManagedSubscriptionDtoType, MarkTouchDtoType } from './subscriptions.dto';

export class SubscriptionsService {
  async subscribe(userId: string, dto: CreateSubscriptionDtoType) {
    return this.createSubscription(userId, dto, userId, false);
  }

  async createManagedSubscription(actorId: string, actorRole: string, dto: ManagedSubscriptionDtoType) {
    let payload: ManagedSubscriptionDtoType = dto;

    if (actorRole === 'AGENT') {
      const agent = await this.getAgentByUserId(actorId);
      payload = { ...dto, agentId: agent.id };
    }

    return this.createSubscription(payload.userId, payload, actorId, true);
  }

  private async createSubscription(
    userId: string,
    dto: CreateSubscriptionDtoType | ManagedSubscriptionDtoType,
    actorId: string,
    managed: boolean,
  ) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    if (!user) throw ApiError.notFound('Client introuvable');
    if (user.role !== 'CLIENT') {
      throw ApiError.conflict('Le carnet doit être rattaché à un compte client');
    }

    const plan = await prisma.plan.findUnique({
      where: { id: dto.planId, status: 'ACTIVE', deletedAt: null },
      include: { planSchedules: { orderBy: { dayNumber: 'asc' } } },
    });

    if (!plan) throw ApiError.notFound('Plan introuvable ou inactif');

    // Check max participants
    if (plan.maxParticipants) {
      const count = await prisma.subscription.count({
        where: { planId: dto.planId, status: 'ACTIVE' },
      });
      if (count >= plan.maxParticipants) {
        throw ApiError.conflict('Ce plan a atteint sa capacité maximale');
      }
    }

    // Check duplicate active subscription
    const existing = await prisma.subscription.findFirst({
      where: { userId, planId: dto.planId, status: 'ACTIVE' },
    });
    if (existing) {
      throw ApiError.conflict('Vous avez déjà une souscription active pour ce plan');
    }

    const now = new Date();
    const startDate = dto.startDate ? new Date(dto.startDate) : now;
    const endDate = addDays(startDate, plan.durationDays);
    const subscriptionNumber = generateReference('SUB');
    const dossierNumber = generateReference('DOS');
    const totalDue = toNumber(plan.totalAmount);
    const beneficiaryName = dto.beneficiaryName?.trim() || `${user.firstName} ${user.lastName}`;
    const beneficiaryPhone = dto.beneficiaryPhone?.trim() || user.phone || null;
    const beneficiarySignature = dto.beneficiarySignature?.trim() || null;

    const subscription = await prisma.subscription.create({
      data: {
        subscriptionNumber,
        dossierNumber,
        userId,
        planId: dto.planId,
        agentId: dto.agentId,
        beneficiaryName,
        beneficiaryPhone,
        beneficiarySignature,
        startDate,
        endDate,
        nextPaymentDate: startDate,
        totalDue,
        remainingAmount: totalDue,
        totalDays: plan.durationDays,
        withdrawalAllowedAt:
          plan.withdrawalDelayDays > 0
            ? addDays(endDate, plan.withdrawalDelayDays)
            : endDate,
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            finalAmount: true,
            registrationFee: true,
            caNeetFee: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'CREATE',
        entity: 'Subscription',
        entityId: subscription.id,
        description: managed
          ? `Carnet ${dossierNumber} créé pour ${beneficiaryName} - plan ${plan.name}`
          : `Souscription au plan: ${plan.name}`,
      },
    });

    return subscription;
  }

  async listMySubscriptions(userId: string, params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const [data, total] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId, ...(params.status && { status: params.status }) },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              type: true,
              imageUrl: true,
              finalAmount: true,
              registrationFee: true,
              caNeetFee: true,
            },
          },
          payments: {
            where: { status: 'SUCCESS' },
            select: { amount: true, paidAt: true },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { payments: true, penalties: true } },
        },
      }),
      prisma.subscription.count({ where: { userId } }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async getSubscriptionDetail(id: string, userId: string, role?: string) {
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    const sub = await prisma.subscription.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : {
          OR: [
            { userId },
            { plan: { createdBy: userId } },
          ],
        }),
      },
      include: {
        plan: {
          include: { planSchedules: { orderBy: { dayNumber: 'asc' } } },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { agent: { include: { user: { select: { firstName: true, lastName: true } } } } },
        },
        penalties: true,
        withdrawals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!sub) throw ApiError.notFound('Souscription introuvable');

    // Build progress with payment status per day
    const progress = this.buildProgress(sub);

    return { ...sub, progress };
  }

  async cancelSubscription(id: string, userId: string) {
    const sub = await prisma.subscription.findFirst({
      where: { id, userId, status: 'ACTIVE' },
    });

    if (!sub) throw ApiError.notFound('Souscription introuvable');

    const paid = toNumber(sub.totalPaid);
    if (paid > 0) {
      throw ApiError.conflict(
        'Impossible d\'annuler une souscription avec des paiements. Contactez le support.',
      );
    }

    await prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async listAllSubscriptions(params: any, actorId: string, actorRole: string) {
    const { skip, take, page, limit } = getPaginationParams(params);
    const agent = actorRole === 'AGENT'
      ? await this.getAgentByUserId(actorId)
      : null;

    const where: any = {
      ...(params.status && { status: params.status }),
      ...(params.touchStatus && { touchStatus: params.touchStatus }),
      ...(params.planId && { planId: params.planId }),
      ...(params.userId && { userId: params.userId }),
      ...(agent && { agentId: agent.id }),
      ...(params.search && {
        OR: [
          { dossierNumber: { contains: params.search, mode: 'insensitive' } },
          { subscriptionNumber: { contains: params.search, mode: 'insensitive' } },
          { beneficiaryName: { contains: params.search, mode: 'insensitive' } },
          { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
          { user: { email: { contains: params.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: {
            select: {
              name: true,
              type: true,
              finalAmount: true,
              registrationFee: true,
              caNeetFee: true,
            },
          },
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async markAsTouched(id: string, actorId: string, actorRole: string, dto: MarkTouchDtoType) {
    const existing = await prisma.subscription.findUnique({ where: { id } });

    if (!existing) throw ApiError.notFound('Carnet introuvable');
    if (actorRole === 'AGENT') {
      const agent = await this.getAgentByUserId(actorId);
      if (existing.agentId !== agent.id) {
        throw ApiError.forbidden('Ce carnet n\'est pas affecte a cet agent');
      }
    }
    if (existing.touchStatus === 'TOUCHED') {
      throw ApiError.conflict('Ce carnet a déjà été marqué comme touché');
    }
    if (existing.status !== 'COMPLETED' && toNumber(existing.remainingAmount) > 0) {
      throw ApiError.conflict('Le carnet doit être complété avant la touche');
    }

    const touchReference = dto.touchReference?.trim() || generateReference('TCH');
    const notes = dto.notes?.trim()
      ? [existing.notes, `[TOUCHE] ${dto.notes.trim()}`].filter(Boolean).join('\n')
      : existing.notes;

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        touchStatus: 'TOUCHED',
        touchedAt: new Date(),
        touchedBy: actorId,
        touchReference,
        notes,
      },
      include: {
        plan: {
          select: {
            name: true,
            type: true,
            finalAmount: true,
            registrationFee: true,
            caNeetFee: true,
          },
        },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'APPROVE',
        entity: 'Subscription',
        entityId: id,
        description: `Carnet touché: ${updated.dossierNumber ?? updated.subscriptionNumber}`,
      },
    });

    return updated;
  }

  private async getAgentByUserId(userId: string) {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { id: true, isActive: true },
    });

    if (!agent || !agent.isActive) {
      throw ApiError.forbidden('Agent introuvable ou inactif');
    }

    return agent;
  }

  private buildProgress(sub: any) {
    const schedule = sub.plan.planSchedules as any[];
    const payments = sub.payments as any[];
    const totalDays: number = sub.totalDays ?? schedule.length;

    // Map dayNumber → schedule entry (for amount/label lookup)
    const scheduleMap = new Map<number, any>(schedule.map((s) => [s.dayNumber, s]));

    // Separate successful payments: those with a dayNumber vs those without
    const paymentMap = new Map<number, any>();
    const orphanPayments: any[] = []; // SUCCESS but dayNumber = null
    for (const p of payments) {
      if (p.status !== 'SUCCESS') continue;
      if (p.dayNumber != null) {
        paymentMap.set(p.dayNumber, p);
      } else {
        orphanPayments.push(p);
      }
    }
    // Sort orphans by paidAt ascending so earliest fills earliest gap
    orphanPayments.sort((a, b) =>
      new Date(a.paidAt ?? a.createdAt).getTime() - new Date(b.paidAt ?? b.createdAt).getTime(),
    );

    const fallbackDaily = sub.plan.dailyAmount
      ? toNumber(sub.plan.dailyAmount)
      : totalDays > 0
        ? toNumber(sub.totalDue) / totalDays
        : 0;

    const now = new Date();
    const start: Date = sub.startDate instanceof Date ? sub.startDate : new Date(sub.startDate);
    let orphanIndex = 0;

    return Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNumber) => {
      const scheduleEntry = scheduleMap.get(dayNumber);
      let payment = paymentMap.get(dayNumber);

      // If no payment with this dayNumber, consume the next orphan (no dayNumber)
      if (!payment && orphanIndex < orphanPayments.length) {
        payment = orphanPayments[orphanIndex++];
      }

      const dueDate = new Date(start.getTime() + dayNumber * 86400000);
      const amount = payment
        ? toNumber(payment.amount)
        : scheduleEntry
          ? toNumber(scheduleEntry.amount)
          : fallbackDaily;

      return {
        dayNumber,
        amount,
        label: scheduleEntry?.label ?? null,
        status: payment ? 'PAID' : now > dueDate ? 'LATE' : 'PENDING',
        paidAt: payment?.paidAt ?? null,
        paymentRef: payment?.referenceNumber ?? null,
      };
    });
  }
}

export const subscriptionsService = new SubscriptionsService();
