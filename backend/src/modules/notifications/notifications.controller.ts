import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { notificationsService } from './notifications.service';

export class NotificationsController {
  async listMine(req: AuthRequest, res: Response): Promise<void> {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await notificationsService.getMyNotifications(req.user!.sub, page, limit);
    res.json({ success: true, data: result });
  }

  async markRead(req: AuthRequest, res: Response): Promise<void> {
    await notificationsService.markAsRead(req.params.id, req.user!.sub);
    res.json({ success: true });
  }

  async markAllRead(req: AuthRequest, res: Response): Promise<void> {
    await notificationsService.markAllAsRead(req.user!.sub);
    res.json({ success: true });
  }
}

export const notificationsController = new NotificationsController();
