import { Response } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { paymentsService } from './payments.service';
import {
  CreatePaymentDto,
  ConfirmPaymentDto,
  RejectPaymentDto,
} from './payments.dto';

export class PaymentsController {
  async createPayment(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreatePaymentDto.parse(req.body);
    const payment = await paymentsService.createPayment(req.user!.sub, dto);
    res.status(201).json({ success: true, message: 'Paiement créé', data: payment });
  }

  async collectPayment(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreatePaymentDto.parse(req.body);
    const payment = await paymentsService.createAgentCollection(req.user!.sub, dto);
    res.status(201).json({ success: true, message: 'Versement encaissé', data: payment });
  }

  async adminCollect(req: AuthRequest, res: Response): Promise<void> {
    const dto = CreatePaymentDto.parse(req.body);
    const payment = await paymentsService.createAdminPayment(req.user!.sub, dto);
    res.status(201).json({ success: true, message: 'Versement présentiel enregistré', data: payment });
  }

  async confirmPayment(req: AuthRequest, res: Response): Promise<void> {
    const { externalReference } = ConfirmPaymentDto.parse(req.body);
    const payment = await paymentsService.confirmPayment(
      req.params.id,
      req.user!.sub,
      externalReference,
      req.user!.role,
    );
    res.json({ success: true, message: 'Paiement confirmé', data: payment });
  }

  async rejectPayment(req: AuthRequest, res: Response): Promise<void> {
    const { reason } = RejectPaymentDto.parse(req.body);
    await paymentsService.rejectPayment(req.params.id, req.user!.sub, reason);
    res.json({ success: true, message: 'Paiement rejeté' });
  }

  async listMyPayments(req: AuthRequest, res: Response): Promise<void> {
    const result = await paymentsService.listMyPayments(req.user!.sub, req.query);
    res.json({ success: true, ...result });
  }

  async listAllPayments(req: AuthRequest, res: Response): Promise<void> {
    const result = await paymentsService.listAllPayments(req.query, req.user!.sub, req.user!.role);
    res.json({ success: true, ...result });
  }
}

export const paymentsController = new PaymentsController();
