export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  kycStatus: KycStatus;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  preferredLanguage: 'fr' | 'ht';
  referralCode?: string;
  createdAt: string;
  _count?: { subscriptions: number; referrals: number };
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'CLIENT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';
export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}
