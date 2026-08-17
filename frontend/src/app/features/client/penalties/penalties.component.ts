import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../client.service';

const PENALTY_TYPE_LABELS: Record<string, string> = {
  LATE_PAYMENT: 'Paiement en retard',
  MISSED_PAYMENT: 'Paiement manqué',
  EARLY_WITHDRAWAL: 'Retrait anticipé',
  BREACH_OF_CONTRACT: 'Violation de contrat',
};

@Component({
  selector: 'app-penalties',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Mes pénalités</h1>
        <p>Historique des pénalités appliquées à vos carnets</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="tikane-card !p-0 overflow-hidden">
        <div *ngIf="penalties.length === 0" class="text-center py-12 text-sm" style="color: var(--text-muted)">
          <mat-icon class="text-4xl mb-2 block" style="color: var(--text-muted)">check_circle_outline</mat-icon>
          Aucune pénalité enregistrée
        </div>

        <div class="overflow-x-auto" *ngIf="penalties.length > 0">
          <table class="tikane-table">
            <thead>
              <tr>
                <th>Carnet</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Raison</th>
                <th>Jour</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of penalties">
                <td>
                  <span class="text-xs font-mono" style="color: var(--text-secondary)">
                    {{ p.subscription?.dossierNumber || p.subscription?.subscriptionNumber || '–' }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-warning text-xs">{{ getTypeLabel(p.type) }}</span>
                </td>
                <td>
                  <span class="text-sm font-bold text-red-500">{{ p.amount | number }} HTG</span>
                </td>
                <td>
                  <span class="text-xs" style="color: var(--text-secondary)">
                    {{ p.reason.length > 40 ? (p.reason | slice:0:40) + '...' : p.reason }}
                  </span>
                </td>
                <td class="text-center">
                  <span *ngIf="p.dayNumber" class="badge badge-info text-xs">J{{ p.dayNumber }}</span>
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
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination && penalties.length > 0"
          class="flex items-center justify-between px-6 py-4 border-t"
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
export class PenaltiesComponent implements OnInit {
  penalties: any[] = [];
  pagination: any = null;
  loading = true;
  page = 1;

  constructor(private clientService: ClientService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.clientService.getMyPenalties({ page: this.page, limit: 20 }).subscribe({
      next: (res) => {
        this.penalties = res.data;
        this.pagination = res.pagination;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  getTypeLabel(type: string): string {
    return PENALTY_TYPE_LABELS[type] ?? type;
  }
}
