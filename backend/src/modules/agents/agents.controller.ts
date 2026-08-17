import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { agentsService } from './agents.service';
import { z } from 'zod';

const CreateAgentFromUserDto = z.object({
  userId: z.string().uuid(),
  commissionRate: z.number().min(0).max(100).optional(),
  zone: z.string().optional(),
});

const CreateAgentWithUserDto = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  phone: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  zone: z.string().optional(),
  preferredLanguage: z.enum(['fr', 'ht']).optional(),
});

export class AgentsController {
  async createAgent(req: AuthRequest, res: Response): Promise<void> {
    // If userId provided → promote existing user; otherwise create new user+agent
    if (req.body.userId) {
      const { userId, commissionRate, zone } = CreateAgentFromUserDto.parse(req.body);
      const agent = await agentsService.createAgent(userId, commissionRate, zone);
      res.status(201).json({ success: true, data: agent });
    } else {
      const dto = CreateAgentWithUserDto.parse(req.body);
      const agent = await agentsService.createAgentWithUser(dto, req.user!.sub);
      res.status(201).json({ success: true, data: agent });
    }
  }

  async listAgents(req: AuthRequest, res: Response): Promise<void> {
    const result = await agentsService.listAgents(req.query);
    res.json({ success: true, ...result });
  }

  async getWorkspace(req: AuthRequest, res: Response): Promise<void> {
    const workspace = await agentsService.getWorkspace(req.user!.sub);
    res.json({ success: true, data: workspace });
  }

  async getMyStats(req: AuthRequest, res: Response): Promise<void> {
    const agent = await agentsService.getAgentStats(req.params.id);
    res.json({ success: true, data: agent });
  }
}

export const agentsController = new AgentsController();
