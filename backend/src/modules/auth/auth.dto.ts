import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginDto:
 *       type: object
 *       required: [email, password]
 */
export const LoginDto = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email().toLowerCase(),
});

export const ResetPasswordDto = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

export const VerifyEmailDto = z.object({
  token: z.string().min(1),
});

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

export type LoginDtoType = z.infer<typeof LoginDto>;
export type RefreshTokenDtoType = z.infer<typeof RefreshTokenDto>;
