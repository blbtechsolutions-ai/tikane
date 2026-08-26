import { User } from './user.model';

export interface Payment {
  id: string;
  referenceNumber: string;
  subscriptionId: string;
  userId: string;
  agentId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  dayNumber?: number;
  scheduledDate?: string;
  paidAt?: string;
  externalReference?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  subscription?: {
    subscriptionNumber: string;
    dossierNumber?: string;
    plan: { name: string; type: string };
  };
}

export interface SubscriptionProgressItem {
  dayNumber: number;
  amount: number;
  label?: string;
  status: 'PAID' | 'LATE' | 'PENDING';
  paidAt?: string | null;
  paymentRef?: string | null;
}

export interface SubscriptionPenalty {
  id: string;
  amount: number;
  reason: string;
  dayNumber?: number;
  isPaid: boolean;
  createdAt: string;
}

export interface SubscriptionPlanSummary {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  registrationFee?: number;
  caNeetFee?: number;
  finalAmount?: number;
}

export interface SubscriptionOwnerSummary extends Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'> {}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  dossierNumber?: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  touchStatus?: TouchStatus;
  touchReference?: string;
  touchedAt?: string;
  touchedBy?: string;
  startDate: string;
  endDate: string;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  totalPaid: number;
  totalDue: number;
  remainingAmount: number;
  totalPenalties: number;
  currentDay: number;
  totalDays: number;
  nextPaymentAmount?: number | null;
  nextPaymentDayNumber?: number | null;
  missedPayments: number;
  latePayments: number;
  withdrawalAllowedAt?: string;
  createdAt: string;
  beneficiaryName?: string;
  beneficiaryPhone?: string;
  beneficiarySignature?: string;
  plan?: SubscriptionPlanSummary;
  user?: SubscriptionOwnerSummary;
  payments?: Payment[];
  progress?: SubscriptionProgressItem[];
  penalties?: SubscriptionPenalty[];
  withdrawals?: Withdrawal[];
}

export interface Transaction {
  id: string;
  transactionRef: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  description?: string;
  processedAt?: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  referenceNumber: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  method: PaymentMethod;
  status: WithdrawalStatus;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  phoneNumber?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  subscription?: {
    subscriptionNumber: string;
    dossierNumber?: string;
    touchReference?: string;
    plan?: {
      name: string;
      type: string;
    };
  };
}

export type PaymentMethod = 'MONCASH' | 'NATCASH' | 'BANK_TRANSFER' | 'CASH' | 'AGENT_COLLECTION' | 'INTERNAL_CREDIT';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type SubscriptionStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED' | 'DEFAULTED';
export type TransactionType = 'PAYMENT_IN' | 'WITHDRAWAL' | 'PENALTY' | 'COMMISSION' | 'REFUND' | 'ADJUSTMENT' | 'INTEREST';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REVERSED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
export type TouchStatus = 'PENDING' | 'READY' | 'TOUCHED';

export interface PaginatedResponse<T> {
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

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}
