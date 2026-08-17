import { z } from 'zod';

export const CreateSubscriptionDto = z.object({
  planId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  beneficiaryName: z.string().min(2).max(120).optional(),
  beneficiaryPhone: z.string().max(30).optional(),
  beneficiarySignature: z.string().max(120).optional(),
});

export const ManagedSubscriptionDto = CreateSubscriptionDto.extend({
  userId: z.string().uuid(),
});

export const MarkTouchDto = z.object({
  touchReference: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateSubscriptionDtoType = z.infer<typeof CreateSubscriptionDto>;
export type ManagedSubscriptionDtoType = z.infer<typeof ManagedSubscriptionDto>;
export type MarkTouchDtoType = z.infer<typeof MarkTouchDto>;
