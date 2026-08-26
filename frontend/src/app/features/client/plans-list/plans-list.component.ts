import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClientService } from '../client.service';
import { Plan, PlanType, PLAN_TYPE_LABELS } from '../../../core/models/plan.model';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Plans disponibles</h1>
        <p>Choisissez un plan et commencez à épargner</p>
      </div>

      <!-- Filter chips -->
      <div class="flex flex-wrap gap-2">
        <button *ngFor="let t of types"
          (click)="filterType = t; loadPlans()"
          class="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
          [class.text-white]="filterType === t"
          [style.background]="filterType === t ? '#1e40af' : 'transparent'"
          [style.border-color]="filterType === t ? 'transparent' : 'var(--surface-border)'"
          [style.color]="filterType === t ? 'white' : 'var(--text-secondary)'"
        >{{ getPlanTypeLabel(t) }}</button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="flex justify-center py-16">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <!-- Plans grid -->
      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div *ngFor="let plan of plans; let i = index"
          class="tikane-card animate-on-enter flex flex-col"
          [style.animation-delay]="i * 60 + 'ms'">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div>
              <span class="badge badge-purple text-xs mb-2">{{ getPlanTypeLabel(plan.type) }}</span>
              <h3 class="font-bold text-lg font-display" style="color: var(--text-primary)">{{ plan.name }}</h3>
              <p *ngIf="plan.nameCreole" class="text-xs italic" style="color: var(--text-muted)">{{ plan.nameCreole }}</p>
            </div>
            <span *ngIf="plan.isFeatured"
              class="text-amber-500 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
              ⭐ Recommandé
            </span>
          </div>

          <!-- Description -->
          <p *ngIf="plan.description" class="text-sm mb-4 flex-1" style="color: var(--text-secondary)">
            {{ plan.description }}
          </p>

          <!-- Key info -->
          <div class="space-y-2 mb-5">
            <div class="flex justify-between text-sm" *ngIf="plan.type !== 'SAVINGS'">
              <span style="color: var(--text-muted)">Durée</span>
              <span class="font-medium" style="color: var(--text-primary)">{{ plan.durationDays }} jours</span>
            </div>
            <div class="flex justify-between text-sm" *ngIf="plan.type !== 'SAVINGS'">
              <span style="color: var(--text-muted)">Montant total</span>
              <span class="font-bold text-purple-600">{{ plan.totalAmount | number }} HTG</span>
            </div>
            <div class="flex justify-between text-sm" *ngIf="plan.type !== 'SAVINGS'">
              <span style="color: var(--text-muted)">{{ plan.type === 'SABOTAY' ? 'Montant à toucher' : 'Montant final' }}</span>
              <span class="font-bold text-emerald-500">{{ plan.finalAmount | number }} HTG</span>
            </div>
            <div *ngIf="plan.registrationFee > 0" class="flex justify-between text-sm">
              <span style="color: var(--text-muted)">Frais d'inscription</span>
              <span style="color: var(--text-primary)">{{ plan.registrationFee | number }} HTG</span>
            </div>
            <div *ngIf="plan.caNeetFee > 0" class="flex justify-between text-sm">
              <span style="color: var(--text-muted)">Frais carnet</span>
              <span style="color: var(--text-primary)">{{ plan.caNeetFee | number }} HTG</span>
            </div>
            <div class="flex justify-between text-sm" *ngIf="plan.type === 'SAVINGS'">
              <span style="color: var(--text-muted)">Versements</span>
              <span class="font-bold text-emerald-500">Libres</span>
            </div>
          </div>

          <!-- Progress bar (visual) -->
          <div class="tikane-progress mb-5">
            <div class="tikane-progress-bar" style="width: 0%; transition: width 1s ease"></div>
          </div>

          <!-- CTA -->
          <button (click)="subscribe(plan)"
            [disabled]="subscribing === plan.id"
            class="w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            style="background: #1e40af">
            <mat-spinner *ngIf="subscribing === plan.id" diameter="16"></mat-spinner>
            <span>{{ subscribing === plan.id ? 'Souscription...' : 'Souscrire maintenant' }}</span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && plans.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">📋</div>
        <h3 class="font-semibold mb-2" style="color: var(--text-primary)">Aucun plan disponible</h3>
        <p class="text-sm" style="color: var(--text-muted)">Revenez bientôt pour de nouveaux plans</p>
      </div>
    </div>
  `,
})
export class PlansListComponent implements OnInit {
  loading = true;
  subscribing: string | null = null;
  plans: Plan[] = [];
  filterType: PlanType | '' = '';
  planTypeLabels = PLAN_TYPE_LABELS;
  types: Array<PlanType | ''> = ['', 'SAVINGS', 'PROGRESSIVE', 'FIXED_DAILY', 'WEEKLY', 'MONTHLY', 'SABOTAY'];

  constructor(
    private clientService: ClientService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void { this.loadPlans(); }

  getPlanTypeLabel(type: PlanType | ''): string {
    return type === '' ? 'Tous' : this.planTypeLabels[type];
  }

  loadPlans(): void {
    this.loading = true;
    const params = this.filterType ? { type: this.filterType } : {};
    this.clientService.getPublicPlans(params).subscribe({
      next: (data) => { this.plans = data.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  subscribe(plan: Plan): void {
    this.subscribing = plan.id;
    this.clientService.subscribe(plan.id).subscribe({
      next: (sub) => {
        this.toastr.success(`Souscription au plan "${plan.name}" réussie!`);
        this.router.navigate(['/dashboard/subscriptions', sub.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.subscribing = null;
        const msg = err.error?.message || 'Erreur lors de la souscription';
        this.toastr.error(msg);
      },
    });
  }
}
