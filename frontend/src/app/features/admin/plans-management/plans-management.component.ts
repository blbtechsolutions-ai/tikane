import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';
import { Plan, PLAN_TYPE_LABELS } from '../../../core/models/plan.model';

interface PlanDraft {
  name: string;
  description: string;
  type: Plan['type'];
  durationDays: number;
  startAmount: number;
  incrementAmount: number;
  fixedAmount: number;
  registrationFee: number;
  caNeetFee: number;
  platformFeeRate: number;
  isPublic: boolean;
  isFeatured: boolean;
}

interface PlanPreview {
  schedule: Array<{ dayNumber: number; amount: number; label: string }>;
  totalAmount: number;
  finalAmount: number;
}

@Component({
  selector: 'app-plans-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header flex items-center justify-between">
        <div>
          <h1>Gestion des plans</h1>
          <p>Créez et gérez les plans de tontine</p>
        </div>
        <button mat-flat-button type="button" (click)="toggleCreateForm()"
          class="!rounded-xl !px-4 !py-2 text-white"
          style="background: #1e40af">
          <mat-icon class="mr-2">add</mat-icon>
          {{ showCreateForm ? 'Fermer le formulaire' : 'Créer un plan' }}
        </button>
      </div>

      <div *ngIf="showCreateForm" class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="tikane-card xl:col-span-2 space-y-4">
          <div>
            <h3 class="font-semibold" style="color: var(--text-primary)">Nouveau plan</h3>
            <p class="text-sm" style="color: var(--text-muted)">
              Configurez un carnet ou un plan, puis vérifiez le montant à toucher avant publication.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Nom du plan</label>
              <input [(ngModel)]="draft.name" name="name" placeholder="Ex: Sabotay 30 jou - 10 HTG"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Description</label>
              <textarea [(ngModel)]="draft.description" name="description" rows="3"
                placeholder="Règles et explications du carnet"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)"></textarea>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Type</label>
              <select [(ngModel)]="draft.type" name="type" (ngModelChange)="onTypeChange()"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
                <option *ngFor="let type of availableTypes" [value]="type">{{ planTypeLabels[type] }}</option>
              </select>
            </div>

            <div *ngIf="!isSavingsDraft">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Durée</label>
              <input [(ngModel)]="draft.durationDays" name="durationDays" type="number" min="1"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div *ngIf="!isSavingsDraft">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">
                {{ usesFixedAmount ? 'Montant de base' : 'Montant jour 1' }}
              </label>
              <input [(ngModel)]="draft.startAmount" name="startAmount" type="number" min="1"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div *ngIf="usesFixedAmount">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Montant fixe</label>
              <input [(ngModel)]="draft.fixedAmount" name="fixedAmount" type="number" min="1"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div *ngIf="requiresIncrementAmount">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Incrément journalier</label>
              <input [(ngModel)]="draft.incrementAmount" name="incrementAmount" type="number" min="1"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Frais dossier</label>
              <input [(ngModel)]="draft.registrationFee" name="registrationFee" type="number" min="0"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Frais carnet</label>
              <input [(ngModel)]="draft.caNeetFee" name="caNeetFee" type="number" min="0"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Frais plateforme (%)</label>
              <input [(ngModel)]="draft.platformFeeRate" name="platformFeeRate" type="number" min="0" max="100"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>
          </div>

          <div class="flex flex-wrap gap-4 text-sm">
            <label class="flex items-center gap-2" style="color: var(--text-primary)">
              <input [(ngModel)]="draft.isPublic" name="isPublic" type="checkbox" />
              <span>Visible côté client</span>
            </label>
            <label class="flex items-center gap-2" style="color: var(--text-primary)">
              <input [(ngModel)]="draft.isFeatured" name="isFeatured" type="checkbox" />
              <span>Mettre en avant</span>
            </label>
          </div>

          <div class="flex flex-wrap gap-3">
            <button mat-stroked-button type="button" (click)="previewSchedule()" [disabled]="previewLoading || creating">
              <mat-icon class="mr-2">preview</mat-icon>
              {{ previewLoading ? 'Calcul...' : 'Aperçu' }}
            </button>
            <button mat-flat-button type="button" (click)="createPlan()" [disabled]="creating"
              class="!rounded-xl text-white" style="background: linear-gradient(135deg, #10b981, #059669)">
              <mat-icon class="mr-2">save</mat-icon>
              {{ creating ? 'Création...' : 'Enregistrer le plan' }}
            </button>
          </div>
        </div>

        <div class="tikane-card space-y-4">
          <div>
            <h3 class="font-semibold" style="color: var(--text-primary)">Aperçu</h3>
            <p class="text-sm" style="color: var(--text-muted)">
              Vérifiez le total à payer et le montant à toucher avant de créer le plan.
            </p>
          </div>

          <div *ngIf="!preview && !previewLoading" class="text-sm" style="color: var(--text-muted)">
            Cliquez sur “Aperçu” pour générer les premières lignes du carnet.
          </div>

          <div *ngIf="previewLoading" class="flex justify-center py-8">
            <mat-spinner diameter="36"></mat-spinner>
          </div>

          <div *ngIf="preview" class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-3" style="background: var(--surface-bg)">
                <p class="text-xs mb-1" style="color: var(--text-muted)">Total payé</p>
                <p class="font-bold text-purple-600">{{ preview.totalAmount | number }} HTG</p>
              </div>
              <div class="rounded-xl p-3" style="background: var(--surface-bg)">
                <p class="text-xs mb-1" style="color: var(--text-muted)">Montant à toucher</p>
                <p class="font-bold text-emerald-500">{{ preview.finalAmount | number }} HTG</p>
              </div>
            </div>

            <div class="space-y-2">
              <div *ngIf="preview.schedule.length === 0" class="text-sm rounded-xl px-3 py-3" style="background: var(--surface-bg); color: var(--text-muted)">
                Versements libres sans echeancier.
              </div>
              <div *ngFor="let item of preview.schedule | slice:0:6"
                class="flex items-center justify-between rounded-xl px-3 py-2"
                style="background: var(--surface-bg)">
                <div>
                  <p class="text-sm font-medium" style="color: var(--text-primary)">{{ item.label }}</p>
                  <p class="text-xs" style="color: var(--text-muted)">Échéance {{ item.dayNumber }}</p>
                </div>
                <span class="text-sm font-semibold" style="color: var(--text-primary)">{{ item.amount | number }} HTG</span>
              </div>
            </div>

            <p *ngIf="preview.schedule.length > 6" class="text-xs" style="color: var(--text-muted)">
              {{ preview.schedule.length - 6 }} lignes supplémentaires seront générées automatiquement.
            </p>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div *ngFor="let plan of plans" class="tikane-card">
          <div class="flex items-start justify-between mb-3">
            <div>
              <span class="badge badge-purple text-xs mb-1">{{ planTypeLabels[plan.type] }}</span>
              <h3 class="font-bold" style="color: var(--text-primary)">{{ plan.name }}</h3>
            </div>
            <span [class]="'status-' + plan.status">{{ plan.status }}</span>
          </div>

          <div class="space-y-1.5 mb-4 text-sm">
            <div class="flex justify-between" *ngIf="plan.type !== 'SAVINGS'">
              <span style="color: var(--text-muted)">Durée</span>
              <span style="color: var(--text-primary)">{{ plan.durationDays }}j</span>
            </div>
            <div class="flex justify-between" *ngIf="plan.type !== 'SAVINGS'">
              <span style="color: var(--text-muted)">Total</span>
              <span class="font-semibold text-purple-600">{{ plan.totalAmount | number }} HTG</span>
            </div>
            <div class="flex justify-between" *ngIf="plan.type !== 'SAVINGS'">
              <span style="color: var(--text-muted)">Final</span>
              <span class="font-semibold text-emerald-500">{{ plan.finalAmount | number }} HTG</span>
            </div>
            <div class="flex justify-between" *ngIf="plan._count">
              <span style="color: var(--text-muted)">Souscriptions</span>
              <span style="color: var(--text-primary)">{{ plan._count.subscriptions }}</span>
            </div>
            <div class="flex justify-between" *ngIf="plan.type === 'SAVINGS'">
              <span style="color: var(--text-muted)">Regle</span>
              <span class="font-semibold text-emerald-500">Depots libres</span>
            </div>
          </div>

          <!-- Status toggle -->
          <div class="flex gap-2">
            <button *ngIf="plan.status === 'DRAFT' || plan.status === 'PAUSED'"
              (click)="changeStatus(plan, 'ACTIVE')"
              class="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style="background: rgba(16,185,129,0.8)">
              Activer
            </button>
            <button *ngIf="plan.status === 'ACTIVE'"
              (click)="changeStatus(plan, 'PAUSED')"
              class="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
              style="background: rgba(245,158,11,0.8)">
              Suspendre
            </button>
            <button *ngIf="plan.status !== 'ARCHIVED'"
              (click)="changeStatus(plan, 'ARCHIVED')"
              class="py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-secondary)">
              Archiver
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && plans.length === 0" class="text-center py-16">
        <div class="text-5xl mb-4">📋</div>
        <h3 class="font-semibold mb-2" style="color: var(--text-primary)">Aucun plan créé</h3>
      </div>
    </div>
  `,
})
export class PlansManagementComponent implements OnInit {
  plans: Plan[] = [];
  loading = true;
  planTypeLabels = PLAN_TYPE_LABELS;
  availableTypes: Plan['type'][] = ['SAVINGS', 'SABOTAY', 'PROGRESSIVE', 'FIXED_DAILY', 'WEEKLY', 'MONTHLY'];
  showCreateForm = false;
  creating = false;
  previewLoading = false;
  preview: PlanPreview | null = null;
  draft: PlanDraft = this.createDraft();

  constructor(private adminService: AdminService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.adminService.listAllPlans({ limit: 50 }).subscribe({
      next: (r) => { this.plans = r.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  changeStatus(plan: Plan, status: string): void {
    this.adminService.updatePlanStatus(plan.id, status).subscribe({
      next: (updated) => {
        plan.status = updated.status;
        this.toastr.success(`Plan ${plan.name}: ${status}`);
      },
    });
  }

  get requiresIncrementAmount(): boolean {
    return this.draft.type === 'PROGRESSIVE';
  }

  get isSavingsDraft(): boolean {
    return this.draft.type === 'SAVINGS';
  }

  get usesFixedAmount(): boolean {
    return ['FIXED_DAILY', 'WEEKLY', 'MONTHLY', 'SABOTAY'].includes(this.draft.type);
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.preview = null;
    }
  }

  onTypeChange(): void {
    if (this.isSavingsDraft) {
      this.draft.durationDays = 0;
      this.draft.startAmount = 0;
      this.draft.fixedAmount = 0;
      this.draft.incrementAmount = 0;
    } else if (this.usesFixedAmount && !this.draft.fixedAmount) {
      this.draft.fixedAmount = this.draft.startAmount;
    }
    this.preview = null;
  }

  previewSchedule(): void {
    if (!this.validateDraft(true)) return;

    this.previewLoading = true;
    this.adminService.getSchedulePreview(this.buildPayload()).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.previewLoading = false;
      },
      error: () => {
        this.previewLoading = false;
      },
    });
  }

  createPlan(): void {
    if (!this.validateDraft(true)) return;

    this.creating = true;
    this.adminService.createPlan(this.buildPayload()).subscribe({
      next: (plan) => {
        this.plans = [plan, ...this.plans];
        this.toastr.success('Plan créé avec succès');
        this.creating = false;
        this.preview = null;
        this.draft = this.createDraft();
        this.showCreateForm = false;
      },
      error: () => {
        this.creating = false;
      },
    });
  }

  private createDraft(): PlanDraft {
    return {
      name: '',
      description: '',
      type: 'SABOTAY',
      durationDays: 30,
      startAmount: 10,
      incrementAmount: 5,
      fixedAmount: 10,
      registrationFee: 0,
      caNeetFee: 0,
      platformFeeRate: 0,
      isPublic: true,
      isFeatured: false,
    };
  }

  private validateDraft(showToast = false): boolean {
    if (this.draft.name.trim().length < 3) {
      if (showToast) this.toastr.error('Le nom du plan doit contenir au moins 3 caractères');
      return false;
    }

    if (!this.isSavingsDraft && (this.draft.durationDays < 1 || this.draft.startAmount <= 0)) {
      if (showToast) this.toastr.error('La durée et le montant de base doivent être valides');
      return false;
    }

    if (this.requiresIncrementAmount && this.draft.incrementAmount <= 0) {
      if (showToast) this.toastr.error('L’incrément journalier est requis pour un kompas progressif');
      return false;
    }

    if (this.usesFixedAmount && this.draft.fixedAmount <= 0) {
      if (showToast) this.toastr.error('Le montant fixe est requis pour ce type de plan');
      return false;
    }

    return true;
  }

  private buildPayload(): Record<string, any> {
    const payload: Record<string, any> = {
      name: this.draft.name.trim(),
      description: this.draft.description.trim() || undefined,
      type: this.draft.type,
      durationDays: this.isSavingsDraft ? 0 : Number(this.draft.durationDays),
      startAmount: this.isSavingsDraft ? 0 : Number(this.draft.startAmount),
      registrationFee: Number(this.draft.registrationFee || 0),
      caNeetFee: Number(this.draft.caNeetFee || 0),
      platformFeeRate: Number(this.draft.platformFeeRate || 0),
      isPublic: this.draft.isPublic,
      isFeatured: this.draft.isFeatured,
    };

    if (this.requiresIncrementAmount) {
      payload['incrementAmount'] = Number(this.draft.incrementAmount);
    }

    if (this.usesFixedAmount) {
      payload['fixedAmount'] = Number(this.draft.fixedAmount || this.draft.startAmount);
    }

    return payload;
  }
}
