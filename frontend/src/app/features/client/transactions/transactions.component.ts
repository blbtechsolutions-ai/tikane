import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientService } from '../client.service';
import { Transaction } from '../../../core/models/payment.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Transactions</h1>
        <p>Historique de toutes vos transactions</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="tikane-card">
        <div *ngIf="transactions.length === 0" class="text-center py-12 text-sm" style="color: var(--text-muted)">
          Aucune transaction
        </div>

        <div class="space-y-2">
          <div *ngFor="let t of transactions"
            class="flex items-center justify-between py-3 px-3 rounded-xl"
            style="background: var(--surface-card)">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                [style.background]="t.type === 'PAYMENT_IN' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'">
                <mat-icon [style.color]="t.type === 'PAYMENT_IN' ? '#10b981' : '#ef4444'" class="text-base">
                  {{ t.type === 'PAYMENT_IN' ? 'arrow_downward' : 'arrow_upward' }}
                </mat-icon>
              </div>
              <div>
                <p class="text-sm font-medium" style="color: var(--text-primary)">{{ t.description ?? t.type }}</p>
                <p class="text-xs" style="color: var(--text-muted)">{{ t.transactionRef }} · {{ t.createdAt | date:'dd/MM/yyyy' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold"
                [style.color]="t.type === 'PAYMENT_IN' ? '#10b981' : '#ef4444'">
                {{ t.type === 'PAYMENT_IN' ? '+' : '-' }}{{ t.netAmount | number }} HTG
              </p>
              <span [class]="'status-' + t.status" class="text-xs">{{ t.status }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TransactionsComponent implements OnInit {
  loading = true;
  transactions: Transaction[] = [];

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.clientService.getMyTransactions().subscribe({
      next: (r) => { this.transactions = r.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
