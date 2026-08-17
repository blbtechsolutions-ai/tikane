import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../admin.service';

interface SettingRow {
  key: string;
  value: string;
  group: string;
  description: string;
  editValue: string;
  saving: boolean;
  changed: boolean;
}

const DEFAULT_SETTINGS = [
  { key: 'default_late_penalty_rate', group: 'penalty', description: 'Taux de pénalité pour retard de paiement (%)' },
  { key: 'max_missed_payments', group: 'penalty', description: 'Paiements manqués max avant suspension' },
  { key: 'platform_fee_rate', group: 'platform', description: 'Taux de frais plateforme (%)' },
  { key: 'platform_name', group: 'platform', description: 'Nom de la plateforme' },
  { key: 'currency', group: 'platform', description: 'Devise par défaut' },
  { key: 'default_grace_period_days', group: 'subscription', description: 'Nombre de jours de grâce avant pénalité' },
  { key: 'withdrawal_delay_days', group: 'withdrawal', description: 'Délai avant retrait (jours)' },
  { key: 'support_email', group: 'support', description: 'Email de support' },
  { key: 'support_phone', group: 'support', description: 'Téléphone de support' },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6">
      <div class="page-header">
        <div>
          <h1>Paramètres système</h1>
          <p>Configurez les règles et taux applicables à l'ensemble de la plateforme</p>
        </div>
        <button mat-flat-button (click)="saveAll()" [disabled]="savingAll || !hasChanges"
          class="!rounded-xl text-white" style="background: var(--color-primary)">
          <mat-spinner *ngIf="savingAll" diameter="16" class="mr-2 inline-block"></mat-spinner>
          <mat-icon class="text-sm mr-1">save</mat-icon>
          {{ savingAll ? 'Sauvegarde...' : 'Tout sauvegarder' }}
        </button>
      </div>

      <div *ngIf="loading" class="flex justify-center py-20"><mat-spinner diameter="48"></mat-spinner></div>

      <ng-container *ngIf="!loading">
        <div *ngFor="let group of groups" class="space-y-3">
          <h3 class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">
            {{ group }}
          </h3>
          <div class="tikane-card !p-0 overflow-hidden divide-y" style="divide-color: var(--surface-border)">
            <div *ngFor="let s of settingsByGroup(group)" class="flex items-center gap-4 p-4">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-mono font-medium" style="color: var(--text-primary)">{{ s.key }}</div>
                <div class="text-xs mt-0.5" style="color: var(--text-muted)">{{ s.description }}</div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <input [(ngModel)]="s.editValue" (ngModelChange)="markChanged(s)"
                  [name]="s.key"
                  class="w-32 px-3 py-2 rounded-xl text-sm outline-none text-right"
                  style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
                <button mat-icon-button (click)="saveSingle(s)" [disabled]="s.saving || !s.changed"
                  [title]="s.changed ? 'Sauvegarder' : 'Aucune modification'"
                  class="shrink-0"
                  [style]="s.changed ? 'color: var(--color-primary)' : 'color: var(--text-muted)'">
                  <mat-spinner *ngIf="s.saving" diameter="18"></mat-spinner>
                  <mat-icon *ngIf="!s.saving" class="text-base">save</mat-icon>
                </button>
                <mat-icon *ngIf="!s.saving && !s.changed && s.value"
                  class="text-base text-emerald-500" title="Sauvegardé">check_circle</mat-icon>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  settings: SettingRow[] = [];
  loading = true;
  savingAll = false;

  get groups(): string[] {
    const seen = new Set<string>();
    this.settings.forEach((s) => seen.add(s.group));
    return Array.from(seen);
  }

  get hasChanges(): boolean {
    return this.settings.some((s) => s.changed);
  }

  constructor(private adminService: AdminService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.adminService.getSettings().subscribe({
      next: (rows: any[]) => {
        // Build from defaults, overlay with actual DB values
        const byKey: Record<string, any> = {};
        (rows || []).forEach((r: any) => { byKey[r.key] = r; });

        this.settings = DEFAULT_SETTINGS.map((d) => ({
          key: d.key,
          value: byKey[d.key]?.value ?? '',
          group: d.group,
          description: d.description,
          editValue: byKey[d.key]?.value ?? '',
          saving: false,
          changed: false,
        }));

        // Add any extra settings from DB not in defaults
        rows.filter((r: any) => !DEFAULT_SETTINGS.some((d) => d.key === r.key)).forEach((r: any) => {
          const [group] = r.key.split('.');
          this.settings.push({
            key: r.key,
            value: r.value,
            group,
            description: r.description ?? '',
            editValue: r.value,
            saving: false,
            changed: false,
          });
        });

        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  settingsByGroup(group: string): SettingRow[] {
    return this.settings.filter((s) => s.group === group);
  }

  markChanged(s: SettingRow): void {
    s.changed = s.editValue !== s.value;
  }

  saveSingle(s: SettingRow): void {
    if (!s.changed || s.saving) return;
    s.saving = true;
    this.adminService.upsertSetting(s.key, s.editValue).subscribe({
      next: () => {
        s.value = s.editValue;
        s.changed = false;
        s.saving = false;
        this.toastr.success(`${s.key} mis à jour`);
      },
      error: () => { s.saving = false; },
    });
  }

  saveAll(): void {
    const changed = this.settings.filter((s) => s.changed);
    if (!changed.length) return;
    this.savingAll = true;
    this.adminService.bulkUpsertSettings(changed.map((s) => ({ key: s.key, value: s.editValue }))).subscribe({
      next: () => {
        changed.forEach((s) => { s.value = s.editValue; s.changed = false; });
        this.savingAll = false;
        this.toastr.success('Paramètres sauvegardés');
      },
      error: () => { this.savingAll = false; },
    });
  }
}
