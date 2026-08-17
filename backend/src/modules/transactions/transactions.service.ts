import { prisma } from '../../config/database';
import { buildPaginatedResult, getPaginationParams } from '../../common/utils/helpers';

export class TransactionsService {
  async listMyTransactions(userId: string, params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const where: any = {
      userId,
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
    };

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              referenceNumber: true,
              method: true,
              subscription: { select: { subscriptionNumber: true, plan: { select: { name: true } } } },
            },
          },
          withdrawal: { select: { referenceNumber: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async listAllTransactions(params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...(params.type && { type: params.type }),
          ...(params.userId && { userId: params.userId }),
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.transaction.count(),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async getTransactionSummary(userId: string) {
    const [totalIn, totalOut, count] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'PAYMENT_IN', status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'WITHDRAWAL', status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      totalIn: totalIn._sum.amount ?? 0,
      totalOut: totalOut._sum.amount ?? 0,
      count,
    };
  }
}

export const transactionsService = new TransactionsService();
