import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { withdrawalsService } from './withdrawals.service';
import { RequestWithdrawalDto, RejectWithdrawalDto } from './withdrawals.dto';

export class WithdrawalsController {
  async request(req: AuthRequest, res: Response): Promise<void> {
    const dto = RequestWithdrawalDto.parse(req.body);
    const w = await withdrawalsService.requestWithdrawal(req.user!.sub, dto);
    res.status(201).json({ success: true, message: 'Demande de retrait soumise', data: w });
  }

  async listMine(req: AuthRequest, res: Response): Promise<void> {
    const result = await withdrawalsService.listMyWithdrawals(req.user!.sub, req.query);
    res.json({ success: true, ...result });
  }

  async listAll(req: AuthRequest, res: Response): Promise<void> {
    const result = await withdrawalsService.listAllWithdrawals(req.query);
    res.json({ success: true, ...result });
  }

  async approve(req: AuthRequest, res: Response): Promise<void> {
    await withdrawalsService.approveWithdrawal(req.params.id, req.user!.sub);
    res.json({ success: true, message: 'Retrait approuvé' });
  }

  async reject(req: AuthRequest, res: Response): Promise<void> {
    const { reason } = RejectWithdrawalDto.parse(req.body);
    await withdrawalsService.rejectWithdrawal(req.params.id, req.user!.sub, reason);
    res.json({ success: true, message: 'Retrait rejeté' });
  }

  async complete(req: AuthRequest, res: Response): Promise<void> {
    await withdrawalsService.completeWithdrawal(req.params.id, req.user!.sub);
    res.json({ success: true, message: 'Retrait complété' });
  }
}

export const withdrawalsController = new WithdrawalsController();
