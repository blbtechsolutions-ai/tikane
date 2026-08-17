import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { subscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, ManagedSubscriptionDto, MarkTouchDto } from './subscriptions.dto';

export class SubscriptionsController {
  async subscribe(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreateSubscriptionDto.parse(req.body);
    const sub = await subscriptionsService.subscribe(req.user!.sub, dto);
    res.status(201).json({ success: true, message: 'Souscription créée', data: sub });
  }

  async createManaged(req: AuthRequest, res: Response): Promise<void> {
    const dto = ManagedSubscriptionDto.parse(req.body);
    const sub = await subscriptionsService.createManagedSubscription(req.user!.sub, req.user!.role, dto);
    res.status(201).json({ success: true, message: 'Carnet créé', data: sub });
  }

  async listMine(req: AuthRequest, res: Response): Promise<void> {
    const result = await subscriptionsService.listMySubscriptions(req.user!.sub, req.query);
    res.json({ success: true, ...result });
  }

  async getDetail(req: AuthRequest, res: Response): Promise<void> {
    const sub = await subscriptionsService.getSubscriptionDetail(
      req.params.id,
      req.user!.sub,
      req.user!.role,
    );
    res.json({ success: true, data: sub });
  }

  async cancel(req: AuthRequest, res: Response): Promise<void> {
    await subscriptionsService.cancelSubscription(req.params.id, req.user!.sub);
    res.json({ success: true, message: 'Souscription annulée' });
  }

  async markTouched(req: AuthRequest, res: Response): Promise<void> {
    const dto = MarkTouchDto.parse(req.body);
    const sub = await subscriptionsService.markAsTouched(req.params.id, req.user!.sub, req.user!.role, dto);
    res.json({ success: true, message: 'Carnet marqué comme touché', data: sub });
  }

  // Admin
  async listAll(req: AuthRequest, res: Response): Promise<void> {
    const result = await subscriptionsService.listAllSubscriptions(req.query, req.user!.sub, req.user!.role);
    res.json({ success: true, ...result });
  }
}

export const subscriptionsController = new SubscriptionsController();
