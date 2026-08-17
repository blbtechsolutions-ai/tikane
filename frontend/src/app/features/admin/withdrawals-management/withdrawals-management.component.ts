import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';
import { Withdrawal } from '../../../core/models/payment.model';

@Component({
  selector: 'app-withdrawals-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Gestion des touchements</h1>
        <p>Validez les demandes de touche et suivez les dossiers a remettre</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="tikane-card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="tikane-table">
            <thead>
              <tr>
                <th>Dossier</th>
                <th>Client</th>
                <th>Montant net</th>
                <th>Canal</th>
                <th>Compte</th>
                <th>Demandé le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of withdrawals">
                <td>
                  <div>
                    <div class="text-sm font-mono font-medium" style="color: var(--text-primary)">
                      {{ w.subscription?.dossierNumber || w.subscription?.subscriptionNumber || w.referenceNumber }}
                    </div>
                    <div class="text-xs" style="color: var(--text-muted)">
                      {{ w.referenceNumber }}
                      <span *ngIf="w.subscription?.plan?.name"> · {{ w.subscription?.plan?.name }}</span>
                    </div>
                    <div *ngIf="w.subscription?.touchReference" class="text-xs" style="color: var(--text-muted)">
                      Réf. touche: {{ w.subscription?.touchReference }}
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div class="text-sm font-medium" style="color: var(--text-primary)">
                      {{ w.user?.firstName }} {{ w.user?.lastName }}
                    </div>
                    <div class="text-xs" style="color: var(--text-muted)">{{ w.user?.phone || w.user?.email }}</div>
                  </div>
                </td>
                <td>
                  <span class="text-sm font-bold text-emerald-500">{{ w.netAmount | number }} HTG</span>
                </td>
                <td>
                  <span class="badge badge-info text-xs">{{ w.method }}</span>
                </td>
                <td>
                  <div class="text-xs" style="color: var(--text-secondary)">
                    <div *ngIf="w.phoneNumber">📱 {{ w.phoneNumber }}</div>
                    <div *ngIf="w.bankName">🏦 {{ w.bankName }}</div>
                    <div *ngIf="w.accountNumber">{{ w.accountNumber }}</div>
                    <div *ngIf="w.accountName">{{ w.accountName }}</div>
                  </div>
                </td>
                <td>
                  <span class="text-sm" style="color: var(--text-muted)">{{ w.requestedAt | date:'dd/MM/yyyy' }}</span>
                </td>
                <td>
                  <span [class]="'status-' + w.status">{{ w.status }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-1" *ngIf="processing !== w.id; else spinnerTpl">
                    <button *ngIf="w.status === 'PENDING'" mat-icon-button
                      (click)="approve(w)" title="Valider la touche" class="text-emerald-500">
                      <mat-icon class="text-base">check_circle</mat-icon>
                    </button>
                    <button *ngIf="w.status === 'APPROVED'" mat-icon-button
                      (click)="complete(w)" title="Marquer touche remise" class="text-blue-500">
                      <mat-icon class="text-base">done_all</mat-icon>
                    </button>
                    <button *ngIf="w.status === 'PENDING' || w.status === 'APPROVED'" mat-icon-button
                      (click)="reject(w)" title="Refuser" class="text-red-500">
                      <mat-icon class="text-base">cancel</mat-icon>
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

        <div *ngIf="withdrawals.length === 0" class="text-center py-12 text-sm" style="color: var(--text-muted)">
          Aucune demande de touche
        </div>
      </div>
    </div>
  `,
})
export class WithdrawalsManagementComponent implements OnInit {
  withdrawals: Withdrawal[] = [];
  loading = true;
  processing: string | null = null;

  constructor(private adminService: AdminService, private toastr: ToastrService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.adminService.listAllWithdrawals({ status: 'PENDING,APPROVED', limit: 50 }).subscribe({
      next: (r) => { this.withdrawals = r.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  approve(w: Withdrawal): void {
    this.processing = w.id;
    this.adminService.approveWithdrawal(w.id).subscribe({
      next: () => { w.status = 'APPROVED'; this.toastr.success('Demande de touche validee'); this.processing = null; },
      error: () => { this.processing = null; },
    });
  }

  complete(w: Withdrawal): void {
    const ref = prompt('Reference externe de remise (optionnel):') ?? '';
    this.processing = w.id;
    this.adminService.completeWithdrawal(w.id, ref || undefined).subscribe({
      next: () => { w.status = 'COMPLETED'; this.toastr.success('Touche marquee comme remise'); this.processing = null; },
      error: () => { this.processing = null; },
    });
  }

  reject(w: Withdrawal): void {
    const reason = prompt('Motif du refus:');
    if (!reason) return;
    this.processing = w.id;
    this.adminService.rejectWithdrawal(w.id, reason).subscribe({
      next: () => { w.status = 'REJECTED'; this.toastr.warning('Demande de touche refusee'); this.processing = null; },
      error: () => { this.processing = null; },
    });
  }
}
