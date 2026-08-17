import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { adminService } from './admin.service';

export class AdminController {
  async getStats(req: AuthRequest, res: Response): Promise<void> {
    const stats = await adminService.getGlobalStats();
    res.json({ success: true, data: stats });
  }

  async getRevenueChart(req: AuthRequest, res: Response): Promise<void> {
    const period = (req.query.period as 'week' | 'month' | 'year') ?? 'month';
    const data = await adminService.getRevenueChart(period);
    res.json({ success: true, data });
  }

  async getPopularPlans(req: AuthRequest, res: Response): Promise<void> {
    const data = await adminService.getPopularPlans();
    res.json({ success: true, data });
  }

  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    const result = await adminService.getAuditLogs(req.query);
    res.json({ success: true, ...result });
  }

  async getSystemHealth(req: AuthRequest, res: Response): Promise<void> {
    const health = await adminService.getSystemHealth();
    res.json({ success: true, data: health });
  }

  async exportUsers(req: AuthRequest, res: Response): Promise<void> {
    const csv = await adminService.exportUsersCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tikane-users-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  async getReport(req: AuthRequest, res: Response): Promise<void> {
    const period = (req.query.period as any) ?? 'monthly';
    const report = await adminService.getReport(period);
    res.json({ success: true, data: report });
  }

  async getSettings(req: AuthRequest, res: Response): Promise<void> {
    const settings = await adminService.getSettings(req.query.group as string | undefined);
    res.json({ success: true, data: settings });
  }

  async upsertSetting(req: AuthRequest, res: Response): Promise<void> {
    const { value } = req.body;
    if (!value && value !== '0') {
      res.status(400).json({ success: false, message: 'value est requis' });
      return;
    }
    const config = await adminService.upsertSetting(req.params.key, String(value), req.user!.sub);
    res.json({ success: true, message: 'Paramètre mis à jour', data: config });
  }

  async bulkUpsertSettings(req: AuthRequest, res: Response): Promise<void> {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      res.status(400).json({ success: false, message: 'settings doit être un tableau [{key, value}]' });
      return;
    }
    const results = await adminService.bulkUpsertSettings(settings, req.user!.sub);
    res.json({ success: true, message: 'Paramètres mis à jour', data: results });
  }
}

export const adminController = new AdminController();
