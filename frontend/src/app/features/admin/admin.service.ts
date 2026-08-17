import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Observable, map } from 'rxjs';
import { User } from '../../core/models/user.model';
import { Plan } from '../../core/models/plan.model';
import { Payment, Withdrawal, PaginatedResponse } from '../../core/models/payment.model';

@Injectable({ providedIn: 'root' })
export class AdminService extends ApiService {

  // ─── Dashboard ──────────────────────────────────────────────
  getGlobalStats(): Observable<any> {
    return this.get<any>('/admin/stats').pipe(map((r) => r.data));
  }

  getRevenueChart(period: 'week' | 'month' | 'year' = 'month'): Observable<any[]> {
    return this.get<any[]>(`/admin/charts/revenue?period=${period}`).pipe(map((r) => r.data ?? []));
  }

  getPopularPlans(): Observable<any[]> {
    return this.get<any[]>('/admin/charts/popular-plans').pipe(map((r) => r.data ?? []));
  }

  getSystemHealth(): Observable<any> {
    return this.get<any>('/admin/system/health').pipe(map((r) => r.data));
  }

  // ─── Users ──────────────────────────────────────────────────
  listUsers(params?: Record<string, any>): Observable<PaginatedResponse<User>> {
    return this.getPaginated<User>('/users', params).pipe(map((r) => r.data));
  }

  createClient(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    preferredLanguage?: 'fr' | 'ht';
  }): Observable<User> {
    return this.post<User>('/users', data).pipe(map((r) => r.data!));
  }

  createAdmin(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    preferredLanguage?: 'fr' | 'ht';
  }): Observable<User> {
    return this.post<User>('/users/create-admin', data).pipe(map((r) => r.data!));
  }

  updateKycStatus(id: string, kycStatus: string, reason?: string): Observable<any> {
    return this.patch<any>(`/users/${id}/kyc`, { kycStatus, reason }).pipe(map((r) => r.data!));
  }

  createAgentWithUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    commissionRate?: number;
    zone?: string;
    preferredLanguage?: 'fr' | 'ht';
  }): Observable<any> {
    return this.post<any>('/agents', data).pipe(map((r) => r.data!));
  }

  getUserById(id: string): Observable<User> {
    return this.get<User>(`/users/${id}`).pipe(map((r) => r.data!));
  }

  updateUserStatus(id: string, status: string, reason?: string): Observable<User> {
    return this.patch<User>(`/users/${id}/status`, { status, reason }).pipe(map((r) => r.data!));
  }

  deleteUser(id: string): Observable<any> {
    return this.delete(`/users/${id}`);
  }

  // ─── Plans ──────────────────────────────────────────────────
  listAllPlans(params?: Record<string, any>): Observable<PaginatedResponse<Plan>> {
    return this.getPaginated<Plan>('/plans', params).pipe(map((r) => r.data));
  }

  listAllSubscriptions(params?: Record<string, any>): Observable<PaginatedResponse<any>> {
    return this.getPaginated<any>('/subscriptions', params).pipe(map((r) => r.data));
  }

  getSubscriptionDetail(id: string): Observable<any> {
    return this.get<any>(`/subscriptions/${id}`).pipe(map((r) => r.data!));
  }

  createManagedSubscription(data: {
    userId: string;
    planId: string;
    agentId?: string;
    startDate?: string;
    beneficiaryName?: string;
    beneficiaryPhone?: string;
    beneficiarySignature?: string;
  }): Observable<any> {
    return this.post<any>('/subscriptions/admin-create', data).pipe(map((r) => r.data!));
  }

  markSubscriptionTouched(id: string, data?: { touchReference?: string; notes?: string }): Observable<any> {
    return this.patch<any>(`/subscriptions/${id}/touch`, data ?? {}).pipe(map((r) => r.data!));
  }

  createPlan(data: any): Observable<Plan> {
    return this.post<Plan>('/plans', data).pipe(map((r) => r.data!));
  }

  updatePlan(id: string, data: any): Observable<Plan> {
    return this.put<Plan>(`/plans/${id}`, data).pipe(map((r) => r.data!));
  }

  updatePlanStatus(id: string, status: string): Observable<Plan> {
    return this.patch<Plan>(`/plans/${id}/status`, { status }).pipe(map((r) => r.data!));
  }

  deletePlan(id: string): Observable<any> {
    return this.delete(`/plans/${id}`);
  }

  getSchedulePreview(data: any): Observable<{ schedule: any[]; totalAmount: number; finalAmount: number }> {
    return this.post<{ schedule: any[]; totalAmount: number; finalAmount: number }>('/plans/preview-schedule', data)
      .pipe(map((r) => r.data!));
  }

  // ─── Payments ───────────────────────────────────────────────
  listAllPayments(params?: Record<string, any>): Observable<PaginatedResponse<Payment>> {
    return this.getPaginated<Payment>('/payments', params).pipe(map((r) => r.data));
  }

  confirmPayment(id: string): Observable<Payment> {
    return this.patch<Payment>(`/payments/${id}/confirm`).pipe(map((r) => r.data!));
  }

  adminCollectPayment(data: { subscriptionId: string; amount: number; dayNumber?: number; notes?: string }): Observable<Payment> {
    return this.post<Payment>('/payments/admin-collect', { ...data, method: 'CASH' }).pipe(map((r) => r.data!));
  }

  rejectPayment(id: string, reason: string): Observable<Payment> {
    return this.patch<Payment>(`/payments/${id}/reject`, { reason }).pipe(map((r) => r.data!));
  }

  // ─── Withdrawals ────────────────────────────────────────────
  listAllWithdrawals(params?: Record<string, any>): Observable<PaginatedResponse<Withdrawal>> {
    return this.getPaginated<Withdrawal>('/withdrawals', params).pipe(map((r) => r.data));
  }

  approveWithdrawal(id: string): Observable<Withdrawal> {
    return this.patch<Withdrawal>(`/withdrawals/${id}/approve`).pipe(map((r) => r.data!));
  }

  rejectWithdrawal(id: string, reason: string): Observable<Withdrawal> {
    return this.patch<Withdrawal>(`/withdrawals/${id}/reject`, { reason }).pipe(map((r) => r.data!));
  }

  completeWithdrawal(id: string, externalReference?: string): Observable<Withdrawal> {
    return this.patch<Withdrawal>(`/withdrawals/${id}/complete`, { externalReference }).pipe(map((r) => r.data!));
  }

  // ─── Agents ─────────────────────────────────────────────────
  listAgents(params?: Record<string, any>): Observable<PaginatedResponse<any>> {
    return this.getPaginated<any>('/agents', params).pipe(map((r) => r.data));
  }

  createAgent(data: { userId: string; zone?: string; commissionRate?: number }): Observable<any> {
    return this.post<any>('/agents', data).pipe(map((r) => r.data!));
  }

  // ─── Audit Logs ─────────────────────────────────────────────
  getAuditLogs(params?: Record<string, any>): Observable<PaginatedResponse<any>> {
    return this.getPaginated<any>('/admin/audit-logs', params).pipe(map((r) => r.data));
  }

  exportUsersCSV(): Observable<any> {
    return this.get('/admin/export/users');
  }

  // ─── Penalties ──────────────────────────────────────────────
  listPenalties(params?: Record<string, any>): Observable<PaginatedResponse<any>> {
    return this.getPaginated<any>('/penalties', params).pipe(map((r) => r.data));
  }

  addPenalty(data: {
    subscriptionId: string;
    type: string;
    amount: number;
    reason: string;
    dayNumber?: number;
  }): Observable<any> {
    return this.post<any>('/penalties', data).pipe(map((r) => r.data!));
  }

  updatePenalty(id: string, data: { amount?: number; reason?: string }): Observable<any> {
    return this.patch<any>(`/penalties/${id}`, data).pipe(map((r) => r.data!));
  }

  waivePenalty(id: string): Observable<any> {
    return this.patch<any>(`/penalties/${id}/waive`).pipe(map((r) => r.data!));
  }

  // ─── Reports ────────────────────────────────────────────────
  getReport(period: 'daily' | 'weekly' | 'monthly' | 'annual'): Observable<any> {
    return this.get<any>(`/admin/reports?period=${period}`).pipe(map((r) => r.data));
  }

  // ─── Settings ───────────────────────────────────────────────
  getSettings(group?: string): Observable<any[]> {
    return this.get<any[]>('/admin/settings', group ? { group } : undefined).pipe(map((r) => r.data ?? []));
  }

  upsertSetting(key: string, value: string): Observable<any> {
    return this.put<any>(`/admin/settings/${key}`, { value }).pipe(map((r) => r.data!));
  }

  bulkUpsertSettings(settings: { key: string; value: string }[]): Observable<any> {
    return this.post<any>('/admin/settings/bulk', { settings }).pipe(map((r) => r.data));
  }

  // ─── Admin user management ───────────────────────────────────
  adminResetUserPassword(userId: string): Observable<{ token: string }> {
    return this.post<{ token: string }>(`/users/${userId}/reset-password`, {}).pipe(map((r) => r.data!));
  }
}
