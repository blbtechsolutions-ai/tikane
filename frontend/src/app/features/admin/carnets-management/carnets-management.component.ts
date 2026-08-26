import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';
import { Plan, PLAN_TYPE_LABELS } from '../../../core/models/plan.model';
import { Subscription } from '../../../core/models/payment.model';
import { User } from '../../../core/models/user.model';
import { CarnetCalendarComponent } from '../../../shared/carnet-calendar/carnet-calendar.component';

interface CarnetFormModel {
  userId: string;
  planId: string;
  startDate: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiarySignature: string;
}

@Component({
  selector: 'app-carnets-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CarnetCalendarComponent],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header flex items-center justify-between">
        <div>
          <h1>Carnets numériques</h1>
          <p>Créez des dossiers clients et gérez les versements en espèces</p>
        </div>
        <button mat-flat-button type="button" (click)="showCreateForm = !showCreateForm"
          class="!rounded-xl !px-4 !py-2 text-white" style="background: #1e40af">
          <mat-icon class="mr-2">{{ showCreateForm ? 'close' : 'library_add' }}</mat-icon>
          {{ showCreateForm ? 'Fermer' : 'Nouveau carnet' }}
        </button>
      </div>

      <!-- Formulaire création (collapsible) -->
      <div *ngIf="showCreateForm" class="tikane-card space-y-4">
        <h3 class="font-semibold" style="color: var(--text-primary)">Ouvrir un dossier</h3>

        <div *ngIf="catalogLoading" class="flex justify-center py-6">
          <mat-spinner diameter="32"></mat-spinner>
        </div>

        <div *ngIf="!catalogLoading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Client *</label>
            <select [(ngModel)]="form.userId" name="userId" (ngModelChange)="onUserChange()"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
              <option value="">Sélectionnez un client...</option>
              <option *ngFor="let user of users" [value]="user.id">
                {{ user.firstName }} {{ user.lastName }} · {{ user.email }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Plan *</label>
            <select [(ngModel)]="form.planId" name="planId"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
              <option value="">Sélectionnez un plan...</option>
              <option *ngFor="let plan of plans" [value]="plan.id">
                {{ plan.name }} · {{ planTypeLabels[plan.type] }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Date de départ</label>
            <input [(ngModel)]="form.startDate" name="startDate" type="date"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>

          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Nom bénéficiaire</label>
            <input [(ngModel)]="form.beneficiaryName" name="beneficiaryName" placeholder="Nom sur le carnet"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>

          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Téléphone</label>
            <input [(ngModel)]="form.beneficiaryPhone" name="beneficiaryPhone" placeholder="+509..."
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>

          <div>
            <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Signature</label>
            <input [(ngModel)]="form.beneficiarySignature" name="beneficiarySignature" placeholder="Nom saisi ou mention"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>
        </div>

        <div *ngIf="!catalogLoading" class="flex justify-end pt-2">
          <button mat-flat-button type="button" (click)="createCarnet()" [disabled]="creating"
            class="!rounded-xl !px-6 text-white" style="background: #1e40af">
            <mat-icon class="mr-2">library_add</mat-icon>
            {{ creating ? 'Création en cours...' : 'Créer le carnet' }}
          </button>
        </div>
      </div>

      <!-- Barre de recherche + filtres -->
      <div class="tikane-card !p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none"
              style="color: var(--text-muted)">search</mat-icon>
            <input [(ngModel)]="searchQuery" name="search"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Rechercher par client, nom bénéficiaire ou n° dossier..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>

          <select [(ngModel)]="filterStatus" name="filterStatus" (ngModelChange)="onFilterChange()"
            class="px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
            style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary); min-width: 140px">
            <option value="">Tous statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="COMPLETED">Complété</option>
            <option value="CANCELLED">Annulé</option>
          </select>

          <select [(ngModel)]="filterTouchStatus" name="filterTouchStatus" (ngModelChange)="onFilterChange()"
            class="px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
            style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary); min-width: 150px">
            <option value="">Toutes touches</option>
            <option value="PENDING">En attente</option>
            <option value="READY">Prêt à toucher</option>
            <option value="TOUCHED">Touché</option>
          </select>
        </div>

        <p class="text-xs mt-2.5" style="color: var(--text-muted)">
          {{ total }} dossier{{ total !== 1 ? 's' : '' }} trouvé{{ total !== 1 ? 's' : '' }}
          <span *ngIf="searchQuery"> pour «&nbsp;{{ searchQuery }}&nbsp;»</span>
        </p>
      </div>

      <!-- Liste des carnets -->
      <div *ngIf="loading" class="flex justify-center py-16">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div *ngIf="!loading && carnets.length === 0" class="tikane-card text-center py-16">
        <div class="text-5xl mb-4">📂</div>
        <h3 class="font-semibold mb-1" style="color: var(--text-primary)">Aucun dossier trouvé</h3>
        <p class="text-sm" style="color: var(--text-muted)">
          {{ searchQuery ? 'Essayez d\'autres termes de recherche' : 'Créez le premier carnet avec le bouton ci-dessus' }}
        </p>
      </div>

      <div *ngIf="!loading && carnets.length > 0" class="space-y-3">
        <div *ngFor="let carnet of carnets"
          class="tikane-card !p-0 overflow-hidden transition-shadow hover:shadow-card-hover">

          <!-- En-tête dossier -->
          <div class="flex items-start justify-between gap-4 p-4 pb-3"
            style="border-bottom: 1px solid var(--surface-border)">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="font-mono text-sm font-bold" style="color: var(--text-primary)">
                  {{ carnet.dossierNumber || carnet.subscriptionNumber }}
                </span>
                <span class="badge badge-purple text-xs">{{ getPlanTypeLabel(carnet) }}</span>
                <span [class]="'status-' + carnet.status">{{ carnet.status }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  [style.background]="touchBg(carnet.touchStatus)"
                  [style.color]="touchColor(carnet.touchStatus)">
                  {{ touchLabel(carnet.touchStatus) }}
                </span>
              </div>
              <p class="text-sm font-semibold truncate" style="color: var(--text-primary)">
                {{ carnet.user?.firstName }} {{ carnet.user?.lastName }}
                <span class="font-normal text-xs ml-1" style="color: var(--text-muted)">
                  · {{ carnet.plan?.name }}
                </span>
              </p>
              <p class="text-xs" style="color: var(--text-muted)">
                Bénéficiaire: {{ carnet.beneficiaryName || '—' }}
                <span *ngIf="carnet.beneficiaryPhone"> · {{ carnet.beneficiaryPhone }}</span>
                · Début: {{ carnet.startDate | date:'dd/MM/yyyy' }}
              </p>
            </div>

            <div class="text-right shrink-0">
              <p class="text-base font-bold text-purple-600">{{ carnet.totalPaid | number }} HTG</p>
              <p class="text-xs" style="color: var(--text-muted)" *ngIf="!isSavings(carnet)">/ {{ carnet.totalDue | number }} HTG total</p>
              <p class="text-xs" style="color: var(--text-muted)" *ngIf="isSavings(carnet)">Solde epargne</p>
              <p class="text-xs font-medium text-emerald-500" *ngIf="!isSavings(carnet)">
                Touche: {{ carnet.plan?.finalAmount | number }} HTG
              </p>
              <p class="text-xs font-medium text-emerald-500" *ngIf="isSavings(carnet)">Epargne libre</p>
            </div>
          </div>

          <!-- Barre de progression -->
          <div class="px-4 py-2" style="background: var(--surface-bg)" *ngIf="!isSavings(carnet)">
            <div class="flex items-center justify-between text-xs mb-1.5" style="color: var(--text-muted)">
              <span>{{ carnet.currentDay }} / {{ carnet.totalDays }} jours versés</span>
              <span class="font-semibold">{{ progressPct(carnet) }}%</span>
            </div>
            <div class="h-2 rounded-full overflow-hidden" style="background: var(--surface-border)">
              <div class="h-full rounded-full transition-all"
                style="background: linear-gradient(90deg, #6366f1, #8b5cf6)"
                [style.width]="progressPct(carnet) + '%'"></div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-2 px-4 py-3">
            <button *ngIf="carnet.touchStatus === 'READY'"
              mat-flat-button type="button" (click)="markTouched(carnet)" [disabled]="processingId === carnet.id"
              class="!rounded-xl text-white !text-xs" style="background: linear-gradient(135deg, #10b981, #059669)">
              <mat-icon class="mr-1 text-base">check_circle</mat-icon>
              {{ processingId === carnet.id ? 'Traitement...' : 'Marquer touché' }}
            </button>

            <span *ngIf="carnet.touchStatus === 'TOUCHED' && carnet.touchedAt"
              class="text-xs font-medium flex items-center gap-1" style="color: #10b981">
              <mat-icon class="text-base">verified</mat-icon>
              Touché le {{ carnet.touchedAt | date:'dd/MM/yyyy' }}
              <span *ngIf="carnet.touchReference" style="color: var(--text-muted)">· Réf: {{ carnet.touchReference }}</span>
            </span>

            <div class="flex-1"></div>

            <button *ngIf="carnet.status === 'ACTIVE'"
              mat-stroked-button type="button" (click)="togglePaymentForm(carnet.id)"
              class="!rounded-xl !text-xs">
              <mat-icon class="mr-1 text-base">{{ paymentFormId === carnet.id ? 'close' : 'add_card' }}</mat-icon>
              {{ paymentFormId === carnet.id ? 'Annuler' : 'Versement cash' }}
            </button>
            <button *ngIf="!isSavings(carnet)" mat-stroked-button type="button" (click)="toggleCalendar(carnet.id)"
              class="!rounded-xl !text-xs">
              <mat-icon class="mr-1 text-base">
                {{ calendarLoading === carnet.id ? 'hourglass_top' : (calendarCarnetId === carnet.id ? 'calendar_view_month' : 'calendar_today') }}
              </mat-icon>
              {{ calendarCarnetId === carnet.id ? 'Fermer carnet' : 'Voir carnet' }}
            </button>          </div>

          <!-- Panneau versement cash (collapsible) -->
          <div *ngIf="paymentFormId === carnet.id"
            class="mx-4 mb-4 rounded-xl p-4 space-y-3"
            style="background: var(--surface-card); border: 2px solid #6366f1">
            <div class="flex items-center gap-2 mb-1">
              <mat-icon class="text-indigo-500">payments</mat-icon>
              <p class="text-sm font-semibold" style="color: var(--text-primary)">Enregistrer un versement en espèces</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div *ngIf="!isSavings(carnet)">
                <label class="block text-xs font-medium mb-1" style="color: var(--text-secondary)">
                  Jour n° <span class="opacity-60">(suivant: {{ carnet.nextPaymentDayNumber }})</span>
                </label>
                <input [(ngModel)]="paymentForm.dayNumber" name="dayNumber" type="number" min="1" readonly
                  [max]="carnet.totalDays"
                  class="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1" style="color: var(--text-secondary)">Montant (HTG) *</label>
                <input [(ngModel)]="paymentForm.amount" name="amount" type="number" min="1" [readonly]="!isSavings(carnet)"
                  placeholder="Ex: 100"
                  class="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1" style="color: var(--text-secondary)">Notes (optionnel)</label>
                <input [(ngModel)]="paymentForm.notes" name="notes" placeholder="Reçu n°, remarque..."
                  class="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
              </div>
            </div>

            <div class="flex justify-end">
              <button mat-flat-button type="button" (click)="recordPayment(carnet)" [disabled]="recordingPayment"
                class="!rounded-xl text-white" style="background: #6366f1">
                <mat-icon class="mr-2">save</mat-icon>
                {{ recordingPayment ? 'Enregistrement...' : 'Confirmer le versement' }}
              </button>
            </div>
          </div>

          <!-- Panneau calendrier (collapsible) -->
          <div *ngIf="calendarCarnetId === carnet.id && calendarData.has(carnet.id)"
            class="mx-4 mb-4 rounded-xl p-4"
            style="background: var(--surface-card); border: 2px solid rgba(99,102,241,0.25)">
            <div class="flex items-center gap-2 mb-4">
              <mat-icon class="text-indigo-400">calendar_today</mat-icon>
              <p class="text-sm font-semibold" style="color: var(--text-primary)">
                Carnet de versements &ndash;
                <span style="color: var(--text-muted)">{{ carnet.dossierNumber || carnet.subscriptionNumber }}</span>
              </p>
              <span class="ml-auto text-xs" style="color: var(--text-muted)">
                {{ calendarData.get(carnet.id)?.currentDay }} / {{ calendarData.get(carnet.id)?.totalDays }} jours
              </span>
            </div>
            <app-carnet-calendar
              *ngIf="!isSavings(carnet)"
              [progress]="calendarData.get(carnet.id)?.progress ?? []"
              [startDate]="calendarData.get(carnet.id)?.startDate">
            </app-carnet-calendar>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && totalPages > 1"
        class="flex items-center justify-between px-4 py-3 tikane-card">
        <span class="text-sm" style="color: var(--text-muted)">
          Page {{ page }} / {{ totalPages }} · {{ total }} dossiers
        </span>
        <div class="flex gap-2">
          <button mat-stroked-button [disabled]="page <= 1" (click)="prevPage()" class="!rounded-xl">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-stroked-button [disabled]="page >= totalPages" (click)="nextPage()" class="!rounded-xl">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CarnetsManagementComponent implements OnInit {
  users: User[] = [];
  plans: Plan[] = [];
  carnets: Subscription[] = [];
  loading = true;
  catalogLoading = true;
  creating = false;
  processingId: string | null = null;
  planTypeLabels = PLAN_TYPE_LABELS;
  form: CarnetFormModel = this.createEmptyForm();
  showCreateForm = false;

  // Recherche + filtres
  searchQuery = '';
  filterStatus = '';
  filterTouchStatus = '';
  private searchSubject = new Subject<string>();

  // Pagination
  page = 1;
  totalPages = 1;
  total = 0;
  readonly pageSize = 15;

  // Versement cash
  paymentFormId: string | null = null;
  paymentForm: { dayNumber: number | null; amount: number | null; notes: string } = { dayNumber: 1, amount: null, notes: '' };
  recordingPayment = false;

  // Calendrier
  calendarCarnetId: string | null = null;
  calendarData: Map<string, any> = new Map();
  calendarLoading: string | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadCarnets();
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.loadCarnets();
    });
  }

  loadCatalogs(): void {
    this.catalogLoading = true;
    forkJoin({
      users: this.adminService.listUsers({ limit: 200, role: 'CLIENT', status: 'ACTIVE' }),
      plans: this.adminService.listAllPlans({ limit: 100, status: 'ACTIVE' }),
    }).subscribe({
      next: ({ users, plans }) => {
        this.users = users.data;
        this.plans = plans.data;
        this.catalogLoading = false;
      },
      error: () => { this.catalogLoading = false; },
    });
  }

  loadCarnets(): void {
    this.loading = true;
    const params: Record<string, any> = {
      page: this.page,
      limit: this.pageSize,
    };
    if (this.filterStatus) params['status'] = this.filterStatus;
    if (this.filterTouchStatus) params['touchStatus'] = this.filterTouchStatus;
    if (this.searchQuery.trim()) params['search'] = this.searchQuery.trim();

    this.adminService.listAllSubscriptions(params).subscribe({
      next: (result) => {
        this.carnets = result.data;
        this.total = result.pagination.total;
        this.totalPages = result.pagination.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadCarnets();
  }

  prevPage(): void {
    if (this.page <= 1) return;
    this.page--;
    this.loadCarnets();
  }

  nextPage(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.loadCarnets();
  }

  progressPct(carnet: Subscription): number {
    if (this.isSavings(carnet)) return 0;
    if (!carnet.totalDays || carnet.totalDays === 0) return 0;
    return Math.round(((carnet.currentDay ?? 0) / carnet.totalDays) * 100);
  }

  onUserChange(): void {
    const user = this.users.find((item) => item.id === this.form.userId);
    if (!user) return;
    this.form.beneficiaryName = `${user.firstName} ${user.lastName}`;
    this.form.beneficiaryPhone = user.phone ?? '';
    this.form.beneficiarySignature = `${user.firstName} ${user.lastName}`;
  }

  createCarnet(): void {
    if (!this.form.userId || !this.form.planId) {
      this.toastr.error('Sélectionnez un client et un plan');
      return;
    }
    this.creating = true;
    this.adminService.createManagedSubscription({
      userId: this.form.userId,
      planId: this.form.planId,
      startDate: this.form.startDate ? new Date(this.form.startDate).toISOString() : undefined,
      beneficiaryName: this.form.beneficiaryName || undefined,
      beneficiaryPhone: this.form.beneficiaryPhone || undefined,
      beneficiarySignature: this.form.beneficiarySignature || undefined,
    }).subscribe({
      next: () => {
        this.form = this.createEmptyForm();
        this.creating = false;
        this.showCreateForm = false;
        this.toastr.success('Carnet créé avec succès');
        this.page = 1;
        this.loadCarnets();
      },
      error: (err: any) => {
        this.creating = false;
        this.toastr.error(err.error?.message || 'Erreur lors de la création');
      },
    });
  }

  markTouched(carnet: Subscription): void {
    const touchReference = prompt('Référence de touche (optionnel)') ?? '';
    this.processingId = carnet.id;
    this.adminService.markSubscriptionTouched(carnet.id, {
      touchReference: touchReference || undefined,
    }).subscribe({
      next: (updated) => {
        this.carnets = this.carnets.map((item) => item.id === carnet.id ? updated : item);
        this.processingId = null;
        this.toastr.success('Carnet marqué comme touché');
      },
      error: (err: any) => {
        this.processingId = null;
        this.toastr.error(err.error?.message || 'Erreur');
      },
    });
  }

  togglePaymentForm(carnetId: string): void {
    if (this.paymentFormId === carnetId) {
      this.paymentFormId = null;
    } else {
      const carnet = this.carnets.find((c) => c.id === carnetId);
      this.paymentForm = {
        dayNumber: this.isSavings(carnet) ? null : carnet?.nextPaymentDayNumber ?? 1,
        amount: this.isSavings(carnet) ? null : carnet?.nextPaymentAmount ?? null,
        notes: '',
      };
      this.paymentFormId = carnetId;
    }
  }

  recordPayment(carnet: Subscription): void {
    if (!this.paymentForm.amount || this.paymentForm.amount <= 0) {
      this.toastr.error('Saisissez un montant valide');
      return;
    }
    this.recordingPayment = true;
    this.adminService.adminCollectPayment({
      subscriptionId: carnet.id,
      amount: Number(this.paymentForm.amount),
      dayNumber: this.isSavings(carnet) ? undefined : this.paymentForm.dayNumber || undefined,
      notes: this.paymentForm.notes || undefined,
    }).subscribe({
      next: () => {
        this.toastr.success(this.isSavings(carnet) ? 'Depot epargne enregistre' : `Versement jour ${this.paymentForm.dayNumber} enregistré`);
        this.paymentFormId = null;
        this.recordingPayment = false;
        this.loadCarnets();
      },
      error: (err: any) => {
        this.recordingPayment = false;
        this.toastr.error(err.error?.message || 'Erreur lors du versement');
      },
    });
  }

  toggleCalendar(id: string): void {
    if (this.calendarCarnetId === id) {
      this.calendarCarnetId = null;
      return;
    }
    if (this.calendarData.has(id)) {
      this.calendarCarnetId = id;
      return;
    }
    this.calendarLoading = id;
    this.adminService.getSubscriptionDetail(id).subscribe({
      next: (detail) => {
        this.calendarData.set(id, detail);
        this.calendarCarnetId = id;
        this.calendarLoading = null;
      },
      error: () => {
        this.calendarLoading = null;
        this.toastr.error('Impossible de charger le carnet');
      },
    });
  }

  touchLabel(status?: string): string {
    switch (status) {
      case 'READY': return 'Prêt à toucher';
      case 'TOUCHED': return 'Touché';
      default: return 'En attente';
    }
  }

  touchBg(status?: string): string {
    switch (status) {
      case 'READY': return 'rgba(245, 158, 11, 0.15)';
      case 'TOUCHED': return 'rgba(16, 185, 129, 0.15)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }

  touchColor(status?: string): string {
    switch (status) {
      case 'READY': return '#f59e0b';
      case 'TOUCHED': return '#10b981';
      default: return 'var(--text-muted)';
    }
  }

  getPlanTypeLabel(carnet: Subscription): string {
    const planType = carnet.plan?.type as keyof typeof PLAN_TYPE_LABELS | undefined;
    return planType ? this.planTypeLabels[planType] : 'Carnet';
  }

  isSavings(carnet?: Subscription): boolean {
    return carnet?.plan?.type === 'SAVINGS';
  }

  private createEmptyForm(): CarnetFormModel {
    return { userId: '', planId: '', startDate: '', beneficiaryName: '', beneficiaryPhone: '', beneficiarySignature: '' };
  }
}

