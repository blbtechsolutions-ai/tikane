import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';
import {
  generateReference,
  buildPaginatedResult,
  getPaginationParams,
  toNumber,
} from '../../common/utils/helpers';
import { CreatePaymentDtoType } from './payments.dto';

export class PaymentsService {
  async createPayment(userId: string, dto: CreatePaymentDtoType) {
    return this.createPaymentForUser(userId, dto, userId);
  }

  async createAdminPayment(adminUserId: string, dto: CreatePaymentDtoType) {
    const sub = await prisma.subscription.findFirst({
      where: { id: dto.subscriptionId, status: 'ACTIVE' },
      include: {
        plan: true,
        payments: { where: { status: 'SUCCESS' }, select: { dayNumber: true } },
      },
    });

    if (!sub) throw ApiError.notFound('Souscription introuvable ou inactive');

    if (dto.dayNumber) {
      const alreadyPaid = sub.payments.find((p) => p.dayNumber === dto.dayNumber);
      if (alreadyPaid) {
        throw ApiError.conflict(`Paiement déjà effectué pour le jour ${dto.dayNumber}`);
      }
    }

    const referenceNumber = generateReference('PAY');
    const payment = await prisma.payment.create({
      data: {
        referenceNumber,
        subscriptionId: dto.subscriptionId,
        userId: sub.userId,
        amount: dto.amount,
        currency: sub.plan.currency,
        method: 'CASH',
        status: 'PENDING',
        dayNumber: dto.dayNumber,
        notes: dto.notes,
      },
    });

    await this.confirmPayment(payment.id, adminUserId, dto.externalReference, undefined);

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'CREATE',
        entity: 'Payment',
        entityId: payment.id,
        description: `Versement présentiel enregistré: ${referenceNumber} - Jour ${dto.dayNumber ?? '?'} - ${dto.amount} HTG`,
      },
    });

    return prisma.payment.findUnique({ where: { id: payment.id } });
  }

  async createAgentCollection(agentUserId: string, dto: CreatePaymentDtoType) {
    const agent = await this.getAgentByUserId(agentUserId);
    const subscription = await prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      select: { id: true, userId: true, agentId: true, status: true },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw ApiError.notFound('Carnet introuvable ou inactif');
    }

    if (subscription.agentId !== agent.id) {
      throw ApiError.forbidden('Ce carnet n\'est pas affecte a cet agent');
    }

    return this.createPaymentForUser(
      subscription.userId,
      { ...dto, agentId: agent.id },
      agentUserId,
    );
  }

  private async createPaymentForUser(userId: string, dto: CreatePaymentDtoType, actorUserId: string) {
    const sub = await prisma.subscription.findFirst({
      where: { id: dto.subscriptionId, userId, status: 'ACTIVE' },
      include: {
        plan: true,
        payments: { where: { status: 'SUCCESS' }, select: { dayNumber: true } },
      },
    });

    if (!sub) throw ApiError.notFound('Souscription introuvable ou inactive');

    // Check if already paid for this day
    if (dto.dayNumber) {
      const existingPayment = sub.payments.find((p) => p.dayNumber === dto.dayNumber);
      if (existingPayment) {
        throw ApiError.conflict(`Paiement déjà effectué pour le jour ${dto.dayNumber}`);
      }
    }

    // Calculate penalty if late
    const penaltyAmount = await this.calculatePenalty(sub, dto.dayNumber);

    const referenceNumber = generateReference('PAY');
    const payment = await prisma.payment.create({
      data: {
        referenceNumber,
        subscriptionId: dto.subscriptionId,
        userId,
        agentId: dto.agentId,
        amount: dto.amount,
        currency: sub.plan.currency,
        method: dto.method as any,
        status: 'PENDING',
        dayNumber: dto.dayNumber,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        notes: dto.notes,
      },
    });

    // If cash/agent collection - auto-confirm (in real app would need agent confirmation)
    if (dto.method === 'CASH' || dto.method === 'AGENT_COLLECTION') {
      await this.confirmPayment(payment.id, actorUserId, dto.externalReference, undefined);
    }

    return payment;
  }

  async confirmPayment(paymentId: string, confirmedBy: string, externalRef?: string, actorRole?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!payment) throw ApiError.notFound('Paiement introuvable');
    if (actorRole === 'AGENT') {
      const agent = await this.getAgentByUserId(confirmedBy);
      if (payment.agentId !== agent.id) {
        throw ApiError.forbidden('Ce paiement n\'est pas rattaché à cet agent');
      }
    }
    if (payment.status !== 'PENDING') {
      throw ApiError.conflict('Ce paiement a déjà été traité');
    }

    const sub = payment.subscription;
    const amount = toNumber(payment.amount);
    const totalPaid = toNumber(sub.totalPaid) + amount;
    const remainingAmount = Math.max(0, toNumber(sub.totalDue) - totalPaid);

    const transactionRef = generateReference('TXN');

    await prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          externalReference: externalRef,
        },
      });

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionRef,
          userId: payment.userId,
          paymentId: payment.id,
          type: 'PAYMENT_IN',
          status: 'SUCCESS',
          amount: payment.amount,
          currency: payment.currency,
          fee: 0,
          netAmount: payment.amount,
          description: `Paiement ${payment.referenceNumber}`,
          processedAt: new Date(),
        },
      });

      // Update subscription
      const isCompleted = remainingAmount === 0;
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          totalPaid: totalPaid,
          remainingAmount,
          lastPaymentDate: new Date(),
          currentDay: (sub.currentDay ?? 0) + 1,
          status: isCompleted ? 'COMPLETED' : 'ACTIVE',
          ...(isCompleted ? { touchStatus: 'READY' } : {}),
        },
      });

      // Handle agent commission
      if (payment.agentId) {
        const agent = await tx.agent.findUnique({ where: { id: payment.agentId } });
        if (agent) {
          const commissionAmount =
            amount * (toNumber(agent.commissionRate) / 100);
          await tx.commission.create({
            data: {
              agentId: agent.id,
              recipientId: agent.userId,
              paymentId: payment.id,
              amount: commissionAmount,
              rate: agent.commissionRate,
              status: 'PENDING',
            },
          });
          await tx.agent.update({
            where: { id: agent.id },
            data: {
              totalCollected: { increment: amount },
            },
          });
        }
      }
    });

    return prisma.payment.findUnique({ where: { id: paymentId } });
  }

  async rejectPayment(paymentId: string, adminId: string, reason: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'PENDING') {
      throw ApiError.conflict('Paiement introuvable ou déjà traité');
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'FAILED', notes: reason },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'REJECT',
        entity: 'Payment',
        entityId: paymentId,
        description: `Paiement rejeté: ${reason}`,
      },
    });
  }

  async listMyPayments(userId: string, params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          userId,
          ...(params.subscriptionId && { subscriptionId: params.subscriptionId }),
          ...(params.status && { status: params.status }),
        },
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
      prisma.payment.count({ where: { userId } }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async listAllPayments(params: any, actorId: string, actorRole: string) {
    const { skip, take, page, limit } = getPaginationParams(params);
    const agent = actorRole === 'AGENT'
      ? await this.getAgentByUserId(actorId)
      : null;

    const where: any = {
      ...(params.status && { status: params.status }),
      ...(params.userId && { userId: params.userId }),
      ...(params.method && { method: params.method }),
      ...(agent && { agentId: agent.id }),
    };

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          subscription: {
            select: {
              subscriptionNumber: true,
              dossierNumber: true,
              plan: { select: { name: true, type: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
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

  private async calculatePenalty(sub: any, dayNumber?: number): Promise<number> {
    if (!dayNumber) return 0;

    const plan = sub.plan;
    const scheduledDate = new Date(
      sub.startDate.getTime() + dayNumber * 24 * 60 * 60 * 1000,
    );
    const gracePeriodEnd = new Date(
      scheduledDate.getTime() + plan.gracePeriodDays * 24 * 60 * 60 * 1000,
    );

    if (new Date() <= gracePeriodEnd) return 0;

    const scheduleItem = await prisma.planSchedule.findFirst({
      where: { planId: plan.id, dayNumber },
    });

    if (!scheduleItem) return 0;

    return toNumber(scheduleItem.amount) * (toNumber(plan.latePenaltyRate) / 100);
  }
}

export const paymentsService = new PaymentsService();
