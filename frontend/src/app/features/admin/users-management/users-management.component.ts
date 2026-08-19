import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

type UserCreationTab = 'client' | 'agent' | 'admin';

interface UserDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  commissionRate: number;
  zone: string;
  preferredLanguage: 'fr' | 'ht';
}

interface CreatedCredentials {
  fullName: string;
  email: string;
  password: string;
  role: string;
  agentCode?: string;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Gestion des utilisateurs</h1>
        <p>{{ pagination.total }} comptes affichés</p>
      </div>

      <!-- Tabs: Client / Agent / Admin creation -->
      <div class="flex gap-2 border-b" style="border-color: var(--surface-border)">
        <button (click)="setActiveTab('client')"
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          [style.border-color]="activeTab === 'client' ? '#1e40af' : 'transparent'"
          [style.color]="activeTab === 'client' ? '#1e40af' : 'var(--text-muted)'">
          Nouveau client
        </button>
        <button (click)="setActiveTab('agent')"
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          [style.border-color]="activeTab === 'agent' ? '#1e40af' : 'transparent'"
          [style.color]="activeTab === 'agent' ? '#1e40af' : 'var(--text-muted)'">
          Nouvel agent
        </button>
        <button *ngIf="isSuperAdmin" (click)="setActiveTab('admin')"
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          [style.border-color]="activeTab === 'admin' ? '#1e40af' : 'transparent'"
          [style.color]="activeTab === 'admin' ? '#1e40af' : 'var(--text-muted)'">
          Nouveau admin
        </button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="tikane-card xl:col-span-2 space-y-4">
          <div>
            <h3 class="font-semibold" style="color: var(--text-primary)">
              {{ creationTitle }}
            </h3>
            <p class="text-sm" style="color: var(--text-muted)">
              <span *ngIf="activeTab === 'client'">Créez un compte client avec un mot de passe temporaire. Le client pourra ensuite se connecter et changer son mot de passe.</span>
              <span *ngIf="activeTab === 'agent'">Créez un compte agent avec accès à l'espace terrain. L'agent pourra collecter les paiements des clients.</span>
              <span *ngIf="activeTab === 'admin'">Créez un compte administrateur. Réservé aux super-admins. L'admin aura accès à la gestion complète de la plateforme.</span>
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Prénom</label>
              <input [(ngModel)]="draft.firstName" name="firstName"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Nom</label>
              <input [(ngModel)]="draft.lastName" name="lastName"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Email</label>
              <input [(ngModel)]="draft.email" name="email" type="email"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Téléphone</label>
              <input [(ngModel)]="draft.phone" name="phone"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Mot de passe temporaire</label>
              <input [(ngModel)]="draft.password" name="password" type="text" autocomplete="off"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Langue</label>
              <select [(ngModel)]="draft.preferredLanguage" name="preferredLanguage"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
                <option value="fr">Français</option>
                <option value="ht">Kreyòl</option>
              </select>
            </div>

            <div *ngIf="activeTab === 'agent'">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Zone / Secteur</label>
              <input [(ngModel)]="draft.zone" name="zone" placeholder="Ex: Port-au-Prince Nord"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>

            <div *ngIf="activeTab === 'agent'">
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Commission (%)</label>
              <input [(ngModel)]="draft.commissionRate" name="commissionRate" type="number" min="0" max="100" step="0.5"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>
          </div>

          <div class="flex justify-end">
            <button mat-flat-button type="button" (click)="createUser()" [disabled]="creating"
              class="!rounded-xl text-white" style="background: #1e40af">
              <mat-icon class="mr-2">person_add</mat-icon>
              {{ creating ? 'Création...' : creationButtonLabel }}
            </button>
          </div>
        </div>

        <div class="tikane-card" *ngIf="lastCreatedCredentials as credentials">
          <h3 class="font-semibold mb-3" style="color: var(--text-primary)">Identifiants à transmettre</h3>
          <div class="space-y-2 text-sm">
            <p style="color: var(--text-secondary)"><strong style="color: var(--text-primary)">{{ credentials.role }}:</strong> {{ credentials.fullName }}</p>
            <p style="color: var(--text-secondary)"><strong style="color: var(--text-primary)">Email:</strong> {{ credentials.email }}</p>
            <p style="color: var(--text-secondary)"><strong style="color: var(--text-primary)">Mot de passe:</strong> {{ credentials.password }}</p>
            <p *ngIf="credentials.agentCode" style="color: var(--text-secondary)">
              <strong style="color: var(--text-primary)">Code agent:</strong>
              <span class="font-mono ml-1">{{ credentials.agentCode }}</span>
            </p>
          </div>
          <p class="text-xs mt-3" style="color: var(--text-muted)">
            La personne pourra se connecter puis modifier ce mot de passe depuis son espace.
          </p>
        </div>
      </div>

      <!-- Search & filter bar -->
      <div class="tikane-card !p-4 flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-48 relative">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-base" style="color: var(--text-muted)">search</mat-icon>
          <input [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Rechercher..."
            class="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
            style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
        </div>

        <select [(ngModel)]="filterRole" (ngModelChange)="page = 1; loadUsers()"
          class="px-3 py-2 rounded-xl text-sm outline-none"
          style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
          <option value="">Tous les rôles</option>
          <option value="CLIENT">Client</option>
          <option value="AGENT">Agent</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN" *ngIf="isSuperAdmin">Super Admin</option>
        </select>

        <select [(ngModel)]="filterStatus" (ngModelChange)="page = 1; loadUsers()"
          class="px-3 py-2 rounded-xl text-sm outline-none"
          style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)">
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="PENDING_VERIFICATION">En attente vérification</option>
          <option value="SUSPENDED">Suspendu</option>
          <option value="BANNED">Banni</option>
        </select>
      </div>

      <!-- Table -->
      <div class="tikane-card !p-0 overflow-hidden">
        <div *ngIf="loading" class="flex justify-center py-12"><mat-spinner diameter="36"></mat-spinner></div>

        <div *ngIf="!loading" class="overflow-x-auto">
          <div *ngIf="users.length === 0" class="px-6 py-12 text-center text-sm" style="color: var(--text-muted)">
            Aucun compte ne correspond aux filtres actuels.
          </div>

          <table *ngIf="users.length > 0" class="tikane-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>KYC</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style="background: linear-gradient(135deg, #6d28d9, #3b82f6)">
                      {{ user.firstName[0] }}{{ user.lastName[0] }}
                    </div>
                    <div>
                      <p class="text-sm font-medium" style="color: var(--text-primary)">
                        {{ user.firstName }} {{ user.lastName }}
                      </p>
                      <p class="text-xs" style="color: var(--text-muted)">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge badge-purple text-xs">{{ user.role }}</span>
                </td>
                <td>
                  <span [class]="'status-' + user.status">{{ user.status }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <span [class]="user.kycStatus === 'APPROVED' ? 'badge badge-success' : user.kycStatus === 'REJECTED' ? 'badge badge-danger' : 'badge badge-warning'" class="text-xs">
                      {{ kycLabel(user.kycStatus) }}
                    </span>
                    <!-- KYC approve/reject buttons -->
                    <button mat-icon-button *ngIf="user.kycStatus === 'PENDING'"
                      (click)="updateKyc(user, 'APPROVED')" title="Approuver KYC" class="text-emerald-500">
                      <mat-icon class="text-base">check_circle</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="user.kycStatus === 'PENDING' || user.kycStatus === 'APPROVED'"
                      (click)="updateKyc(user, 'REJECTED')" title="Rejeter KYC" class="text-red-400">
                      <mat-icon class="text-base">cancel</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="user.kycStatus === 'NOT_SUBMITTED' || user.kycStatus === 'REJECTED'"
                      (click)="updateKyc(user, 'PENDING')" title="Marquer en attente" class="text-amber-500">
                      <mat-icon class="text-base">hourglass_empty</mat-icon>
                    </button>
                  </div>
                </td>
                <td>
                  <span class="text-sm" style="color: var(--text-muted)">{{ user.createdAt | date:'dd/MM/yyyy' }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <button mat-icon-button *ngIf="user.status === 'ACTIVE' || user.status === 'PENDING_VERIFICATION'"
                      (click)="updateStatus(user, 'SUSPENDED')" title="Suspendre" class="text-amber-500">
                      <mat-icon class="text-base">pause_circle</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="user.status === 'SUSPENDED'"
                      (click)="updateStatus(user, 'ACTIVE')" title="Activer" class="text-emerald-500">
                      <mat-icon class="text-base">play_circle</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="user.status === 'PENDING_VERIFICATION'"
                      (click)="updateStatus(user, 'ACTIVE')" title="Valider le compte" class="text-blue-500">
                      <mat-icon class="text-base">verified_user</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="user.status !== 'BANNED'"
                      (click)="updateStatus(user, 'BANNED')" title="Bannir" class="text-red-500">
                      <mat-icon class="text-base">block</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-3 border-t" style="border-color: var(--surface-border)">
          <span class="text-sm" style="color: var(--text-muted)">
            Page {{ pagination.page }} / {{ pagination.totalPages }}
          </span>
          <div class="flex gap-2">
            <button mat-button [disabled]="!pagination.hasPrev" (click)="previousPage()">Précédent</button>
            <button mat-button [disabled]="!pagination.hasNext" (click)="nextPage()">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  loading = true;
  creating = false;
  search = '';
  filterRole = 'CLIENT';
  filterStatus = '';
  page = 1;
  pagination = { page: 1, totalPages: 1, total: 0, hasPrev: false, hasNext: false };
  draft: UserDraft = this.createEmptyDraft();
  lastCreatedCredentials: CreatedCredentials | null = null;
  activeTab: UserCreationTab = 'client';

  get isSuperAdmin(): boolean {
    return this.auth.currentUser?.role === 'SUPER_ADMIN';
  }

  get creationTitle(): string {
    const titles: Record<UserCreationTab, string> = {
      client: 'Nouveau client',
      agent: 'Créer un agent',
      admin: 'Créer un administrateur',
    };
    return titles[this.activeTab];
  }

  get creationButtonLabel(): string {
    const labels: Record<UserCreationTab, string> = {
      client: 'Créer le client',
      agent: "Créer l'agent",
      admin: "Créer l'admin",
    };
    return labels[this.activeTab];
  }

  private searchTimeout: any;

  constructor(private adminService: AdminService, private toastr: ToastrService, private auth: AuthService) {}

  ngOnInit(): void { this.loadUsers(); }

  setActiveTab(tab: UserCreationTab): void {
    this.activeTab = tab;
    this.filterRole = this.roleForTab(tab);
    this.page = 1;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.listUsers({
      page: this.page, limit: 15,
      search: this.search || undefined,
      role: this.filterRole || undefined,
      status: this.filterStatus || undefined,
    }).subscribe({
      next: (data) => { this.users = data.data; this.pagination = data.pagination; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page = 1; this.loadUsers(); }, 400);
  }

  previousPage(): void {
    if (!this.pagination.hasPrev) return;
    this.page -= 1; this.loadUsers();
  }

  nextPage(): void {
    if (!this.pagination.hasNext) return;
    this.page += 1; this.loadUsers();
  }

  updateStatus(user: User, status: string): void {
    this.adminService.updateUserStatus(user.id, status).subscribe({
      next: () => { user.status = status as any; this.toastr.success(`Statut mis à jour: ${status}`); },
    });
  }

  updateKyc(user: any, kycStatus: string): void {
    this.adminService.updateKycStatus(user.id, kycStatus).subscribe({
      next: () => { user.kycStatus = kycStatus; this.toastr.success(`KYC: ${this.kycLabel(kycStatus)}`); },
      error: (err) => { this.toastr.error(err?.error?.message ?? 'Erreur KYC'); },
    });
  }

  kycLabel(status: string): string {
    const map: Record<string, string> = {
      NOT_SUBMITTED: 'Non soumis',
      PENDING: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
    };
    return map[status] ?? status;
  }

  createUser(): void {
    const validationError = this.validateDraft();
    if (validationError) { this.toastr.error(validationError); return; }

    this.creating = true;
    const data = {
      firstName: this.draft.firstName.trim(),
      lastName: this.draft.lastName.trim(),
      email: this.draft.email.trim(),
      phone: this.draft.phone.trim() || undefined,
      password: this.draft.password,
      preferredLanguage: this.draft.preferredLanguage,
    };

    const call = this.activeTab === 'admin'
      ? this.adminService.createAdmin(data)
      : this.activeTab === 'agent'
        ? this.adminService.createAgentWithUser({
            ...data,
            commissionRate: this.draft.commissionRate,
            zone: this.draft.zone.trim() || undefined,
          })
        : this.adminService.createClient(data);

    call.subscribe({
      next: (created) => {
        const user = this.activeTab === 'agent' ? created.user : created;
        this.lastCreatedCredentials = {
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          password: this.draft.password,
          role: this.roleLabel(this.activeTab),
          agentCode: this.activeTab === 'agent' ? created.agentCode : undefined,
        };
        this.draft = this.createEmptyDraft();
        this.creating = false;
        this.filterRole = this.roleForTab(this.activeTab);
        this.page = 1;
        this.loadUsers();
        this.toastr.success(`${this.roleLabel(this.activeTab)} créé avec succès`);
      },
      error: (err) => { this.toastr.error(err?.error?.message ?? 'Erreur lors de la création'); this.creating = false; },
    });
  }

  private validateDraft(): string | null {
    if (!this.draft.firstName.trim() || !this.draft.lastName.trim()) return 'Prénom et nom sont requis';
    if (!this.draft.email.trim()) return 'Email requis';
    if (!this.draft.password.trim()) return 'Mot de passe temporaire requis';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(this.draft.password)) {
      return 'Le mot de passe doit contenir 8 caractères, une majuscule, une minuscule et un chiffre';
    }
    if (this.activeTab === 'agent' && (this.draft.commissionRate < 0 || this.draft.commissionRate > 100)) {
      return 'La commission doit être comprise entre 0 et 100';
    }
    return null;
  }

  private roleForTab(tab: UserCreationTab): string {
    const roles: Record<UserCreationTab, string> = {
      client: 'CLIENT',
      agent: 'AGENT',
      admin: 'ADMIN',
    };
    return roles[tab];
  }

  private roleLabel(tab: UserCreationTab): string {
    const labels: Record<UserCreationTab, string> = {
      client: 'Client',
      agent: 'Agent',
      admin: 'Admin',
    };
    return labels[tab];
  }

  private createEmptyDraft(): UserDraft {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      commissionRate: 2.5,
      zone: '',
      preferredLanguage: 'fr',
    };
  }
}
