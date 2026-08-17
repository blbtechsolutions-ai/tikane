import { prisma } from '../../config/database';
import { ApiError } from '../../common/errors/ApiError';
import { generateAgentCode, generateReferralCode, buildPaginatedResult, getPaginationParams } from '../../common/utils/helpers';
import { hashPassword } from '../../common/utils/bcrypt.utils';

export class AgentsService {
  async createAgent(userId: string, commissionRate?: number, zone?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('Utilisateur introuvable');

    const existingAgent = await prisma.agent.findUnique({ where: { userId } });
    if (existingAgent) throw ApiError.conflict('Cet utilisateur est déjà un agent');

    const [agent] = await prisma.$transaction([
      prisma.agent.create({
        data: {
          userId,
          agentCode: generateAgentCode(),
          commissionRate: commissionRate ?? 2.5,
          zone: zone ?? null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { role: 'AGENT' },
      }),
    ]);

    return agent;
  }

  async createAgentWithUser(
    data: { firstName: string; lastName: string; email: string; password: string; phone?: string; commissionRate?: number; zone?: string; preferredLanguage?: string },
    creatorId: string,
  ) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          ...(data.phone ? [{ phone: data.phone }] : []),
        ],
      },
    });
    if (existing) {
      if (existing.email === data.email) throw ApiError.conflict('Cet email est déjà utilisé');
      throw ApiError.conflict('Ce numéro de téléphone est déjà utilisé');
    }

    const passwordHash = await hashPassword(data.password);
    const referralCode = generateReferralCode();
    const agentCode = generateAgentCode();

    const [user, agent] = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          phone: data.phone?.trim() || null,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'AGENT',
          status: 'ACTIVE',
          preferredLanguage: data.preferredLanguage ?? 'fr',
          referralCode,
        },
      });
      const newAgent = await tx.agent.create({
        data: {
          userId: newUser.id,
          agentCode,
          commissionRate: data.commissionRate ?? 2.5,
          zone: data.zone ?? null,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: creatorId,
          action: 'CREATE',
          entity: 'Agent',
          entityId: newUser.id,
          description: `Nouveau compte agent créé pour ${newUser.firstName} ${newUser.lastName}`,
        },
      });
      return [newUser, newAgent];
    });

    return { ...agent, user: { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, status: user.status } };
  }

  async listAgents(params: any) {
    const { skip, take, page, limit } = getPaginationParams(params);

    const [data, total] = await Promise.all([
      prisma.agent.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true, lastName: true,
              email: true, phone: true, status: true,
            },
          },
          _count: { select: { collections: true, commissions: true } },
        },
        where: params.isActive !== undefined ? { isActive: params.isActive } : {},
      }),
      prisma.agent.count(),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async getAgentStats(agentId: string) {
    const [agent, totalCommissions, recentCollections] = await Promise.all([
      prisma.agent.findUnique({
        where: { id: agentId },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.commission.aggregate({
        where: { agentId, status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { agentId, status: 'SUCCESS' },
        take: 10,
        orderBy: { paidAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          subscription: { select: { plan: { select: { name: true } } } },
        },
      }),
    ]);

    if (!agent) throw ApiError.notFound('Agent introuvable');

    return {
      agent,
      pendingCommissions: totalCommissions._sum.amount ?? 0,
      recentCollections,
    };
  }

  async getWorkspace(userId: string) {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!agent) throw ApiError.notFound('Agent introuvable');

    const [pendingCommissions, recentCollections, activeCarnets, readyTouches] = await Promise.all([
      prisma.commission.aggregate({
        where: { agentId: agent.id, status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.payment.findMany({
        where: { agentId: agent.id, status: 'SUCCESS' },
        take: 8,
        orderBy: { paidAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          subscription: {
            select: {
              subscriptionNumber: true,
              dossierNumber: true,
              plan: { select: { name: true, type: true } },
            },
          },
        },
      }),
      prisma.subscription.count({
        where: { agentId: agent.id, status: 'ACTIVE' },
      }),
      prisma.subscription.count({
        where: { agentId: agent.id, touchStatus: 'READY' },
      }),
    ]);

    return {
      agent,
      pendingCommissions: pendingCommissions._sum.amount ?? 0,
      recentCollections,
      activeCarnets,
      readyTouches,
    };
  }

  async updateCommissionRate(agentId: string, rate: number) {
    return prisma.agent.update({
      where: { id: agentId },
      data: { commissionRate: rate },
    });
  }
}

export const agentsService = new AgentsService();
