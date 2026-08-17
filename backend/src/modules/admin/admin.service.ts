import { prisma } from '../../config/database';
import { buildPaginatedResult, getPaginationParams, toNumber } from '../../common/utils/helpers';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'annual';

export class AdminService {
  async getGlobalStats() {
    const [
      totalUsers,
      activeSubscriptions,
      completedSubscriptions,
      totalPayments,
      pendingPayments,
      pendingWithdrawals,
      totalRevenue,
      usersToday,
      paymentsToday,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null, role: 'CLIENT' } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'SUCCESS' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.transaction.aggregate({
        where: { type: 'PAYMENT_IN', status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          role: 'CLIENT',
        },
      }),
      prisma.payment.count({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      totalUsers,
      activeSubscriptions,
      completedSubscriptions,
      totalPayments,
      pendingPayments,
      pendingWithdrawals,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      usersToday,
      newUsersToday: usersToday,
      paymentsToday,
    };
  }

  async getRevenueChart(period: 'week' | 'month' | 'year' = 'month') {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date(Date.now() - days * 86400000);

    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'PAYMENT_IN',
        status: 'SUCCESS',
        createdAt: { gte: startDate },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    transactions.forEach((t) => {
      const date = t.createdAt.toISOString().slice(0, 10);
      grouped[date] = (grouped[date] ?? 0) + toNumber(t.amount);
    });

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }

  async getPopularPlans() {
    const plans = await prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      include: {
        _count: { select: { subscriptions: true } },
      },
      orderBy: { subscriptions: { _count: 'desc' } },
      take: 5,
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      subscriptions: p._count.subscriptions,
    }));
  }

  async getAuditLogs(params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        where: {
          ...(params.userId && { userId: params.userId }),
          ...(params.entity && { entity: params.entity }),
          ...(params.action && { action: params.action }),
        },
      }),
      prisma.auditLog.count(),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async getSystemHealth() {
    const [dbOk, recentErrors] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      prisma.auditLog.count({
        where: {
          action: 'DELETE',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      database: dbOk ? 'OK' : 'ERROR',
      recentAuditEvents: recentErrors,
      timestamp: new Date().toISOString(),
    };
  }

  async exportUsersCSV(): Promise<string> {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
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
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID', 'Email', 'Téléphone', 'Prénom', 'Nom', 'Rôle',
      'Statut', 'KYC', 'Email vérifié', 'Souscriptions', 'Date inscription',
    ];

    const rows = users.map((u) => [
      u.id, u.email, u.phone ?? '', u.firstName, u.lastName,
      u.role, u.status, u.kycStatus, u.emailVerified, u._count.subscriptions,
      u.createdAt.toISOString(),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  // ── Reports ────────────────────────────────────────────────

  async getReport(period: ReportPeriod) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'annual':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const [
      revenue,
      paymentsCount,
      newClients,
      newSubscriptions,
      completedSubscriptions,
      pendingWithdrawals,
      withdrawalsAmount,
      penaltiesAmount,
      commissions,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'PAYMENT_IN', status: 'SUCCESS', createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { status: 'SUCCESS', paidAt: { gte: startDate } } }),
      prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: startDate }, deletedAt: null } }),
      prisma.subscription.count({ where: { createdAt: { gte: startDate } } }),
      prisma.subscription.count({ where: { status: 'COMPLETED', updatedAt: { gte: startDate } } }),
      prisma.withdrawal.count({ where: { status: 'PENDING', createdAt: { gte: startDate } } }),
      prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: startDate } },
        _sum: { netAmount: true },
      }),
      prisma.penalty.aggregate({
        where: { createdAt: { gte: startDate }, waivedAt: null },
        _sum: { amount: true },
      }),
      prisma.commission.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
    ]);

    // Revenue breakdown by plan
    const topPlans = await prisma.payment.groupBy({
      by: ['subscriptionId'],
      where: { status: 'SUCCESS', paidAt: { gte: startDate } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    // Daily trend for the period
    const trendDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 365;
    const trendData = await prisma.transaction.findMany({
      where: { type: 'PAYMENT_IN', status: 'SUCCESS', createdAt: { gte: startDate } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    trendData.forEach((t) => {
      const key = period === 'annual'
        ? t.createdAt.toISOString().slice(0, 7)   // YYYY-MM
        : t.createdAt.toISOString().slice(0, 10); // YYYY-MM-DD
      grouped[key] = (grouped[key] ?? 0) + toNumber(t.amount);
    });
    const trend = Object.entries(grouped).map(([date, amount]) => ({ date, amount }));

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        revenue: toNumber(revenue._sum.amount ?? 0),
        paymentsCount,
        newClients,
        newSubscriptions,
        completedSubscriptions,
        pendingWithdrawals,
        withdrawalsAmount: toNumber(withdrawalsAmount._sum.netAmount ?? 0),
        penaltiesAmount: toNumber(penaltiesAmount._sum.amount ?? 0),
        commissions: toNumber(commissions._sum.amount ?? 0),
      },
      trend,
    };
  }

  // ── System settings ─────────────────────────────────────────

  async getSettings(group?: string) {
    const settings = await prisma.systemConfig.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
    return settings;
  }

  async upsertSetting(key: string, value: string, adminId: string) {
    const existing = await prisma.systemConfig.findUnique({ where: { key } });
    const config = await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value, updatedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE',
        entity: 'SystemConfig',
        entityId: config.id,
        description: `Paramètre "${key}" mis à jour`,
        oldValues: existing ? { value: existing.value } : undefined,
        newValues: { value },
      },
    });

    return config;
  }

  async bulkUpsertSettings(entries: { key: string; value: string }[], adminId: string) {
    const results = await Promise.all(
      entries.map((e) => this.upsertSetting(e.key, e.value, adminId)),
    );
    return results;
  }
}

export const adminService = new AdminService();

