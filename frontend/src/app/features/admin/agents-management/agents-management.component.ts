import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';

interface AgentDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  commissionRate: number;
  zone: string;
  preferredLanguage: 'fr' | 'ht';
}

interface CreatedAgentCredentials {
  fullName: string;
  email: string;
  password: string;
  agentCode: string;
}

@Component({
  selector: 'app-agents-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Gestion des agents</h1>
        <p>Créez et gérez les agents de terrain</p>
      </div>

      <!-- Creation form -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div class="tikane-card xl:col-span-2 space-y-4">
          <div>
            <h3 class="font-semibold" style="color: var(--text-primary)">Nouveau agent</h3>
            <p class="text-sm" style="color: var(--text-muted)">
              Crée un compte agent avec accès à l'espace terrain. L'agent pourra collecter les paiements des clients.
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
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Zone / Secteur</label>
              <input [(ngModel)]="draft.zone" name="zone" placeholder="Ex: Port-au-Prince Nord"
                class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary)">Commission (%)</label>
              <input [(ngModel)]="draft.commissionRate" name="commissionRate" type="number" min="0" max="100" step="0.5"
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
          </div>

          <div class="flex justify-end">
            <button mat-flat-button type="button" (click)="createAgent()" [disabled]="creating"
              class="!rounded-xl text-white" style="background: #1e40af">
              <mat-icon class="mr-2">person_add</mat-icon>
              {{ creating ? 'Création...' : "Créer l'agent" }}
            </button>
          </div>
        </div>

        <div class="tikane-card" *ngIf="lastCreated">
          <h3 class="font-semibold mb-3" style="color: var(--text-primary)">Identifiants à transmettre</h3>
          <div class="space-y-2 text-sm">
            <p style="color: var(--text-secondary)"><strong style="color: var(--text-primary)">Agent:</strong> {{ lastCreated.fullName }}</p>
            <p style="color: var(--text-secondary)"><strong style="color: var(--text-primary)">Email:</strong> {{ lastCreated.email }}</p>
            <p style="color: var(--text-secondary)"><strong style="color: var(--text-primary)">Mot de passe:</strong> {{ lastCreated.password }}</p>
            <p style="color: var(--text-secondary)"><strong style="color: var(--text-primary)">Code agent:</strong>
              <span class="font-mono ml-1">{{ lastCreated.agentCode }}</span>
            </p>
          </div>
          <p class="text-xs mt-3" style="color: var(--text-muted)">
            L'agent pourra se connecter sur /agent et modifier ce mot de passe.
          </p>
        </div>
      </div>

      <!-- Agents list -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold" style="color: var(--text-primary)">Agents enregistrés</h3>
          <button mat-button (click)="loadAgents()" class="text-sm" style="color: var(--text-muted)">
            <mat-icon class="text-base mr-1">refresh</mat-icon> Actualiser
          </button>
        </div>

        <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

        <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <div *ngFor="let agent of agents" class="tikane-card">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style="background: #1e40af">
                {{ agent.user?.firstName?.[0] ?? 'A' }}
              </div>
              <div>
                <p class="font-semibold" style="color: var(--text-primary)">
                  {{ agent.user?.firstName }} {{ agent.user?.lastName }}
                </p>
                <p class="text-xs font-mono" style="color: var(--text-muted)">{{ agent.agentCode }}</p>
              </div>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span style="color: var(--text-muted)">Email</span>
                <span class="text-xs" style="color: var(--text-primary)">{{ agent.user?.email }}</span>
              </div>
              <div class="flex justify-between">
                <span style="color: var(--text-muted)">Zone</span>
                <span style="color: var(--text-primary)">{{ agent.zone ?? 'â€”' }}</span>
              </div>
              <div class="flex justify-between">
                <span style="color: var(--text-muted)">Commission</span>
                <span class="text-emerald-500 font-semibold">{{ agent.commissionRate }}%</span>
              </div>
              <div class="flex justify-between">
                <span style="color: var(--text-muted)">Collections</span>
                <span style="color: var(--text-primary)">{{ agent._count?.collections ?? 0 }}</span>
              </div>
            </div>

            <div class="mt-3">
              <span [class]="agent.isActive ? 'badge badge-success' : 'badge badge-danger'" class="text-xs">
                {{ agent.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && agents.length === 0" class="text-center py-16">
          <div class="text-5xl mb-4">ðŸ‘¤</div>
          <h3 class="font-semibold mb-2" style="color: var(--text-primary)">Aucun agent</h3>
          <p class="text-sm" style="color: var(--text-muted)">Créez votre premier agent ci-dessus.</p>
        </div>
      </div>
    </div>
  `,
})
export class AgentsManagementComponent implements OnInit {
  agents: any[] = [];
  loading = true;
  creating = false;
  lastCreated: CreatedAgentCredentials | null = null;

  draft: AgentDraft = this.emptyDraft();

  constructor(private adminService: AdminService, private toastr: ToastrService) {}

  ngOnInit(): void { this.loadAgents(); }

  loadAgents(): void {
    this.loading = true;
    this.adminService.listAgents({ limit: 50 }).subscribe({
      next: (r) => { this.agents = r.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  createAgent(): void {
    if (!this.draft.firstName.trim() || !this.draft.lastName.trim() || !this.draft.email.trim() || !this.draft.password.trim()) {
      this.toastr.error('Prénom, nom, email et mot de passe sont obligatoires');
      return;
    }
    this.creating = true;
    this.adminService.createAgentWithUser({
      firstName: this.draft.firstName.trim(),
      lastName: this.draft.lastName.trim(),
      email: this.draft.email.trim(),
      phone: this.draft.phone.trim() || undefined,
      password: this.draft.password.trim(),
      commissionRate: this.draft.commissionRate,
      zone: this.draft.zone.trim() || undefined,
      preferredLanguage: this.draft.preferredLanguage,
    }).subscribe({
      next: (agent) => {
        this.lastCreated = {
          fullName: `${this.draft.firstName} ${this.draft.lastName}`,
          email: this.draft.email,
          password: this.draft.password,
          agentCode: agent.agentCode,
        };
        this.draft = this.emptyDraft();
        this.creating = false;
        this.toastr.success('Agent créé avec succès');
        this.loadAgents();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Erreur lors de la création');
        this.creating = false;
      },
    });
  }

  private emptyDraft(): AgentDraft {
    return { firstName: '', lastName: '', email: '', phone: '', password: '', commissionRate: 2.5, zone: '', preferredLanguage: 'fr' };
  }
}

