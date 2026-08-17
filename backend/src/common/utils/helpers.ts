import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generate a unique reference number: TIK-PAY-20240115-XXXXX
 */
export function generateReference(prefix: 'PAY' | 'TXN' | 'WIT' | 'SUB' | 'DOS' | 'TCH'): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TIK-${prefix}-${date}-${suffix}`;
}

/**
 * Generate agent code: AGT-XXXXX
 */
export function generateAgentCode(): string {
  return `AGT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

/**
 * Generate referral code: 6-char alphanumeric
 */
export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Paginate query helper
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginationParams(params: PaginationParams): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Calculate progressive plan total
 * Sum = n/2 * (2a + (n-1)d) where a=startAmount, d=increment, n=days
 */
export function calculateProgressiveTotal(
  startAmount: number,
  increment: number,
  days: number,
): number {
  return (days / 2) * (2 * startAmount + (days - 1) * increment);
}

/**
 * Calculate amount for a specific day in progressive plan
 */
export function calculateProgressiveDayAmount(
  startAmount: number,
  increment: number,
  day: number,
): number {
  return startAmount + (day - 1) * increment;
}

/**
 * Calculate sabotay (with interest) final amount
 */
export function calculateSabotayAmount(
  principal: number,
  rate: number,
  type: 'SIMPLE' | 'COMPOUND',
  periods: number = 1,
): number {
  if (type === 'SIMPLE') {
    return principal * (1 + (rate / 100) * periods);
  }
  return principal * Math.pow(1 + rate / 100, periods);
}

/**
 * Convert Decimal to number safely
 */
export function toNumber(value: Decimal | number | string): number {
  if (typeof value === 'number') return value;
  return parseFloat(value.toString());
}

/**
 * Format amount in HTG
 */
export function formatHTG(amount: number): string {
  return new Intl.NumberFormat('fr-HT', {
    style: 'currency',
    currency: 'HTG',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Add working days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Mask sensitive data for logs
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return `${local.substring(0, 2)}***@${domain}`;
}
