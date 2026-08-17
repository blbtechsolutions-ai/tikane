import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Plan } from '../../core/models/plan.model';
import { PaginatedResponse, Payment, Subscription } from '../../core/models/payment.model';
import { User } from '../../core/models/user.model';

export interface AgentWorkspaceSummary {
  agent: {
    id: string;
    agentCode: string;
    commissionRate: number;
    totalCollected: number;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  };
  pendingCommissions: number;
  activeCarnets: number;
  readyTouches: number;
  recentCollections: Payment[];
}

@Injectable({ providedIn: 'root' })
export class AgentService extends ApiService {
  getWorkspace(): Observable<AgentWorkspaceSummary> {
    return this.get<AgentWorkspaceSummary>('/agents/me/workspace').pipe(map((r) => r.data!));
  }

  listClients(params?: Record<string, any>): Observable<PaginatedResponse<User>> {
    return this.getPaginated<User>('/users', { role: 'CLIENT', status: 'ACTIVE', ...params }).pipe(map((r) => r.data));
  }

  listPlans(params?: Record<string, any>): Observable<PaginatedResponse<Plan>> {
    return this.getPaginated<Plan>('/plans', params).pipe(map((r) => r.data));
  }

  listMyCarnets(params?: Record<string, any>): Observable<PaginatedResponse<Subscription>> {
    return this.getPaginated<Subscription>('/subscriptions', params).pipe(map((r) => r.data));
  }

  createCarnet(data: {
    userId: string;
    planId: string;
    startDate?: string;
    beneficiaryName?: string;
    beneficiaryPhone?: string;
    beneficiarySignature?: string;
  }): Observable<Subscription> {
    return this.post<Subscription>('/subscriptions/admin-create', data).pipe(map((r) => r.data!));
  }

  collectPayment(data: {
    subscriptionId: string;
    amount: number;
    method: string;
    dayNumber?: number;
    externalReference?: string;
    notes?: string;
  }): Observable<Payment> {
    return this.post<Payment>('/payments/collect', data).pipe(map((r) => r.data!));
  }

  markTouched(id: string, data?: { touchReference?: string; notes?: string }): Observable<Subscription> {
    return this.patch<Subscription>(`/subscriptions/${id}/touch`, data ?? {}).pipe(map((r) => r.data!));
  }
}