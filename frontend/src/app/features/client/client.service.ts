import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable, map } from 'rxjs';
import { Plan } from '../../core/models/plan.model';
import { Subscription, Payment, Transaction, Withdrawal, PaginatedResponse } from '../../core/models/payment.model';

@Injectable({ providedIn: 'root' })
export class ClientService extends ApiService {

  // ─── Plans ─────────────────────────────────────────────────
  getPublicPlans(params?: Record<string, any>): Observable<PaginatedResponse<Plan>> {
    return this.getPaginated<Plan>('/plans', params).pipe(map((r) => r.data));
  }

  getPlanById(id: string): Observable<Plan> {
    return this.get<Plan>(`/plans/${id}`).pipe(map((r) => r.data!));
  }

  // ─── Subscriptions ──────────────────────────────────────────
  getMySubscriptions(params?: Record<string, any>): Observable<PaginatedResponse<Subscription>> {
    return this.getPaginated<Subscription>('/subscriptions/me', params).pipe(map((r) => r.data));
  }

  getSubscriptionDetail(id: string): Observable<Subscription> {
    return this.get<Subscription>(`/subscriptions/${id}`).pipe(map((r) => r.data!));
  }

  subscribe(planId: string): Observable<Subscription> {
    return this.post<Subscription>('/subscriptions', { planId }).pipe(map((r) => r.data!));
  }

  cancelSubscription(id: string): Observable<any> {
    return this.patch(`/subscriptions/${id}/cancel`);
  }

  // ─── Payments ───────────────────────────────────────────────
  getMyPayments(params?: Record<string, any>): Observable<PaginatedResponse<Payment>> {
    return this.getPaginated<Payment>('/payments/my', params).pipe(map((r) => r.data));
  }

  createPayment(data: { subscriptionId: string; amount: number; method: string; dayNumber?: number }): Observable<Payment> {
    return this.post<Payment>('/payments', data).pipe(map((r) => r.data!));
  }

  // ─── Transactions ───────────────────────────────────────────
  getMyTransactions(params?: Record<string, any>): Observable<PaginatedResponse<Transaction>> {
    return this.getPaginated<Transaction>('/transactions/my', params).pipe(map((r) => r.data));
  }

  // ─── Withdrawals ────────────────────────────────────────────
  getMyWithdrawals(params?: Record<string, any>): Observable<PaginatedResponse<Withdrawal>> {
    return this.getPaginated<Withdrawal>('/withdrawals/my', params).pipe(map((r) => r.data));
  }

  requestWithdrawal(data: { subscriptionId: string; method: string; bankName?: string; accountNumber?: string; accountName?: string; phoneNumber?: string }): Observable<Withdrawal> {
    return this.post<Withdrawal>('/withdrawals', data).pipe(map((r) => r.data!));
  }

  // ─── Dashboard Stats ────────────────────────────────────────
  getDashboardStats(): Observable<any> {
    return this.get<any>('/users/me/dashboard').pipe(map((r) => r.data));
  }

  // ─── Penalties ──────────────────────────────────────────────
  getMyPenalties(params?: Record<string, any>): Observable<PaginatedResponse<any>> {
    return this.getPaginated<any>('/penalties/me', params).pipe(map((r) => r.data));
  }
}
