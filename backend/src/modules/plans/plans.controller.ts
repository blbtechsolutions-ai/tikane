import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { plansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto, ListPlansDto } from './plans.dto';

export class PlansController {
  async listPlans(req: AuthRequest, res: Response): Promise<void> {
    const params = ListPlansDto.parse(req.query);
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role ?? '');
    const result = await plansService.listPlans(params, isAdmin);
    res.json({ success: true, ...result });
  }

  async getPlan(req: AuthRequest, res: Response): Promise<void> {
    const plan = await plansService.getPlanById(req.params.id);
    res.json({ success: true, data: plan });
  }

  async createPlan(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreatePlanDto.parse(req.body);
    const plan = await plansService.createPlan(dto, req.user!.sub);
    res.status(201).json({ success: true, message: 'Plan créé', data: plan });
  }

  async updatePlan(req: AuthRequest, res: Response): Promise<void> {
    const dto = UpdatePlanDto.parse(req.body);
    const plan = await plansService.updatePlan(req.params.id, dto, req.user!.sub);
    res.json({ success: true, message: 'Plan mis à jour', data: plan });
  }

  async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    const { status } = req.body;
    const plan = await plansService.updatePlanStatus(req.params.id, status, req.user!.sub);
    res.json({ success: true, data: plan });
  }

  async deletePlan(req: AuthRequest, res: Response): Promise<void> {
    await plansService.deletePlan(req.params.id, req.user!.sub);
    res.json({ success: true, message: 'Plan supprimé' });
  }

  async previewSchedule(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreatePlanDto.parse(req.body);
    const preview = await plansService.getSchedulePreview(dto);
    res.json({ success: true, data: preview });
  }
}

export const plansController = new PlansController();
