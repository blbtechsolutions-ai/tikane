import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';
import { Payment } from '../../../core/models/payment.model';

@Component({
  selector: 'app-payments-validation',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Validation des paiements</h1>
        <p>Confirmez ou rejetez les paiements en attente</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="tikane-card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="tikane-table">
            <thead>
              <tr>
                <th>Dossier</th>
                <th>Montant</th>
                <th>Méthode</th>
                <th>Client</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of payments">
                <td>
                  <p class="text-sm font-mono font-medium" style="color: var(--text-primary)">
                    {{ p.subscription?.dossierNumber || p.subscription?.subscriptionNumber || p.referenceNumber }}
                  </p>
                  <p class="text-xs" style="color: var(--text-muted)">
                    {{ p.referenceNumber }}
                    <span *ngIf="p.subscription?.plan?.name"> · {{ p.subscription?.plan?.name }}</span>
                  </p>
                  <p *ngIf="p.externalReference" class="text-xs" style="color: var(--text-muted)">{{ p.externalReference }}</p>
                </td>
                <td>
                  <span class="text-sm font-bold" style="color: var(--text-primary)">{{ p.amount | number }} HTG</span>
                </td>
                <td>
                  <span class="badge badge-info text-xs">{{ p.method }}</span>
                </td>
                <td>
                  <div>
                    <div class="text-sm" style="color: var(--text-secondary)">{{ p.user?.firstName }} {{ p.user?.lastName }}</div>
                    <div class="text-xs" style="color: var(--text-muted)">{{ p.user?.phone || p.user?.email }}</div>
                  </div>
                </td>
                <td>
                  <span class="text-sm" style="color: var(--text-muted)">{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </td>
                <td>
                  <span [class]="'status-' + p.status">{{ p.status }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-1" *ngIf="p.status === 'PENDING'">
                    <button mat-icon-button (click)="confirm(p)" title="Confirmer"
                      [disabled]="processing === p.id" class="text-emerald-500">
                      <mat-icon class="text-base">check_circle</mat-icon>
                    </button>
                    <button mat-icon-button (click)="reject(p)" title="Rejeter"
                      [disabled]="processing === p.id" class="text-red-500">
                      <mat-icon class="text-base">cancel</mat-icon>
                    </button>
                    <mat-spinner *ngIf="processing === p.id" diameter="16"></mat-spinner>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="payments.length === 0" class="text-center py-12 text-sm" style="color: var(--text-muted)">
          Aucun paiement en attente
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-3 border-t" style="border-color: var(--surface-border)">
          <span class="text-sm" style="color: var(--text-muted)">Page {{ page }} / {{ totalPages }}</span>
          <div class="flex gap-2">
            <button mat-button [disabled]="page <= 1" (click)="previousPage()">Précédent</button>
            <button mat-button [disabled]="page >= totalPages" (click)="nextPage()">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PaymentsValidationComponent implements OnInit {
  payments: Payment[] = [];
  loading = true;
  processing: string | null = null;
  page = 1;
  totalPages = 1;

  constructor(private adminService: AdminService, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminService.listAllPayments({ page: this.page, status: 'PENDING', limit: 20 }).subscribe({
      next: (r) => { this.payments = r.data; this.totalPages = r.pagination.totalPages; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  previousPage(): void {
    if (this.page <= 1) return;
    this.page -= 1;
    this.load();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page += 1;
    this.load();
  }

  confirm(p: Payment): void {
    this.processing = p.id;
    this.adminService.confirmPayment(p.id).subscribe({
      next: () => { p.status = 'SUCCESS' as any; this.toastr.success('Paiement confirmé'); this.processing = null; },
      error: (err: any) => { this.processing = null; this.toastr.error(err.error?.message || 'Erreur lors de la confirmation'); },
    });
  }

  reject(p: Payment): void {
    const reason = prompt('Motif du rejet:');
    if (!reason) return;
    this.processing = p.id;
    this.adminService.rejectPayment(p.id, reason).subscribe({
      next: () => { p.status = 'FAILED' as any; this.toastr.warning('Paiement rejeté'); this.processing = null; },
      error: () => { this.processing = null; },
    });
  }
}
