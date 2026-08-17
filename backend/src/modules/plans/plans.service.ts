import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';
import {
  buildPaginatedResult,
  getPaginationParams,
  calculateProgressiveTotal,
  calculateProgressiveDayAmount,
  calculateSabotayAmount,
  addDays,
  toNumber,
} from '../../common/utils/helpers';
import { CreatePlanDtoType, UpdatePlanDtoType } from './plans.dto';
import { Prisma } from '@prisma/client';

export class PlansService {
  async createPlan(dto: CreatePlanDtoType, adminId: string) {
    const { totalAmount, finalAmount } = this.calculatePlanAmounts(dto);

    // Validate plan-type-specific fields
    if (dto.type === 'PROGRESSIVE' && !dto.incrementAmount) {
      throw ApiError.badRequest('Le montant d\'incrément est requis pour un plan progressif');
    }
    if (['FIXED_DAILY', 'WEEKLY', 'MONTHLY'].includes(dto.type) && !dto.fixedAmount) {
      throw ApiError.badRequest('Le montant fixe est requis pour ce type de plan');
    }

    const plan = await prisma.plan.create({
      data: {
        ...dto,
        startAmount: dto.startAmount,
        totalAmount,
        finalAmount,
        status: 'ACTIVE',
        createdBy: adminId,
      },
    });

    // Generate payment schedule
    await this.generateSchedule(plan.id, dto);

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'CREATE',
        entity: 'Plan',
        entityId: plan.id,
        description: `Plan créé: ${plan.name}`,
      },
    });

    return plan;
  }

  async listPlans(params: any, isAdmin = false) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const where: Prisma.PlanWhereInput = {
      deletedAt: null,
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(!isAdmin && { status: 'ACTIVE', isPublic: true }),
      ...(params.isFeatured !== undefined && { isFeatured: params.isFeatured }),
    };

    const [data, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        skip,
        take,
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          _count: { select: { subscriptions: true } },
        },
      }),
      prisma.plan.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id, deletedAt: null },
      include: {
        planSchedules: { orderBy: { dayNumber: 'asc' } },
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) throw ApiError.notFound('Plan introuvable');
    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDtoType, adminId: string) {
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Plan introuvable');

    const merged = { ...existing, ...dto };
    const { totalAmount, finalAmount } = this.calculatePlanAmounts(merged as any);

    const plan = await prisma.plan.update({
      where: { id },
      data: { ...dto, totalAmount, finalAmount },
    });

    // Regenerate schedule if parameters changed
    if (dto.durationDays || dto.startAmount || dto.incrementAmount || dto.fixedAmount) {
      await prisma.planSchedule.deleteMany({ where: { planId: id } });
      await this.generateSchedule(id, merged as any);
    }

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        entity: 'Plan',
        entityId: id,
        newValues: dto,
        description: `Plan modifié: ${plan.name}`,
      },
    });

    return plan;
  }

  async updatePlanStatus(id: string, status: string, adminId: string) {
    const plan = await prisma.plan.update({
      where: { id },
      data: { status: status as any },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: status === 'ACTIVE' ? 'ACTIVATE' : 'UPDATE',
        entity: 'Plan',
        entityId: id,
        description: `Plan ${status === 'ACTIVE' ? 'activé' : 'désactivé'}: ${plan.name}`,
      },
    });

    return plan;
  }

  async deletePlan(id: string, adminId: string) {
    const subscriptions = await prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });

    if (subscriptions > 0) {
      throw ApiError.conflict(
        'Ce plan a des souscriptions actives. Archivez-le d\'abord.',
      );
    }

    await prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'DELETE',
        entity: 'Plan',
        entityId: id,
        description: 'Plan supprimé',
      },
    });
  }

  async getSchedulePreview(dto: CreatePlanDtoType) {
    const schedule = this.buildScheduleItems(dto);
    const { totalAmount, finalAmount } = this.calculatePlanAmounts(dto);
    return { schedule, totalAmount, finalAmount };
  }

  // ─── Private helpers ─────────────────────────────────────────

  private calculatePlanAmounts(dto: CreatePlanDtoType): {
    totalAmount: number;
    finalAmount: number;
  } {
    const durationDays = Number(dto.durationDays ?? 0);
    const startAmount = toNumber(dto.startAmount ?? 0);
    const incrementAmount = dto.incrementAmount == null ? 0 : toNumber(dto.incrementAmount);
    const fixedAmount = dto.fixedAmount == null ? startAmount : toNumber(dto.fixedAmount);
    const interestRate = dto.interestRate == null ? 0 : toNumber(dto.interestRate);
    const registrationFee = dto.registrationFee == null ? 0 : toNumber(dto.registrationFee);
    const caNeetFee = dto.caNeetFee == null ? 0 : toNumber(dto.caNeetFee);
    const platformFeeRate = dto.platformFeeRate == null ? 0 : toNumber(dto.platformFeeRate);
    const interestBearingSabotay = dto.type === 'SABOTAY' && interestRate > 0;
    let totalAmount = 0;

    switch (dto.type) {
      case 'PROGRESSIVE':
        totalAmount = calculateProgressiveTotal(
          startAmount,
          incrementAmount,
          durationDays,
        );
        break;
      case 'FIXED_DAILY':
        totalAmount = fixedAmount * durationDays;
        break;
      case 'WEEKLY':
        totalAmount =
          fixedAmount *
          Math.ceil(durationDays / 7);
        break;
      case 'MONTHLY':
        totalAmount =
          fixedAmount *
          Math.ceil(durationDays / 30);
        break;
      case 'SABOTAY':
        totalAmount = interestBearingSabotay ? startAmount : fixedAmount * durationDays;
        break;
    }

    const fixedFees = registrationFee + caNeetFee;

    const finalAmount =
      interestBearingSabotay
        ? calculateSabotayAmount(
            startAmount,
            interestRate,
            dto.interestType as 'SIMPLE' | 'COMPOUND',
          ) - fixedFees
        : dto.type === 'SABOTAY'
          ? Math.max(0, totalAmount - fixedFees - totalAmount * (platformFeeRate / 100))
          : totalAmount * (1 - platformFeeRate / 100);

    return { totalAmount, finalAmount };
  }

  private buildScheduleItems(dto: CreatePlanDtoType): Array<{
    dayNumber: number;
    amount: number;
    label: string;
  }> {
    const durationDays = Number(dto.durationDays ?? 0);
    const startAmount = toNumber(dto.startAmount ?? 0);
    const incrementAmount = dto.incrementAmount == null ? 0 : toNumber(dto.incrementAmount);
    const fixedAmount = dto.fixedAmount == null ? startAmount : toNumber(dto.fixedAmount);
    const interestRate = dto.interestRate == null ? 0 : toNumber(dto.interestRate);
    const registrationFee = dto.registrationFee == null ? 0 : toNumber(dto.registrationFee);
    const caNeetFee = dto.caNeetFee == null ? 0 : toNumber(dto.caNeetFee);
    const interestBearingSabotay = dto.type === 'SABOTAY' && interestRate > 0;
    const items = [];

    if (dto.type === 'PROGRESSIVE') {
      for (let day = 1; day <= durationDays; day++) {
        const amount = calculateProgressiveDayAmount(
          startAmount,
          incrementAmount,
          day,
        );
        items.push({ dayNumber: day, amount, label: `Jour ${day}` });
      }
    } else if (dto.type === 'FIXED_DAILY') {
      for (let day = 1; day <= durationDays; day++) {
        items.push({
          dayNumber: day,
          amount: fixedAmount,
          label: `Jour ${day}`,
        });
      }
    } else if (dto.type === 'WEEKLY') {
      const weeks = Math.ceil(durationDays / 7);
      for (let week = 1; week <= weeks; week++) {
        items.push({
          dayNumber: week * 7,
          amount: fixedAmount,
          label: `Semaine ${week}`,
        });
      }
    } else if (dto.type === 'MONTHLY') {
      const months = Math.ceil(durationDays / 30);
      for (let month = 1; month <= months; month++) {
        items.push({
          dayNumber: month * 30,
          amount: fixedAmount,
          label: `Mois ${month}`,
        });
      }
    } else if (interestBearingSabotay) {
      items.push({
        dayNumber: durationDays,
        amount: Math.max(0, calculateSabotayAmount(
          startAmount,
          interestRate,
          dto.interestType as 'SIMPLE' | 'COMPOUND',
        ) - (registrationFee + caNeetFee)),
        label: 'Montant a toucher',
      });
    } else if (dto.type === 'SABOTAY') {
      for (let day = 1; day <= durationDays; day++) {
        items.push({
          dayNumber: day,
          amount: fixedAmount,
          label: `Jour ${day}`,
        });
      }
    }

    return items;
  }

  private async generateSchedule(planId: string, dto: CreatePlanDtoType) {
    const items = this.buildScheduleItems(dto);
    await prisma.planSchedule.createMany({
      data: items.map((item) => ({ ...item, planId })),
    });
  }
}

export const plansService = new PlansService();
