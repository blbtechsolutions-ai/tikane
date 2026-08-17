import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../client.service';
import { Subscription } from '../../../core/models/payment.model';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Mes carnets</h1>
        <p>Suivez vos dossiers, vos versements et votre statut de touche</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="space-y-4">
        <div *ngFor="let sub of subscriptions"
          class="tikane-card hover:shadow-card-hover transition-shadow cursor-pointer"
          [routerLink]="['/dashboard/subscriptions', sub.id]">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold truncate" style="color: var(--text-primary)">
                  {{ sub.plan?.name ?? 'Plan' }}
                </h3>
                <span [class]="'status-' + sub.status">{{ sub.status }}</span>
                <span class="text-[11px] px-2 py-0.5 rounded-full"
                  [style.background]="touchBg(sub.touchStatus)"
                  [style.color]="touchColor(sub.touchStatus)">
                  {{ sub.touchStatus || 'PENDING' }}
                </span>
              </div>
              <p class="text-xs mb-1" style="color: var(--text-muted)">
                {{ sub.dossierNumber || sub.subscriptionNumber }}
              </p>
              <p class="text-xs mb-3" style="color: var(--text-muted)">
                Bénéficiaire: {{ sub.beneficiaryName || '—' }}
                <span *ngIf="sub.touchReference"> · Réf. touche: {{ sub.touchReference }}</span>
              </p>

              <!-- Progress -->
              <div class="mb-2">
                <div class="flex justify-between text-xs mb-1" style="color: var(--text-muted)">
                  <span>Progression</span>
                  <span>{{ sub.currentDay }}/{{ sub.totalDays }} jours</span>
                </div>
                <div class="tikane-progress">
                  <div class="tikane-progress-bar"
                    [style.width]="(sub.currentDay / sub.totalDays * 100) + '%'"></div>
                </div>
              </div>

              <div class="flex flex-wrap gap-3 text-xs mb-3" style="color: var(--text-muted)">
                <span *ngIf="sub.withdrawalAllowedAt">Touche dispo: {{ sub.withdrawalAllowedAt | date:'dd/MM/yyyy' }}</span>
                <span *ngIf="sub.plan?.finalAmount">Montant à toucher: {{ sub.plan?.finalAmount | number }} HTG</span>
              </div>

              <div class="grid grid-cols-3 gap-2 mt-3">
                <div class="text-center">
                  <p class="text-xs font-bold text-emerald-500">{{ sub.totalPaid | number }}</p>
                  <p class="text-xs" style="color: var(--text-muted)">Payé (HTG)</p>
                </div>
                <div class="text-center">
                  <p class="text-xs font-bold text-amber-500">{{ sub.remainingAmount | number }}</p>
                  <p class="text-xs" style="color: var(--text-muted)">Reste (HTG)</p>
                </div>
                <div class="text-center">
                  <p class="text-xs font-bold text-blue-500">{{ sub.totalDue | number }}</p>
                  <p class="text-xs" style="color: var(--text-muted)">Total (HTG)</p>
                </div>
              </div>
            </div>

            <mat-icon style="color: var(--text-muted)" class="flex-shrink-0">chevron_right</mat-icon>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && subscriptions.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">📊</div>
        <h3 class="font-semibold mb-2" style="color: var(--text-primary)">Aucune souscription active</h3>
        <p class="text-sm mb-4" style="color: var(--text-muted)">Commencez par souscrire à un plan</p>
        <a routerLink="/dashboard/plans"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
          style="background: #1e40af">
          <mat-icon class="text-base">savings</mat-icon>
          Voir les plans
        </a>
      </div>
    </div>
  `,
})
export class SubscriptionsComponent implements OnInit {
  loading = true;
  subscriptions: Subscription[] = [];

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getMySubscriptions().subscribe({
      next: (data) => { this.subscriptions = data.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  touchBg(status?: string): string {
    switch (status) {
      case 'READY':
        return 'rgba(245, 158, 11, 0.15)';
      case 'TOUCHED':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(107, 114, 128, 0.15)';
    }
  }

  touchColor(status?: string): string {
    switch (status) {
      case 'READY':
        return '#f59e0b';
      case 'TOUCHED':
        return '#10b981';
      default:
        return 'var(--text-secondary)';
    }
  }
}
