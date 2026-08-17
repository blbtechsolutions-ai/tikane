import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { ClientService } from '../client.service';
import { Withdrawal, Subscription } from '../../../core/models/payment.model';

@Component({
  selector: 'app-withdrawals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Touchements</h1>
        <p>Demandez la mise a disposition de votre touche sur les carnets termines</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Withdrawal form -->
        <div class="tikane-card lg:col-span-1">
          <h3 class="font-semibold mb-4" style="color: var(--text-primary)">Demande de touche</h3>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Carnet pret a toucher</label>
              <select formControlName="subscriptionId"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
                <option value="">Sélectionnez...</option>
                <option *ngFor="let sub of completedSubscriptions" [value]="sub.id">
                  {{ touchOptionLabel(sub) }}
                </option>
              </select>
              <p *ngIf="completedSubscriptions.length === 0" class="mt-2 text-xs" style="color: var(--text-muted)">
                Aucun carnet pret a toucher pour le moment.
              </p>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Canal de reception</label>
              <select formControlName="method"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
                <option value="MONCASH">MonCash</option>
                <option value="NATCASH">NatCash</option>
                <option value="BANK_TRANSFER">Virement bancaire</option>
              </select>
            </div>

            <div *ngIf="form.value.method !== 'BANK_TRANSFER'">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Numéro de téléphone</label>
              <input formControlName="phoneNumber" placeholder="+509 XX XX XXXX"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div *ngIf="form.value.method === 'BANK_TRANSFER'" class="space-y-3">
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Banque</label>
                <input formControlName="bankName" placeholder="Nom de la banque"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Numéro de compte</label>
                <input formControlName="accountNumber" placeholder="XXXXXXXXXX"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Nom du titulaire</label>
                <input formControlName="accountName" placeholder="Prénom Nom"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>
            </div>

            <button type="submit" [disabled]="form.invalid || submitting"
              class="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              style="background: #1e40af">
              <mat-spinner *ngIf="submitting" diameter="16"></mat-spinner>
              <span>{{ submitting ? 'Envoi...' : 'Demander la touche' }}</span>
            </button>
          </form>
        </div>

        <!-- Withdrawals list -->
        <div class="tikane-card lg:col-span-2">
          <h3 class="font-semibold mb-4" style="color: var(--text-primary)">Mes demandes de touche</h3>

          <div *ngIf="loadingList" class="flex justify-center py-8"><mat-spinner diameter="36"></mat-spinner></div>

          <div *ngIf="!loadingList && withdrawals.length === 0"
            class="text-center py-10 text-sm" style="color: var(--text-muted)">
            Aucune demande de touche
          </div>

          <div class="space-y-3">
            <div *ngFor="let w of withdrawals"
              class="flex items-center justify-between py-3 px-3 rounded-xl"
              style="background: var(--surface-card)">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                  style="background: rgba(59,130,246,0.1)">
                  <mat-icon class="text-blue-500 text-base">account_balance_wallet</mat-icon>
                </div>
                <div>
                  <p class="text-sm font-medium" style="color: var(--text-primary)">
                    {{ w.subscription?.dossierNumber || w.subscription?.subscriptionNumber || w.referenceNumber }}
                  </p>
                  <p class="text-xs" style="color: var(--text-muted)">
                    {{ w.referenceNumber }}
                    <span *ngIf="w.subscription?.plan?.name"> · {{ w.subscription?.plan?.name }}</span>
                    · {{ w.method }}
                    · {{ w.requestedAt | date:'dd/MM/yyyy' }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold" style="color: var(--text-primary)">{{ w.netAmount | number }} HTG</p>
                <span [class]="'status-' + w.status" class="text-xs">{{ w.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class WithdrawalsComponent implements OnInit {
  form: FormGroup;
  completedSubscriptions: Subscription[] = [];
  withdrawals: Withdrawal[] = [];
  loadingList = true;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private toastr: ToastrService,
  ) {
    this.form = this.fb.group({
      subscriptionId: ['', Validators.required],
      method: ['MONCASH', Validators.required],
      phoneNumber: [''],
      bankName: [''],
      accountNumber: [''],
      accountName: [''],
    });
  }

  ngOnInit(): void {
    this.clientService.getMySubscriptions({ status: 'COMPLETED' }).subscribe({
      next: (r) => {
        this.completedSubscriptions = r.data.filter((sub) => sub.touchStatus !== 'TOUCHED');
      },
    });
    this.loadWithdrawals();
  }

  loadWithdrawals(): void {
    this.clientService.getMyWithdrawals().subscribe({
      next: (r) => { this.withdrawals = r.data; this.loadingList = false; },
      error: () => { this.loadingList = false; },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.clientService.requestWithdrawal(this.form.value).subscribe({
      next: () => {
        this.toastr.success('Demande de touche envoyee!');
        this.form.patchValue({ subscriptionId: '' });
        this.loadWithdrawals();
        this.submitting = false;
      },
      error: () => { this.submitting = false; },
    });
  }

  touchOptionLabel(sub: Subscription): string {
    const reference = sub.dossierNumber || sub.subscriptionNumber;
    const amount = sub.plan?.finalAmount ?? sub.totalPaid ?? sub.totalDue;
    return `${sub.plan?.name ?? 'Carnet'} - ${reference} - ${amount.toLocaleString()} HTG`;
  }
}
