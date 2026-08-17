import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <h1>Journaux d'audit</h1>
        <p>Toutes les actions effectuées sur la plateforme</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-16"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="!loading" class="tikane-card !p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="tikane-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entité</th>
                <th>Utilisateur</th>
                <th>IP</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of logs">
                <td>
                  <span class="badge badge-purple text-xs">{{ log.action }}</span>
                </td>
                <td>
                  <div>
                    <p class="text-xs font-medium" style="color: var(--text-primary)">{{ log.entityType }}</p>
                    <p *ngIf="log.entityId" class="text-xs font-mono" style="color: var(--text-muted)">
                      {{ log.entityId | slice:0:16 }}...
                    </p>
                  </div>
                </td>
                <td>
                  <p class="text-sm" style="color: var(--text-secondary)">
                    {{ log.user?.firstName }} {{ log.user?.lastName }}
                  </p>
                </td>
                <td>
                  <span class="text-xs font-mono" style="color: var(--text-muted)">{{ log.ipAddress ?? '—' }}</span>
                </td>
                <td>
                  <span class="text-sm" style="color: var(--text-muted)">{{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="logs.length === 0" class="text-center py-12 text-sm" style="color: var(--text-muted)">
          Aucun journal
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-4 py-3 border-t" style="border-color: var(--surface-border)">
          <span class="text-sm" style="color: var(--text-muted)">Page {{ page }} / {{ totalPages }}</span>
          <div class="flex gap-2">
            <button [disabled]="page <= 1" (click)="previousPage()"
              class="px-3 py-1 text-sm rounded-lg disabled:opacity-40 transition-colors"
              style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
              Précédent
            </button>
            <button [disabled]="page >= totalPages" (click)="nextPage()"
              class="px-3 py-1 text-sm rounded-lg disabled:opacity-40 transition-colors"
              style="background: var(--surface-card); border: 1px solid var(--surface-border); color: var(--text-primary)">
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditLogsComponent implements OnInit {
  logs: any[] = [];
  loading = true;
  page = 1;
  totalPages = 1;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminService.getAuditLogs({ page: this.page, limit: 25 }).subscribe({
      next: (r) => { this.logs = r.data; this.totalPages = r.pagination.totalPages; this.loading = false; },
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
}
