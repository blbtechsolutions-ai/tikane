import { z } from 'zod';

export const CreatePaymentDto = z.object({
  subscriptionId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['MONCASH', 'NATCASH', 'BANK_TRANSFER', 'CASH', 'AGENT_COLLECTION', 'INTERNAL_CREDIT']),
  dayNumber: z.number().int().positive().optional(),
  agentId: z.string().uuid().optional(),
  scheduledDate: z.string().datetime().optional(),
  externalReference: z.string().optional(),
  notes: z.string().optional(),
});

export const ConfirmPaymentDto = z.object({
  externalReference: z.string().optional(),
  notes: z.string().optional(),
});

export const RejectPaymentDto = z.object({
  reason: z.string().min(5),
});

export type CreatePaymentDtoType = z.infer<typeof CreatePaymentDto>;
