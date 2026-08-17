import { z } from 'zod';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const CreateClientDto = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z
    .string()
    .min(8, 'Mot de passe: minimum 8 caractères')
    .regex(passwordRule, 'Mot de passe: doit contenir majuscule, minuscule et chiffre'),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  phone: z.string().max(30).optional(),
  preferredLanguage: z.enum(['fr', 'ht']).default('fr'),
});

export const UpdateProfileDto = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  preferredLanguage: z.enum(['fr', 'ht']).optional(),
});

export const CreateAdminDto = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z
    .string()
    .min(8, 'Mot de passe: minimum 8 caractères')
    .regex(passwordRule, 'Mot de passe: doit contenir majuscule, minuscule et chiffre'),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  phone: z.string().max(30).optional(),
  preferredLanguage: z.enum(['fr', 'ht']).default('fr'),
});

export const UpdateKycStatusDto = z.object({
  kycStatus: z.enum(['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

export const UpdateUserStatusDto = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION']),
  reason: z.string().optional(),
});

export const ListUsersDto = z.object({
  page: z.string().optional().transform(v => (v !== undefined ? parseInt(v, 10) : undefined)),
  limit: z.string().optional().transform(v => (v !== undefined ? parseInt(v, 10) : undefined)),
  search: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'AGENT', 'CLIENT']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION']).optional(),
  sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
export type CreateClientDtoType = z.infer<typeof CreateClientDto>;
export type CreateAdminDtoType = z.infer<typeof CreateAdminDto>;
export type UpdateKycStatusDtoType = z.infer<typeof UpdateKycStatusDto>;
