export interface Plan {
  id: string;
  name: string;
  nameCreole?: string;
  description?: string;
  descriptionCreole?: string;
  type: PlanType;
  status: PlanStatus;
  currency: string;
  durationDays: number;
  startAmount: number;
  incrementAmount?: number;
  fixedAmount?: number;
  interestRate?: number;
  interestType?: 'SIMPLE' | 'COMPOUND';
  registrationFee: number;
  caNeetFee: number;
  platformFeeRate: number;
  agentCommissionRate: number;
  withdrawalDelayDays: number;
  gracePeriodDays: number;
  latePenaltyRate: number;
  maxMissedPayments: number;
  totalAmount: number;
  finalAmount: number;
  isPublic: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  createdAt: string;
  planSchedules?: PlanSchedule[];
  _count?: { subscriptions: number };
}

export interface PlanSchedule {
  id: string;
  planId: string;
  dayNumber: number;
  amount: number;
  label: string;
}

export type PlanType = 'PROGRESSIVE' | 'FIXED_DAILY' | 'WEEKLY' | 'MONTHLY' | 'SABOTAY' | 'SAVINGS';
export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  PROGRESSIVE: 'Kompas progressif',
  FIXED_DAILY: 'Sòl journalier fixe',
  WEEKLY: 'Sòl hebdomadaire',
  MONTHLY: 'Sòl mensuel',
  SABOTAY: 'Sabotay / Carnet journalier',
  SAVINGS: 'Epargne libre',
};

export const PLAN_TYPE_LABELS_HT: Record<PlanType, string> = {
  PROGRESSIVE: 'KOMPAS pwogresif',
  FIXED_DAILY: 'Sòl fiks chak jou',
  WEEKLY: 'Sòl chak semèn',
  MONTHLY: 'Sòl chak mwa',
  SABOTAY: 'Sabotay / Kanè chak jou',
  SAVINGS: 'Epay lib',
};
