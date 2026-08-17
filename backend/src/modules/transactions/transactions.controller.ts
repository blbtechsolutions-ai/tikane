import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { transactionsService } from './transactions.service';

export class TransactionsController {
  async listMine(req: AuthRequest, res: Response): Promise<void> {
    const result = await transactionsService.listMyTransactions(req.user!.sub, req.query);
    res.json({ success: true, ...result });
  }

  async getSummary(req: AuthRequest, res: Response): Promise<void> {
    const summary = await transactionsService.getTransactionSummary(req.user!.sub);
    res.json({ success: true, data: summary });
  }

  async listAll(req: AuthRequest, res: Response): Promise<void> {
    const result = await transactionsService.listAllTransactions(req.query);
    res.json({ success: true, ...result });
  }
}

export const transactionsController = new TransactionsController();
