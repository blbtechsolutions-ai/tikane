import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { ClientService } from '../client.service';
import { Payment, Subscription } from '../../../core/models/payment.model';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Versements</h1>
        <p>Enregistrez vos versements et consultez l'historique de vos carnets</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Payment form -->
        <div class="tikane-card lg:col-span-1">
          <h3 class="font-semibold mb-4" style="color: var(--text-primary)">Nouveau versement</h3>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">
                Carnet / dossier
              </label>
              <select formControlName="subscriptionId" (change)="onSubscriptionChange()"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
                <option value="">Sélectionnez...</option>
                <option *ngFor="let sub of activeSubscriptions" [value]="sub.id">
                  {{ paymentOptionLabel(sub) }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">
                Méthode de paiement
              </label>
              <select formControlName="method"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
                <option value="MONCASH">MonCash</option>
                <option value="NATCASH">NatCash</option>
                <option value="BANK_TRANSFER">Virement bancaire</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">
                Montant (HTG)
              </label>
              <input formControlName="amount" type="number" placeholder="0" [readonly]="selectedSubscription && !isSavings(selectedSubscription)"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              <p *ngIf="selectedSubscription && !isSavings(selectedSubscription)" class="mt-2 text-xs" style="color: var(--text-muted)">
                Prochaine echeance: jour {{ selectedSubscription.nextPaymentDayNumber }} - {{ selectedSubscription.nextPaymentAmount | number }} HTG
              </p>
              <p *ngIf="selectedSubscription && isSavings(selectedSubscription)" class="mt-2 text-xs" style="color: var(--text-muted)">
                Depot libre sur votre solde epargne.
              </p>
            </div>

            <button type="submit" [disabled]="form.invalid || submitting"
              class="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              style="background: #1e40af">
              <mat-spinner *ngIf="submitting" diameter="16"></mat-spinner>
              <span>{{ submitting ? 'Enregistrement...' : 'Enregistrer le versement' }}</span>
            </button>
          </form>
        </div>

        <!-- Payment history -->
        <div class="tikane-card lg:col-span-2">
          <h3 class="font-semibold mb-4" style="color: var(--text-primary)">Historique</h3>

          <div *ngIf="loadingPayments" class="flex justify-center py-8">
            <mat-spinner diameter="36"></mat-spinner>
          </div>

          <div *ngIf="!loadingPayments && payments.length === 0" class="text-center py-8 text-sm" style="color: var(--text-muted)">
            Aucun paiement
          </div>

          <div class="space-y-2">
            <div *ngFor="let p of payments"
              class="flex items-center justify-between py-3 px-3 rounded-xl transition-colors hover:opacity-90"
              style="background: var(--surface-card)">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                  style="background: rgba(16,185,129,0.1)">
                  <mat-icon class="text-emerald-500 text-base">payments</mat-icon>
                </div>
                <div>
                  <p class="text-sm font-medium" style="color: var(--text-primary)">
                    {{ p.subscription?.dossierNumber || p.subscription?.subscriptionNumber || p.referenceNumber }}
                  </p>
                  <p class="text-xs" style="color: var(--text-muted)">
                    {{ p.referenceNumber }}
                    <span *ngIf="p.subscription?.plan?.name"> · {{ p.subscription?.plan?.name }}</span>
                    · {{ p.method }}
                    · {{ p.createdAt | date:'dd/MM/yyyy' }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold" style="color: var(--text-primary)">{{ p.amount | number }} HTG</p>
                <span [class]="'status-' + p.status" class="text-xs">{{ p.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PaymentsComponent implements OnInit {
  form: FormGroup;
  activeSubscriptions: Subscription[] = [];
  payments: Payment[] = [];
  loadingPayments = true;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private toastr: ToastrService,
  ) {
    this.form = this.fb.group({
      subscriptionId: ['', Validators.required],
      method: ['MONCASH', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.clientService.getMySubscriptions({ status: 'ACTIVE' }).subscribe({
      next: (r) => { this.activeSubscriptions = r.data; },
    });
    this.loadPayments();
  }

  loadPayments(): void {
    this.clientService.getMyPayments().subscribe({
      next: (r) => { this.payments = r.data; this.loadingPayments = false; },
      error: () => { this.loadingPayments = false; },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    const sub = this.selectedSubscription;
    const payload = {
      ...this.form.value,
      amount: Number(this.form.value.amount),
      dayNumber: sub && !this.isSavings(sub) ? sub.nextPaymentDayNumber ?? undefined : undefined,
    };

    this.clientService.createPayment(payload).subscribe({
      next: () => {
        this.toastr.success('Versement enregistre avec succes!');
        this.form.patchValue({ amount: '' });
        this.loadPayments();
        this.submitting = false;
      },
      error: () => { this.submitting = false; },
    });
  }

  paymentOptionLabel(sub: Subscription): string {
    const reference = sub.dossierNumber || sub.subscriptionNumber;
    return `${sub.plan?.name ?? 'Carnet'} - ${reference}`;
  }

  get selectedSubscription(): Subscription | undefined {
    return this.activeSubscriptions.find((sub) => sub.id === this.form.value.subscriptionId);
  }

  isSavings(sub: Subscription): boolean {
    return sub.plan?.type === 'SAVINGS';
  }

  onSubscriptionChange(): void {
    const sub = this.selectedSubscription;
    if (!sub) {
      this.form.patchValue({ amount: '' });
      return;
    }

    this.form.patchValue({
      amount: this.isSavings(sub) ? '' : sub.nextPaymentAmount ?? '',
    });
  }
}
