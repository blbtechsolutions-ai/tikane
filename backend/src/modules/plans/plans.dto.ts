import { z } from 'zod';

export const CreatePlanDto = z.object({
  name: z.string().min(3).max(100).trim(),
  nameCreole: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  descriptionCreole: z.string().max(1000).optional(),
  type: z.enum(['PROGRESSIVE', 'FIXED_DAILY', 'WEEKLY', 'MONTHLY', 'SABOTAY']),
  currency: z.string().default('HTG'),
  durationDays: z.number().int().min(1).max(365),
  startAmount: z.number().positive(),
  incrementAmount: z.number().positive().optional(),  // Pour PROGRESSIVE
  fixedAmount: z.number().positive().optional(),      // Pour FIXED, WEEKLY, MONTHLY
  interestRate: z.number().min(0).max(100).optional(), // Pour SABOTAY
  interestType: z.enum(['SIMPLE', 'COMPOUND']).default('SIMPLE'),
  registrationFee: z.number().min(0).default(0),
  caNeetFee: z.number().min(0).default(0),
  platformFeeRate: z.number().min(0).max(100).default(0),
  agentCommissionRate: z.number().min(0).max(100).default(0),
  minParticipants: z.number().int().min(1).optional(),
  maxParticipants: z.number().int().optional(),
  withdrawalDelayDays: z.number().int().min(0).default(0),
  gracePeriodDays: z.number().int().min(0).default(3),
  latePenaltyRate: z.number().min(0).max(100).default(5),
  maxMissedPayments: z.number().int().min(1).default(3),
  isPublic: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  imageUrl: z.string().url().optional(),
});

export const UpdatePlanDto = CreatePlanDto.partial();

export const ListPlansDto = z.object({
  page: z.string().optional().transform(v => (v !== undefined ? parseInt(v, 10) : undefined)),
  limit: z.string().optional().transform(v => (v !== undefined ? parseInt(v, 10) : undefined)),
  type: z.enum(['PROGRESSIVE', 'FIXED_DAILY', 'WEEKLY', 'MONTHLY', 'SABOTAY']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  isPublic: z.string().optional().transform((v) => v === 'true'),
  isFeatured: z.string().optional().transform((v) => v === 'true'),
});

export type CreatePlanDtoType = z.infer<typeof CreatePlanDto>;
export type UpdatePlanDtoType = z.infer<typeof UpdatePlanDto>;
