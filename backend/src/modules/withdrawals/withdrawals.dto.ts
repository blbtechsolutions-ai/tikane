import { z } from 'zod';

export const RequestWithdrawalDto = z.object({
  subscriptionId: z.string().uuid(),
  method: z.enum(['MONCASH', 'NATCASH', 'BANK_TRANSFER', 'CASH']),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  phoneNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const RejectWithdrawalDto = z.object({
  reason: z.string().min(5),
});

export type RequestWithdrawalDtoType = z.infer<typeof RequestWithdrawalDto>;
