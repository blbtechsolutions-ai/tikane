import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { Plan, PLAN_TYPE_LABELS } from '../../../core/models/plan.model';
import { Payment, Subscription } from '../../../core/models/payment.model';
import { User } from '../../../core/models/user.model';
import { AgentService, AgentWorkspaceSummary } from '../agent.service';

interface AgentCarnetForm {
  userId: string;
  planId: string;
  startDate: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiarySignature: string;
}

interface AgentCollectionForm {
  subscriptionId: string;
  amount: number | null;
  method: string;
  dayNumber: number | null;
  externalReference: string;
  notes: string;
}

@Component({
  selector: 'app-agent-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Terrain agent</h1>
        <p>Ouvrez des carnets, encaissez les versements et remettez les touches de vos dossiers</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <ng-container *ngIf="!loading">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="tikane-card" *ngFor="let card of summaryCards()">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs font-medium uppercase tracking-wider mb-3" style="color: var(--text-muted)">{{ card.label }}</p>
                <p class="text-2xl font-bold font-display" style="color: var(--text-primary)">{{ card.value }}</p>
              </div>
              <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" [style.background]="card.bg">
                <mat-icon [style.color]="card.color">{{ card.icon }}</mat-icon>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div class="tikane-card space-y-4">
            <div>
              <h3 class="font-semibold" style="color: var(--text-primary)">Nouveau carnet terrain</h3>
              <p class="text-sm" style="color: var(--text-muted)">Créez un dossier pour un client actif de votre zone.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Client</label>
                <select [(ngModel)]="carnetForm.userId" name="userId" (ngModelChange)="onClientChange()"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
                  <option value="">Sélectionnez...</option>
                  <option *ngFor="let user of clients" [value]="user.id">{{ user.firstName }} {{ user.lastName }} · {{ user.phone || user.email }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Plan</label>
                <select [(ngModel)]="carnetForm.planId" name="planId"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
                  <option value="">Sélectionnez...</option>
                  <option *ngFor="let plan of plans" [value]="plan.id">{{ plan.name }} · {{ planTypeLabel(plan.type) }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Date de départ</label>
                <input [(ngModel)]="carnetForm.startDate" name="startDate" type="date"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Bénéficiaire</label>
                <input [(ngModel)]="carnetForm.beneficiaryName" name="beneficiaryName"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Téléphone</label>
                <input [(ngModel)]="carnetForm.beneficiaryPhone" name="beneficiaryPhone"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Signature</label>
                <input [(ngModel)]="carnetForm.beneficiarySignature" name="beneficiarySignature"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>
            </div>

            <button mat-flat-button type="button" (click)="createCarnet()" [disabled]="creatingCarnet"
              class="!rounded-xl text-white" style="background: linear-gradient(135deg, #0f766e, #14b8a6)">
              <mat-icon class="mr-2">library_add</mat-icon>
              {{ creatingCarnet ? 'Création...' : 'Ouvrir le carnet' }}
            </button>
          </div>

          <div class="tikane-card space-y-4">
            <div>
              <h3 class="font-semibold" style="color: var(--text-primary)">Encaissement terrain</h3>
              <p class="text-sm" style="color: var(--text-muted)">Enregistrez un versement pour l'un de vos carnets actifs.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Carnet</label>
                <select [(ngModel)]="collectionForm.subscriptionId" name="subscriptionId" (ngModelChange)="onCollectionCarnetChange()"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
                  <option value="">Sélectionnez...</option>
                  <option *ngFor="let carnet of collectableCarnets()" [value]="carnet.id">{{ carnetLabel(carnet) }}</option>
                </select>
                <p *ngIf="selectedCollectCarnet()" class="mt-2 text-xs" style="color: var(--text-muted)">
                  Reste: {{ selectedCollectCarnet()?.remainingAmount | number }} HTG · Jour courant: {{ selectedCollectCarnet()?.currentDay }}
                </p>
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Montant encaissé</label>
                <input [(ngModel)]="collectionForm.amount" name="amount" type="number"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Méthode</label>
                <select [(ngModel)]="collectionForm.method" name="method"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
                  <option value="AGENT_COLLECTION">Collecte agent</option>
                  <option value="CASH">Espèces</option>
                  <option value="MONCASH">MonCash</option>
                  <option value="NATCASH">NatCash</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Jour</label>
                <input [(ngModel)]="collectionForm.dayNumber" name="dayNumber" type="number"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>

              <div>
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Référence externe</label>
                <input [(ngModel)]="collectionForm.externalReference" name="externalReference"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>

              <div class="md:col-span-2">
                <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Notes</label>
                <textarea [(ngModel)]="collectionForm.notes" name="notes" rows="3"
                  class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)"></textarea>
              </div>
            </div>

            <button mat-flat-button type="button" (click)="collectPayment()" [disabled]="collectingPayment"
              class="!rounded-xl text-white" style="background: #1e40af">
              <mat-icon class="mr-2">payments</mat-icon>
              {{ collectingPayment ? 'Encaissement...' : 'Encaisser le versement' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div class="xl:col-span-2 tikane-card">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold" style="color: var(--text-primary)">Mes carnets terrain</h3>
                <p class="text-sm" style="color: var(--text-muted)">Vos dossiers actifs, terminés et prêts à remettre.</p>
              </div>
              <button mat-stroked-button type="button" (click)="reloadCarnets()" [disabled]="reloading">
                <mat-icon class="mr-2">refresh</mat-icon>
                Actualiser
              </button>
            </div>

            <div class="space-y-3">
              <div *ngFor="let carnet of carnets" class="rounded-2xl p-4"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border)">
                <div class="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="badge badge-info text-xs">{{ planTypeLabel(carnet.plan?.type) }}</span>
                      <span [class]="'status-' + carnet.status">{{ carnet.status }}</span>
                      <span class="text-[11px] px-2 py-0.5 rounded-full"
                        [style.background]="touchBg(carnet.touchStatus)"
                        [style.color]="touchColor(carnet.touchStatus)">
                        {{ carnet.touchStatus || 'PENDING' }}
                      </span>
                    </div>
                    <h4 class="font-semibold mt-2" style="color: var(--text-primary)">{{ carnetLabel(carnet) }}</h4>
                    <p class="text-sm" style="color: var(--text-secondary)">
                      {{ carnet.user?.firstName }} {{ carnet.user?.lastName }} · {{ carnet.plan?.name }}
                    </p>
                    <p class="text-xs" style="color: var(--text-muted)">
                      Bénéficiaire: {{ carnet.beneficiaryName || '—' }}
                      <span *ngIf="carnet.beneficiaryPhone"> · {{ carnet.beneficiaryPhone }}</span>
                    </p>
                  </div>
                  <div class="text-right min-w-32">
                    <p class="text-sm font-bold text-emerald-500">{{ carnet.totalPaid | number }} / {{ carnet.totalDue | number }} HTG</p>
                    <p class="text-xs" style="color: var(--text-muted)">Jour {{ carnet.currentDay }} / {{ carnet.totalDays }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3 text-xs mb-3" style="color: var(--text-muted)">
                  <span *ngIf="carnet.plan?.finalAmount">Montant à toucher: {{ carnet.plan?.finalAmount | number }} HTG</span>
                  <span *ngIf="carnet.touchReference">Réf. touche: {{ carnet.touchReference }}</span>
                  <span *ngIf="carnet.withdrawalAllowedAt">Disponible: {{ carnet.withdrawalAllowedAt | date:'dd/MM/yyyy' }}</span>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button *ngIf="carnet.touchStatus === 'READY'" mat-flat-button type="button"
                    (click)="markTouched(carnet)" [disabled]="touchingId === carnet.id"
                    class="!rounded-xl text-white" style="background: linear-gradient(135deg, #059669, #10b981)">
                    <mat-icon class="mr-2">check_circle</mat-icon>
                    {{ touchingId === carnet.id ? 'Remise...' : 'Remettre la touche' }}
                  </button>
                </div>
              </div>

              <div *ngIf="carnets.length === 0" class="text-center py-12 text-sm" style="color: var(--text-muted)">
                Aucun carnet affecté à cet agent.
              </div>
            </div>
          </div>

          <div class="tikane-card">
            <div class="mb-4">
              <h3 class="font-semibold" style="color: var(--text-primary)">Derniers encaissements</h3>
              <p class="text-sm" style="color: var(--text-muted)">Historique récent de vos collectes terrain.</p>
            </div>

            <div class="space-y-3">
              <div *ngFor="let payment of workspace?.recentCollections" class="rounded-2xl p-3"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border)">
                <p class="text-sm font-semibold" style="color: var(--text-primary)">
                  {{ payment.subscription?.dossierNumber || payment.subscription?.subscriptionNumber || payment.referenceNumber }}
                </p>
                <p class="text-xs" style="color: var(--text-muted)">
                  {{ payment.user?.firstName }} {{ payment.user?.lastName }}
                  <span *ngIf="payment.subscription?.plan?.name"> · {{ payment.subscription?.plan?.name }}</span>
                </p>
                <div class="flex items-center justify-between mt-2 text-xs">
                  <span style="color: var(--text-muted)">{{ payment.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  <span class="font-semibold text-emerald-500">{{ payment.amount | number }} HTG</span>
                </div>
              </div>

              <div *ngIf="(workspace?.recentCollections?.length ?? 0) === 0" class="text-center py-10 text-sm" style="color: var(--text-muted)">
                Aucun encaissement récent.
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class AgentWorkspaceComponent implements OnInit {
  workspace: AgentWorkspaceSummary | null = null;
  clients: User[] = [];
  plans: Plan[] = [];
  carnets: Subscription[] = [];
  loading = true;
  reloading = false;
  creatingCarnet = false;
  collectingPayment = false;
  touchingId: string | null = null;
  carnetForm: AgentCarnetForm = this.createEmptyCarnetForm();
  collectionForm: AgentCollectionForm = this.createEmptyCollectionForm();

  constructor(
    private agentService: AgentService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadWorkspace();
  }

  loadWorkspace(): void {
    this.loading = true;
    forkJoin({
      workspace: this.agentService.getWorkspace(),
      clients: this.agentService.listClients({ limit: 100 }),
      plans: this.agentService.listPlans({ status: 'ACTIVE', limit: 100 }),
      carnets: this.agentService.listMyCarnets({ limit: 100 }),
    }).subscribe({
      next: ({ workspace, clients, plans, carnets }) => {
        this.workspace = workspace;
        this.clients = clients.data;
        this.plans = plans.data;
        this.carnets = carnets.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  reloadCarnets(): void {
    this.reloading = true;
    forkJoin({
      workspace: this.agentService.getWorkspace(),
      carnets: this.agentService.listMyCarnets({ limit: 100 }),
    }).subscribe({
      next: ({ workspace, carnets }) => {
        this.workspace = workspace;
        this.carnets = carnets.data;
        this.reloading = false;
      },
      error: () => {
        this.reloading = false;
      },
    });
  }

  onClientChange(): void {
    const client = this.clients.find((item) => item.id === this.carnetForm.userId);
    if (!client) return;
    this.carnetForm.beneficiaryName = `${client.firstName} ${client.lastName}`;
    this.carnetForm.beneficiaryPhone = client.phone ?? '';
    this.carnetForm.beneficiarySignature = `${client.firstName} ${client.lastName}`;
  }

  onCollectionCarnetChange(): void {
    const carnet = this.selectedCollectCarnet();
    if (!carnet) return;
    this.collectionForm.dayNumber = carnet.currentDay;
    if (!this.collectionForm.amount) {
      this.collectionForm.amount = Number(carnet.remainingAmount) > 0 ? Number(carnet.remainingAmount) : null;
    }
  }

  createCarnet(): void {
    if (!this.carnetForm.userId || !this.carnetForm.planId) {
      this.toastr.error('Sélectionnez un client et un plan');
      return;
    }

    this.creatingCarnet = true;
    this.agentService.createCarnet({
      userId: this.carnetForm.userId,
      planId: this.carnetForm.planId,
      startDate: this.carnetForm.startDate ? new Date(this.carnetForm.startDate).toISOString() : undefined,
      beneficiaryName: this.carnetForm.beneficiaryName || undefined,
      beneficiaryPhone: this.carnetForm.beneficiaryPhone || undefined,
      beneficiarySignature: this.carnetForm.beneficiarySignature || undefined,
    }).subscribe({
      next: (subscription) => {
        this.carnets = [subscription, ...this.carnets];
        this.workspace = this.workspace
          ? { ...this.workspace, activeCarnets: this.workspace.activeCarnets + 1 }
          : this.workspace;
        this.carnetForm = this.createEmptyCarnetForm();
        this.creatingCarnet = false;
        this.toastr.success('Carnet créé sur votre portefeuille terrain');
      },
      error: () => {
        this.creatingCarnet = false;
      },
    });
  }

  collectPayment(): void {
    if (!this.collectionForm.subscriptionId || !this.collectionForm.amount || this.collectionForm.amount <= 0) {
      this.toastr.error('Sélectionnez un carnet et un montant');
      return;
    }

    this.collectingPayment = true;
    this.agentService.collectPayment({
      subscriptionId: this.collectionForm.subscriptionId,
      amount: Number(this.collectionForm.amount),
      method: this.collectionForm.method,
      dayNumber: this.collectionForm.dayNumber || undefined,
      externalReference: this.collectionForm.externalReference || undefined,
      notes: this.collectionForm.notes || undefined,
    }).subscribe({
      next: () => {
        this.collectionForm = this.createEmptyCollectionForm();
        this.collectingPayment = false;
        this.toastr.success('Versement encaissé avec succès');
        this.reloadCarnets();
      },
      error: () => {
        this.collectingPayment = false;
      },
    });
  }

  markTouched(carnet: Subscription): void {
    const touchReference = prompt('Référence de remise (optionnel)') ?? '';
    this.touchingId = carnet.id;
    this.agentService.markTouched(carnet.id, {
      touchReference: touchReference || undefined,
    }).subscribe({
      next: (updated) => {
        this.carnets = this.carnets.map((item) => item.id === carnet.id ? updated : item);
        this.touchingId = null;
        this.toastr.success('Touche remise et carnet marqué comme touché');
        this.reloadCarnets();
      },
      error: () => {
        this.touchingId = null;
      },
    });
  }

  collectableCarnets(): Subscription[] {
    return this.carnets.filter((carnet) => carnet.status === 'ACTIVE' && Number(carnet.remainingAmount) > 0);
  }

  selectedCollectCarnet(): Subscription | undefined {
    return this.carnets.find((item) => item.id === this.collectionForm.subscriptionId);
  }

  carnetLabel(carnet: Subscription): string {
    const reference = carnet.dossierNumber || carnet.subscriptionNumber;
    return `${reference} · ${carnet.user?.firstName ?? ''} ${carnet.user?.lastName ?? ''}`.trim();
  }

  planTypeLabel(type?: string): string {
    if (!type) return 'Carnet';
    return PLAN_TYPE_LABELS[type as keyof typeof PLAN_TYPE_LABELS] ?? type;
  }

  touchBg(status?: string): string {
    switch (status) {
      case 'READY':
        return 'rgba(245, 158, 11, 0.15)';
      case 'TOUCHED':
        return 'rgba(16, 185, 129, 0.15)';
      default:
        return 'rgba(107, 114, 128, 0.15)';
    }
  }

  touchColor(status?: string): string {
    switch (status) {
      case 'READY':
        return '#f59e0b';
      case 'TOUCHED':
        return '#10b981';
      default:
        return 'var(--text-secondary)';
    }
  }

  summaryCards(): Array<{ label: string; value: string; icon: string; color: string; bg: string }> {
    return [
      {
        label: 'Code agent',
        value: this.workspace?.agent?.agentCode ?? '—',
        icon: 'badge',
        color: '#0f766e',
        bg: 'rgba(15, 118, 110, 0.12)',
      },
      {
        label: 'Carnets actifs',
        value: String(this.workspace?.activeCarnets ?? 0),
        icon: 'book',
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
      },
      {
        label: 'Touches à remettre',
        value: String(this.workspace?.readyTouches ?? 0),
        icon: 'task_alt',
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
      },
      {
        label: 'Commissions en attente',
        value: `${Number(this.workspace?.pendingCommissions ?? 0).toLocaleString()} HTG`,
        icon: 'payments',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
      },
    ];
  }

  private createEmptyCarnetForm(): AgentCarnetForm {
    return {
      userId: '',
      planId: '',
      startDate: '',
      beneficiaryName: '',
      beneficiaryPhone: '',
      beneficiarySignature: '',
    };
  }

  private createEmptyCollectionForm(): AgentCollectionForm {
    return {
      subscriptionId: '',
      amount: null,
      method: 'AGENT_COLLECTION',
      dayNumber: null,
      externalReference: '',
      notes: '',
    };
  }
}