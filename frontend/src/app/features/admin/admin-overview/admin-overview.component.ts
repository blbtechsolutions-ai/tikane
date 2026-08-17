import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../admin.service';

interface StatCard { label: string; value: string | number; icon: string; color: string; bg: string; delta?: string; }

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-8">
      <div class="page-header">
        <h1>Tableau de bord administrateur</h1>
        <p>Vue globale de la plateforme Sabotay</p>
      </div>

      <!-- Stats grid -->
      <div *ngIf="!loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div *ngFor="let s of stats; let i = index"
          class="tikane-card animate-on-enter"
          [style.animation-delay]="i * 60 + 'ms'">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium uppercase tracking-wider mb-3" style="color: var(--text-muted)">{{ s.label }}</p>
              <p class="text-3xl font-bold font-display" style="color: var(--text-primary)">{{ s.value }}</p>
              <p *ngIf="s.delta" class="text-xs mt-1 text-emerald-500">{{ s.delta }}</p>
            </div>
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" [style.background]="s.bg">
              <mat-icon [style.color]="s.color">{{ s.icon }}</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div *ngFor="let _ of [1,2,3,4]" class="skeleton h-32 rounded-2xl"></div>
      </div>

      <!-- Quick links -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <!-- Pending payments -->
        <div class="tikane-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold" style="color: var(--text-primary)">Paiements en attente</h3>
            <a routerLink="/admin/payments" class="text-xs text-purple-500 font-medium">Voir tout →</a>
          </div>
          <div class="text-4xl font-bold text-amber-500 mb-1">{{ statValue(5) }}</div>
          <p class="text-sm" style="color: var(--text-muted)">Paiements à valider</p>
        </div>

        <!-- Pending withdrawals -->
        <div class="tikane-card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold" style="color: var(--text-primary)">Touches en attente</h3>
            <a routerLink="/admin/withdrawals" class="text-xs text-purple-500 font-medium">Gérer →</a>
          </div>
          <div class="text-4xl font-bold text-red-500 mb-1">{{ statValue(6) }}</div>
          <p class="text-sm" style="color: var(--text-muted)">Demandes de touche</p>
        </div>

        <!-- System health -->
        <div class="tikane-card">
          <h3 class="font-semibold mb-3" style="color: var(--text-primary)">État du système</h3>
          <div *ngIf="health" class="space-y-2">
            <div *ngFor="let item of healthItems()" class="flex items-center justify-between text-sm">
              <span style="color: var(--text-secondary)">{{ item.label }}</span>
              <span [class]="item.ok ? 'text-emerald-500' : 'text-red-400'" class="font-semibold">
                {{ item.ok ? '✓ OK' : '✗ Erreur' }}
              </span>
            </div>
            <div *ngIf="health.recentAuditEvents !== undefined" class="flex items-center justify-between text-sm">
              <span style="color: var(--text-secondary)">Événements récents</span>
              <span class="font-semibold" style="color: var(--text-primary)">{{ health.recentAuditEvents }}</span>
            </div>
          </div>
          <div *ngIf="!health" class="text-sm" style="color: var(--text-muted)">Chargement...</div>
        </div>
      </div>
    </div>
  `,
})
export class AdminOverviewComponent implements OnInit {
  loading = true;
  stats: StatCard[] = [];
  health: any = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getGlobalStats().subscribe({
      next: (data) => {
        this.stats = [
          { label: 'Total clients', value: data.totalUsers ?? 0, icon: 'people', color: '#6d28d9', bg: 'rgba(109,40,217,0.1)', delta: `+${data.newUsersToday ?? 0} aujourd'hui` },
          { label: 'Souscriptions actives', value: data.activeSubscriptions ?? 0, icon: 'trending_up', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Revenus totaux', value: `${(data.totalRevenue ?? 0).toLocaleString()} HTG`, icon: 'attach_money', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Paiements aujourd\'hui', value: data.paymentsToday ?? 0, icon: 'payment', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Plans complétés', value: data.completedSubscriptions ?? 0, icon: 'check_circle', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Paiements en attente', value: data.pendingPayments ?? 0, icon: 'schedule', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Touches en attente', value: data.pendingWithdrawals ?? 0, icon: 'account_balance_wallet', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });

    this.adminService.getSystemHealth().subscribe({
      next: (data) => { this.health = data; },
    });
  }

  healthItems(): { label: string; ok: boolean }[] {
    if (!this.health) return [];
    const normalizeStatus = (value: unknown): boolean =>
      value === true || value === 'connected' || value === 'OK';

    const items: { label: string; ok: boolean }[] = [];

    if (this.health.database !== undefined) {
      items.push({ label: 'Base de données', ok: normalizeStatus(this.health.database) });
    }
    if (this.health.redis !== undefined) {
      items.push({ label: 'Redis Cache', ok: normalizeStatus(this.health.redis) });
    }
    if (this.health.storage !== undefined) {
      items.push({ label: 'Stockage S3', ok: normalizeStatus(this.health.storage) });
    }

    return items;
  }

  statValue(index: number): string | number {
    return this.stats[index]?.value ?? '—';
  }
}
