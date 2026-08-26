import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../client.service';
import { Subscription, SubscriptionProgressItem } from '../../../core/models/payment.model';
import { CarnetCalendarComponent } from '../../../shared/carnet-calendar/carnet-calendar.component';

@Component({
  selector: 'app-subscription-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule, CarnetCalendarComponent],
  template: `
    <div class="animate-fade-in space-y-6" *ngIf="!loading; else loadingTpl">
      <!-- Back + header -->
      <div class="flex items-center gap-3">
        <a routerLink="/dashboard/subscriptions"
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:opacity-80"
          style="background: var(--surface-card); border: 1px solid var(--surface-border)">
          <mat-icon style="color: var(--text-secondary)" class="text-base">arrow_back</mat-icon>
        </a>
        <div>
          <h1 class="text-xl font-bold font-display" style="color: var(--text-primary)">
            {{ sub?.plan?.name }}
          </h1>
          <p class="text-xs" style="color: var(--text-muted)">
            {{ sub?.dossierNumber || sub?.subscriptionNumber }}
            <span *ngIf="sub?.beneficiaryName"> · {{ sub?.beneficiaryName }}</span>
          </p>
        </div>
        <span *ngIf="sub" [class]="'status-' + sub.status" class="ml-auto">{{ sub.status }}</span>
      </div>

      <!-- Progress overview -->
      <div class="tikane-card" *ngIf="sub">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div class="text-center">
            <p class="text-2xl font-bold text-emerald-500">{{ sub.totalPaid | number }}</p>
            <p class="text-xs mt-1" style="color: var(--text-muted)">Payé (HTG)</p>
          </div>
          <div class="text-center" *ngIf="!isSavings">
            <p class="text-2xl font-bold text-amber-500">{{ sub.remainingAmount | number }}</p>
            <p class="text-xs mt-1" style="color: var(--text-muted)">Restant (HTG)</p>
          </div>
          <div class="text-center" *ngIf="!isSavings">
            <p class="text-2xl font-bold text-blue-500">{{ sub.currentDay }}</p>
            <p class="text-xs mt-1" style="color: var(--text-muted)">Jours payés</p>
          </div>
          <div class="text-center" *ngIf="!isSavings">
            <p class="text-2xl font-bold text-red-400">{{ sub.missedPayments }}</p>
            <p class="text-xs mt-1" style="color: var(--text-muted)">Manqués</p>
          </div>
        </div>

        <div *ngIf="!isSavings" class="mb-1 flex justify-between text-xs" style="color: var(--text-muted)">
          <span>Progression: {{ sub.currentDay }}/{{ sub.totalDays }} jours</span>
          <span>{{ (sub.currentDay / sub.totalDays * 100) | number:'1.0-0' }}%</span>
        </div>
        <div *ngIf="!isSavings" class="tikane-progress h-3">
          <div class="tikane-progress-bar"
            [style.width]="(sub.currentDay / sub.totalDays * 100) + '%'"></div>
        </div>

        <div class="mt-4 flex flex-wrap gap-3 text-xs" style="color: var(--text-muted)">
          <span>📅 Début: {{ sub.startDate | date:'dd/MM/yyyy' }}</span>
          <span *ngIf="!isSavings">📅 Fin: {{ sub.endDate | date:'dd/MM/yyyy' }}</span>
          <span *ngIf="sub.nextPaymentDate">⏭ Prochain: {{ sub.nextPaymentDate | date:'dd/MM/yyyy' }}</span>
          <span *ngIf="sub.withdrawalAllowedAt && !isSavings">💰 Touche disponible dès: {{ sub.withdrawalAllowedAt | date:'dd/MM/yyyy' }}</span>
          <span *ngIf="sub.plan?.finalAmount && !isSavings">🎯 Montant à toucher: {{ sub.plan?.finalAmount | number }} HTG</span>
          <span *ngIf="isSavings">Solde epargne: {{ sub.totalPaid | number }} HTG</span>
          <span *ngIf="sub.plan?.registrationFee">🗂 Frais dossier: {{ sub.plan?.registrationFee | number }} HTG</span>
          <span *ngIf="sub.plan?.caNeetFee">📘 Frais carnet: {{ sub.plan?.caNeetFee | number }} HTG</span>
          <span *ngIf="sub.touchStatus">🏁 Statut touche: {{ sub.touchStatus }}</span>
          <span *ngIf="sub.touchReference">🧾 Réf. touche: {{ sub.touchReference }}</span>
          <span *ngIf="sub.touchedAt">✅ Touché le: {{ sub.touchedAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>

      <!-- Carnet calendrier de progression -->
      <div class="tikane-card" *ngIf="sub?.progress?.length && !isSavings">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="font-semibold" style="color: var(--text-primary)">Carnet de versements</h3>
            <p class="text-xs mt-0.5" style="color: var(--text-muted)">
              Dossier {{ sub?.dossierNumber || sub?.subscriptionNumber }}
              <span *ngIf="sub?.beneficiaryName"> · {{ sub?.beneficiaryName }}</span>
            </p>
          </div>
          <span class="text-xs font-semibold px-3 py-1.5 rounded-full"
            style="background:rgba(99,102,241,0.12); color:#6366f1; border: 1px solid rgba(99,102,241,0.2)">
            {{ sub?.currentDay }} / {{ sub?.totalDays }} jours
          </span>
        </div>

        <app-carnet-calendar
          [progress]="sub!.progress!"
          [startDate]="sub!.startDate">
        </app-carnet-calendar>
      </div>

      <!-- Penalties -->
      <div class="tikane-card" *ngIf="sub?.penalties?.length">
        <h3 class="font-semibold mb-4" style="color: var(--text-primary)">Pénalités</h3>

        <div class="space-y-2">
          <div *ngFor="let penalty of sub?.penalties"
            class="flex items-center justify-between py-2.5 px-3 rounded-xl"
            style="background: var(--surface-card)">
            <div>
              <p class="text-sm font-medium" style="color: var(--text-primary)">{{ penalty.reason }}</p>
              <p class="text-xs" style="color: var(--text-muted)">
                {{ penalty.dayNumber ? ('Jour ' + penalty.dayNumber + ' · ') : '' }}{{ penalty.createdAt | date:'dd/MM/yyyy' }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-red-400">{{ penalty.amount | number }} HTG</p>
              <span class="text-xs" [style.color]="penalty.isPaid ? '#10b981' : '#f59e0b'">
                {{ penalty.isPaid ? 'PAYÉE' : 'EN ATTENTE' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment history -->
      <div class="tikane-card" *ngIf="sub">
        <h3 class="font-semibold mb-4" style="color: var(--text-primary)">Historique des paiements</h3>

        <div *ngIf="sub.payments?.length === 0" class="text-center py-8 text-sm" style="color: var(--text-muted)">
          Aucun paiement enregistré
        </div>

        <div class="space-y-2">
          <div *ngFor="let p of sub.payments"
            class="flex items-center justify-between py-2.5 px-3 rounded-xl"
            style="background: var(--surface-card)">
            <div class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                [style.background]="p.status === 'SUCCESS' ? '#10b981' : p.status === 'PENDING' ? '#f59e0b' : '#ef4444'">
                {{ p.dayNumber || '-' }}
              </div>
              <div>
                <p class="text-sm font-medium" style="color: var(--text-primary)">{{ p.dayNumber ? ('Jour ' + p.dayNumber) : 'Depot libre' }}</p>
                <p class="text-xs" style="color: var(--text-muted)">{{ p.paidAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold" style="color: var(--text-primary)">{{ p.amount | number }} HTG</p>
              <span [class]="'status-' + p.status" class="text-xs">{{ p.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>
    </ng-template>
  `,
})
export class SubscriptionDetailComponent implements OnInit {
  loading = true;
  sub: Subscription | null = null;

  get isSavings(): boolean {
    return this.sub?.plan?.type === 'SAVINGS';
  }

  constructor(private route: ActivatedRoute, private clientService: ClientService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.clientService.getSubscriptionDetail(id).subscribe({
      next: (data) => { this.sub = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
