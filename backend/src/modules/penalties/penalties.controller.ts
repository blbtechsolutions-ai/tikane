import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { penaltiesService } from './penalties.service';

export class PenaltiesController {
  async list(req: AuthRequest, res: Response): Promise<void> {
    const result = await penaltiesService.listPenalties(req.query as any);
    res.json({ success: true, ...result });
  }

  async listMine(req: AuthRequest, res: Response): Promise<void> {
    const result = await penaltiesService.getMyPenalties(req.user!.sub, req.query as any);
    res.json({ success: true, ...result });
  }

  async add(req: AuthRequest, res: Response): Promise<void> {
    const { subscriptionId, type, amount, reason, dayNumber } = req.body;
    if (!subscriptionId || !type || !amount || !reason) {
      res.status(400).json({ success: false, message: 'subscriptionId, type, amount, reason sont requis' });
      return;
    }
    const penalty = await penaltiesService.addPenalty(
      { subscriptionId, type, amount: Number(amount), reason, dayNumber: dayNumber ? Number(dayNumber) : undefined },
      req.user!.sub,
    );
    res.status(201).json({ success: true, message: 'Pénalité ajoutée', data: penalty });
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    const { amount, reason } = req.body;
    const penalty = await penaltiesService.updatePenalty(
      req.params.id,
      { amount: amount !== undefined ? Number(amount) : undefined, reason },
      req.user!.sub,
    );
    res.json({ success: true, message: 'Pénalité mise à jour', data: penalty });
  }

  async waive(req: AuthRequest, res: Response): Promise<void> {
    const penalty = await penaltiesService.waivePenalty(req.params.id, req.user!.sub);
    res.json({ success: true, message: 'Pénalité annulée', data: penalty });
  }
}

export const penaltiesController = new PenaltiesController();
