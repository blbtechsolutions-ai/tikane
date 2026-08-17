import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../admin.service';

type Period = 'daily' | 'weekly' | 'monthly' | 'annual';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Rapports</h1>
        <p>Statistiques financières et opérationnelles par période</p>
      </div>

      <!-- Period selector -->
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium" style="color: var(--text-secondary)">Période :</label>
        <div class="flex gap-2">
          <button *ngFor="let p of periods" (click)="selectPeriod(p.value)"
            mat-flat-button
            [style]="period === p.value
              ? 'background: var(--color-primary); color: white; border-radius: 0.75rem'
              : 'background: var(--surface-card); color: var(--text-secondary); border-radius: 0.75rem; border: 1px solid var(--surface-border)'">
            {{ p.label }}
          </button>
        </div>
        <button mat-icon-button (click)="load()" [disabled]="loading" title="Actualiser">
          <mat-icon class="text-base">refresh</mat-icon>
        </button>
      </div>

      <div *ngIf="loading" class="flex justify-center py-20"><mat-spinner diameter="48"></mat-spinner></div>

      <ng-container *ngIf="!loading && report">

        <!-- Date range -->
        <div class="text-xs font-mono" style="color: var(--text-muted)">
          {{ report.startDate | date:'dd/MM/yyyy' }} → {{ report.endDate | date:'dd/MM/yyyy' }}
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <div *ngFor="let card of summaryCards" class="tikane-card">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium" style="color: var(--text-muted)">{{ card.label }}</span>
              <mat-icon class="text-base" [style]="'color:' + card.color">{{ card.icon }}</mat-icon>
            </div>
            <div class="text-2xl font-bold" [style]="'color:' + card.color">
              {{ card.isCurrency ? (card.value | number:'1.0-0') + ' HTG' : card.value }}
            </div>
          </div>
        </div>

        <!-- Trend -->
        <div *ngIf="report.trend && report.trend.length" class="tikane-card overflow-hidden">
          <h3 class="font-semibold text-sm mb-4" style="color: var(--text-primary)">Tendance — revenus</h3>
          <div class="overflow-x-auto">
            <table class="tikane-table">
              <thead>
                <tr>
                  <th>Période</th>
                  <th class="text-right">Revenus (HTG)</th>
                  <th class="text-right">Paiements</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of report.trend">
                  <td class="text-xs font-mono" style="color: var(--text-secondary)">{{ row.label }}</td>
                  <td class="text-right font-semibold text-emerald-500">{{ row.revenue | number:'1.0-0' }}</td>
                  <td class="text-right text-sm" style="color: var(--text-secondary)">{{ row.count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </ng-container>

      <div *ngIf="!loading && !report" class="text-center py-12 text-sm" style="color: var(--text-muted)">
        Aucune donnée disponible pour cette période
      </div>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  report: any = null;
  loading = false;
  period: Period = 'monthly';

  periods = [
    { value: 'daily' as Period, label: 'Jour' },
    { value: 'weekly' as Period, label: 'Semaine' },
    { value: 'monthly' as Period, label: 'Mois' },
    { value: 'annual' as Period, label: 'Année' },
  ];

  get summaryCards(): any[] {
    if (!this.report?.summary) return [];
    const s = this.report.summary;
    return [
      { label: 'Revenus', value: s.revenue, icon: 'payments', color: '#10b981', isCurrency: true },
      { label: 'Paiements', value: s.paymentsCount, icon: 'receipt', color: '#6366f1', isCurrency: false },
      { label: 'Nouveaux clients', value: s.newClients, icon: 'person_add', color: '#3b82f6', isCurrency: false },
      { label: 'Nouvelles souscriptions', value: s.newSubscriptions, icon: 'library_add', color: '#8b5cf6', isCurrency: false },
      { label: 'Souscriptions terminées', value: s.completedSubscriptions, icon: 'task_alt', color: '#14b8a6', isCurrency: false },
      { label: 'Touchements en attente', value: s.pendingWithdrawals, icon: 'pending', color: '#f59e0b', isCurrency: false },
      { label: 'Montant touchements', value: s.withdrawalsAmount, icon: 'account_balance_wallet', color: '#0ea5e9', isCurrency: true },
      { label: 'Pénalités', value: s.penaltiesAmount, icon: 'warning', color: '#ef4444', isCurrency: true },
      { label: 'Commissions', value: s.commissions, icon: 'percent', color: '#f97316', isCurrency: true },
    ];
  }

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.load(); }

  selectPeriod(p: Period): void {
    this.period = p;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.adminService.getReport(this.period).subscribe({
      next: (data) => { this.report = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
