import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';

const PENALTY_TYPES = [
  { value: 'LATE_PAYMENT', label: 'Paiement en retard' },
  { value: 'MISSED_PAYMENT', label: 'Paiement manqué' },
  { value: 'EARLY_WITHDRAWAL', label: 'Retrait anticipé' },
  { value: 'BREACH_OF_CONTRACT', label: 'Violation de contrat' },
];

@Component({
  selector: 'app-penalties-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Gestion des pénalités</h1>
        <p>Ajoutez, modifiez ou annulez les pénalités appliquées aux carnets</p>
      </div>

      <!-- Add penalty panel -->
      <div class="tikane-card space-y-4">
        <h3 class="font-semibold text-sm" style="color: var(--text-primary)">Ajouter une pénalité</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">ID Souscription</label>
            <input [(ngModel)]="draft.subscriptionId" name="subscriptionId"
              placeholder="ID du carnet"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Type</label>
            <select [(ngModel)]="draft.type" name="type"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
              <option value="">-- Choisir --</option>
              <option *ngFor="let t of penaltyTypes" [value]="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Montant (HTG)</label>
            <input [(ngModel)]="draft.amount" name="amount" type="number" min="0" step="0.01"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Jour (optionnel)</label>
            <input [(ngModel)]="draft.dayNumber" name="dayNumber" type="number" min="1"
              placeholder="N° jour"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>
          <div class="md:col-span-2 xl:col-span-3">
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Raison</label>
            <input [(ngModel)]="draft.reason" name="reason"
              placeholder="Motif de la pénalité"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>
          <div class="flex items-end">
            <button mat-flat-button type="button" (click)="addPenalty()" [disabled]="adding"
              class="w-full !rounded-xl text-white" style="background: #dc2626">
              <mat-spinner *ngIf="adding" diameter="16" class="mr-2 inline-block"></mat-spinner>
              <mat-icon class="text-sm mr-1">add</mat-icon>
              {{ adding ? 'Ajout...' : 'Ajouter' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <select [(ngModel)]="filterType" (ngModelChange)="load()" name="filterType"
          class="px-3 py-2 rounded-xl text-sm outline-none"
          style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
          <option value="">Tous les types</option>
          <option *ngFor="let t of penaltyTypes" [value]="t.value">{{ t.label }}</option>
        </select>
        <select [(ngModel)]="filterPaid" (ngModelChange)="load()" name="filterPaid"
          class="px-3 py-2 rounded-xl text-sm outline-none"
          style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
          <option value="">Tout statut</option>
          <option value="false">Non payé</option>
          <option value="true">Payé</option>
        </select>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="tikane-card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="tikane-table">
            <thead>
              <tr>
                <th>Souscription</th>
                <th>Client</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Raison</th>
                <th>Jour</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of penalties">
                <td>
                  <div class="text-xs font-mono" style="color: var(--text-secondary)">
                    {{ p.subscription?.dossierNumber || p.subscription?.subscriptionNumber || '–' }}
                  </div>
                </td>
                <td>
                  <div class="text-sm font-medium" style="color: var(--text-primary)">
                    {{ p.user?.firstName }} {{ p.user?.lastName }}
                  </div>
                  <div class="text-xs" style="color: var(--text-muted)">{{ p.user?.email }}</div>
                </td>
                <td>
                  <span class="badge badge-warning text-xs">{{ getTypeLabel(p.type) }}</span>
                </td>
                <td>
                  <span class="text-sm font-bold text-red-500">{{ p.amount | number }} HTG</span>
                </td>
                <td>
                  <span class="text-xs" style="color: var(--text-secondary)" [title]="p.reason">
                    {{ p.reason.length > 40 ? (p.reason | slice:0:40) + '...' : p.reason }}
                  </span>
                </td>
                <td class="text-center">
                  <span *ngIf="p.dayNumber" class="text-xs badge badge-info">J{{ p.dayNumber }}</span>
                  <span *ngIf="!p.dayNumber" class="text-xs" style="color: var(--text-muted)">–</span>
                </td>
                <td>
                  <span class="text-xs" style="color: var(--text-muted)">{{ p.createdAt | date:'dd/MM/yyyy' }}</span>
                </td>
                <td>
                  <span *ngIf="p.waivedAt" class="badge badge-success text-xs">Annulée</span>
                  <span *ngIf="p.isPaid && !p.waivedAt" class="badge badge-info text-xs">Payée</span>
                  <span *ngIf="!p.isPaid && !p.waivedAt" class="badge badge-warning text-xs">En attente</span>
                </td>
                <td>
                  <div class="flex items-center gap-1" *ngIf="processing !== p.id; else spinnerTpl">
                    <button *ngIf="!p.waivedAt" mat-icon-button
                      (click)="waive(p)" title="Annuler cette pénalité" class="text-orange-500">
                      <mat-icon class="text-base">remove_circle_outline</mat-icon>
                    </button>
                  </div>
                  <ng-template #spinnerTpl>
                    <mat-spinner diameter="20"></mat-spinner>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="penalties.length === 0" class="text-center py-12 text-sm" style="color: var(--text-muted)">
          Aucune pénalité trouvée
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination" class="flex items-center justify-between px-6 py-4 border-t"
          style="border-color: var(--surface-border)">
          <span class="text-xs" style="color: var(--text-muted)">
            Page {{ pagination.page }} / {{ pagination.totalPages }} — {{ pagination.total }} pénalité(s)
          </span>
          <div class="flex gap-2">
            <button mat-stroked-button [disabled]="!pagination.hasPrev" (click)="page = page - 1; load()"
              class="!rounded-xl text-xs !py-1">Précédent</button>
            <button mat-stroked-button [disabled]="!pagination.hasNext" (click)="page = page + 1; load()"
              class="!rounded-xl text-xs !py-1">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PenaltiesManagementComponent implements OnInit {
  penalties: any[] = [];
  pagination: any = null;
  loading = true;
  adding = false;
  processing: string | null = null;
  page = 1;
  filterType = '';
  filterPaid = '';

  penaltyTypes = PENALTY_TYPES;

  draft: {
    subscriptionId: string;
    type: string;
    amount: number | null;
    reason: string;
    dayNumber: number | null;
  } = { subscriptionId: '', type: '', amount: null, reason: '', dayNumber: null };

  constructor(private adminService: AdminService, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    const params: Record<string, any> = { page: this.page, limit: 20 };
    if (this.filterType) params['type'] = this.filterType;
    if (this.filterPaid) params['isPaid'] = this.filterPaid;

    this.adminService.listPenalties(params).subscribe({
      next: (res) => {
        this.penalties = res.data;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  addPenalty(): void {
    const { subscriptionId, type, amount, reason } = this.draft;
    if (!subscriptionId || !type || !amount || !reason) {
      this.toastr.warning('Tous les champs obligatoires doivent être remplis');
      return;
    }
    this.adding = true;
    this.adminService.addPenalty({
      subscriptionId,
      type,
      amount: Number(amount),
      reason,
      dayNumber: this.draft.dayNumber ? Number(this.draft.dayNumber) : undefined,
    }).subscribe({
      next: () => {
        this.toastr.success('Pénalité ajoutée');
        this.draft = { subscriptionId: '', type: '', amount: null, reason: '', dayNumber: null };
        this.adding = false;
        this.load();
      },
      error: () => { this.adding = false; },
    });
  }

  waive(penalty: any): void {
    this.processing = penalty.id;
    this.adminService.waivePenalty(penalty.id).subscribe({
      next: () => {
        this.toastr.success('Pénalité annulée');
        this.processing = null;
        this.load();
      },
      error: () => { this.processing = null; },
    });
  }

  getTypeLabel(type: string): string {
    return PENALTY_TYPES.find((t) => t.value === type)?.label ?? type;
  }
}
