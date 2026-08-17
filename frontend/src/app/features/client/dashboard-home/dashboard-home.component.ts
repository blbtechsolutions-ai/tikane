import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../client.service';
import { AuthService } from '../../../core/services/auth.service';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
  route?: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-8">
      <!-- Welcome -->
      <div class="page-header">
        <h1>Bonjour, {{ user?.firstName }} 👋</h1>
        <p>Voici un aperçu de votre activité sur Sabotay</p>
      </div>

      <!-- Stats Grid -->
      <div *ngIf="!loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div *ngFor="let card of stats; let i = index"
          class="tikane-card animate-on-enter cursor-pointer hover:-translate-y-1 transition-transform"
          [style.animation-delay]="i * 80 + 'ms'"
          [routerLink]="card.route">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium uppercase tracking-wider mb-3" style="color: var(--text-muted)">
                {{ card.label }}
              </p>
              <p class="text-2xl font-bold font-display" style="color: var(--text-primary)">{{ card.value }}</p>
            </div>
            <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              [style.background]="card.bgColor">
              <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div *ngFor="let _ of [1,2,3,4]" class="skeleton h-28 rounded-2xl"></div>
      </div>

      <!-- Recent Payments + Active Subs -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Payments -->
        <div class="tikane-card">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold" style="color: var(--text-primary)">Paiements récents</h3>
            <a routerLink="/dashboard/payments"
              class="text-xs text-purple-500 hover:text-purple-400 font-medium transition-colors">
              Voir tout →
            </a>
          </div>

          <div *ngIf="recentPayments.length === 0 && !loading"
            class="text-center py-8 text-sm" style="color: var(--text-muted)">
            Aucun paiement récent
          </div>

          <div class="space-y-3">
            <div *ngFor="let p of recentPayments"
              class="flex items-center justify-between py-2 border-b last:border-0"
              style="border-color: var(--surface-border)">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                  style="background: rgba(16,185,129,0.1)">
                  <mat-icon class="text-sm text-emerald-500">payments</mat-icon>
                </div>
                <div>
                  <p class="text-sm font-medium" style="color: var(--text-primary)">
                    {{ p.subscription?.plan?.name ?? 'Paiement' }}
                  </p>
                  <p class="text-xs" style="color: var(--text-muted)">
                    {{ p.createdAt | date:'dd/MM/yyyy' }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-emerald-500">
                  {{ p.amount | number }} HTG
                </p>
                <span [class]="'status-' + p.status" class="text-xs">{{ p.status }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="tikane-card">
          <h3 class="font-semibold mb-4" style="color: var(--text-primary)">Actions rapides</h3>
          <div class="grid grid-cols-2 gap-3">
            <a *ngFor="let action of quickActions" [routerLink]="action.route"
              class="flex flex-col items-center justify-center p-4 rounded-xl text-center transition-all hover:-translate-y-1 cursor-pointer"
              style="background: var(--surface-card); border: 1px solid var(--surface-border)">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                [style.background]="action.bg">
                <mat-icon [style.color]="action.color">{{ action.icon }}</mat-icon>
              </div>
              <span class="text-xs font-medium" style="color: var(--text-primary)">{{ action.label }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardHomeComponent implements OnInit {
  loading = true;
  stats: StatCard[] = [];
  recentPayments: any[] = [];

  quickActions = [
    { label: 'Souscrire un plan', icon: 'add_circle', route: '/dashboard/plans', bg: 'rgba(109,40,217,0.1)', color: '#6d28d9' },
    { label: 'Faire un paiement', icon: 'payment', route: '/dashboard/payments', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    { label: 'Mes carnets', icon: 'list_alt', route: '/dashboard/subscriptions', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    { label: 'Demander la touche', icon: 'account_balance_wallet', route: '/dashboard/withdrawals', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  ];

  constructor(
    private clientService: ClientService,
    public auth: AuthService,
  ) {}

  get user() { return this.auth.currentUser; }

  ngOnInit(): void {
    this.clientService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = [
          {
            label: 'Total Épargné',
            value: `${(data.totalPaid ?? data.totalInvested ?? 0).toLocaleString()} HTG`,
            icon: 'savings',
            color: '#6d28d9',
            bgColor: 'rgba(109,40,217,0.1)',
            route: '/dashboard/transactions',
          },
          {
            label: 'Plans Actifs',
            value: String(data.activeSubscriptions ?? 0),
            icon: 'trending_up',
            color: '#10b981',
            bgColor: 'rgba(16,185,129,0.1)',
            route: '/dashboard/subscriptions',
          },
          {
            label: 'Paiements en attente',
            value: String(data.pendingPayments ?? 0),
            icon: 'schedule',
            color: '#f59e0b',
            bgColor: 'rgba(245,158,11,0.1)',
            route: '/dashboard/payments',
          },
          {
            label: 'Touches en attente',
            value: String(data.pendingWithdrawals ?? 0),
            icon: 'account_balance_wallet',
            color: '#3b82f6',
            bgColor: 'rgba(59,130,246,0.1)',
            route: '/dashboard/withdrawals',
          },
        ];
        this.recentPayments = data.recentPayments ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }
}
