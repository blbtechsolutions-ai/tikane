import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionProgressItem } from '../../core/models/payment.model';

export interface CalendarCell {
  empty: boolean;
  dayNumber?: number;
  date?: Date;
  status?: 'PAID' | 'LATE' | 'PENDING';
  amount?: number;
  paidAt?: string | null;
}

@Component({
  selector: 'app-carnet-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <!-- Légende -->
      <div class="flex flex-wrap items-center gap-4 text-xs" style="color: var(--text-muted)">
        <span class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-lg inline-flex items-center justify-center" style="background:#10b981">
            <svg class="w-3 h-3" viewBox="0 0 20 20" fill="none">
              <path d="M5 10l3.5 3.5L15 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          Versé
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-lg inline-flex items-center justify-center" style="background:#ef4444">
            <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M6 6l8 8M14 6l-8 8" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          Manqué / En retard
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-lg inline-block" style="background:var(--surface-card); border:2px solid var(--surface-border)"></span>
          À venir
        </span>
      </div>

      <!-- Grille calendrier -->
      <div class="overflow-x-auto rounded-xl" style="border: 1px solid var(--surface-border)">
        <table class="w-full border-collapse" style="min-width: 360px">
          <!-- En-têtes jours -->
          <thead>
            <tr style="background: var(--surface-card)">
              <th *ngFor="let h of dayHeaders"
                class="text-center text-xs font-semibold py-2.5 px-1"
                style="color: var(--text-secondary); border-bottom: 2px solid var(--surface-border); min-width: 50px">
                {{ h }}
              </th>
            </tr>
          </thead>
          <!-- Semaines -->
          <tbody>
            <tr *ngFor="let week of calendarWeeks; let wi = index"
              [style.border-bottom]="wi < calendarWeeks.length - 1 ? '1px solid var(--surface-border)' : 'none'">
              <td *ngFor="let cell of week" class="p-1.5 align-top"
                style="border-right: 1px solid var(--surface-border)">

                <!-- Cellule vide (décalage) -->
                <div *ngIf="cell.empty" class="h-16"></div>

                <!-- Cellule jour -->
                <div *ngIf="!cell.empty"
                  class="group relative h-16 rounded-xl flex flex-col items-center justify-center cursor-default transition-all hover:scale-105 hover:shadow-md"
                  [style.background]="cellBg(cell)"
                  [style.border]="'2px solid ' + cellBorder(cell)">

                  <!-- Date calendrier réelle -->
                  <p class="text-[9px] leading-none mb-1 font-medium"
                    [style.color]="cell.status === 'PENDING' ? 'var(--text-muted)' : 'rgba(255,255,255,0.75)'">
                    {{ cell.date | date:'dd/MM' }}
                  </p>

                  <!-- Icône statut -->
                  <div class="flex justify-center mb-1">
                    <svg *ngIf="cell.status === 'PAID'" class="w-5 h-5 drop-shadow-sm" viewBox="0 0 20 20" fill="none">
                      <path d="M4.5 10l4 4L15.5 6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg *ngIf="cell.status === 'LATE'" class="w-4 h-4" viewBox="0 0 20 20" fill="none">
                      <path d="M6 6l8 8M14 6l-8 8" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
                    </svg>
                    <span *ngIf="cell.status === 'PENDING'"
                      class="text-base font-bold leading-none"
                      style="color: var(--text-secondary)">
                      {{ cell.dayNumber }}
                    </span>
                  </div>

                  <!-- Montant (toujours affiché) -->
                  <p class="text-[9px] leading-none font-semibold"
                    [style.color]="cell.status === 'PENDING' ? 'var(--text-muted)' : 'rgba(255,255,255,0.9)'">
                    {{ cell.amount | number }} HTG
                  </p>

                  <!-- Tooltip au survol -->
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div class="rounded-xl px-3 py-2 text-xs text-white shadow-2xl whitespace-nowrap"
                      style="background: #0f172a; min-width: 150px; border: 1px solid rgba(255,255,255,0.1)">
                      <p class="font-bold text-center text-sm mb-1">Jour {{ cell.dayNumber }}</p>
                      <p class="text-center opacity-80">{{ cell.date | date:'EEEE dd MMMM' }}</p>
                      <p class="text-center font-semibold mt-1">{{ cell.amount | number }} HTG</p>
                      <p *ngIf="cell.paidAt" class="text-center opacity-60 text-[10px] mt-0.5">
                        Versé le {{ cell.paidAt | date:'dd/MM/yyyy HH:mm' }}
                      </p>
                      <div class="text-center mt-1">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          [style.background]="cell.status === 'PAID' ? 'rgba(16,185,129,0.3)' : cell.status === 'LATE' ? 'rgba(239,68,68,0.3)' : 'rgba(107,114,128,0.3)'"
                          [style.color]="cell.status === 'PAID' ? '#6ee7b7' : cell.status === 'LATE' ? '#fca5a5' : '#9ca3af'">
                          {{ statusLabel(cell.status) }}
                        </span>
                      </div>
                    </div>
                    <div class="w-2.5 h-2.5 rotate-45 -mt-1.5" style="background:#0f172a; border-right:1px solid rgba(255,255,255,0.1); border-bottom:1px solid rgba(255,255,255,0.1)"></div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Compteurs résumé -->
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="rounded-xl py-3" style="background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2)">
          <p class="text-xl font-bold text-emerald-500">{{ paidCount }}</p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">Versés</p>
        </div>
        <div class="rounded-xl py-3" style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2)">
          <p class="text-xl font-bold text-red-400">{{ lateCount }}</p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">Manqués</p>
        </div>
        <div class="rounded-xl py-3" style="background: rgba(107,114,128,0.08); border: 1px solid rgba(107,114,128,0.2)">
          <p class="text-xl font-bold" style="color: var(--text-secondary)">{{ pendingCount }}</p>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">À venir</p>
        </div>
      </div>
    </div>
  `,
})
export class CarnetCalendarComponent implements OnChanges {
  @Input() progress: SubscriptionProgressItem[] = [];
  @Input() startDate: string = '';

  readonly dayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  calendarWeeks: CalendarCell[][] = [];

  get paidCount(): number { return this.progress.filter((i) => i.status === 'PAID').length; }
  get lateCount(): number { return this.progress.filter((i) => i.status === 'LATE').length; }
  get pendingCount(): number { return this.progress.filter((i) => i.status !== 'PAID' && i.status !== 'LATE').length; }

  ngOnChanges(): void {
    this.calendarWeeks = this.buildWeeks();
  }

  private buildWeeks(): CalendarCell[][] {
    if (!this.progress?.length || !this.startDate) return [];

    const start = new Date(this.startDate);
    // Offset pour aligner sur Lundi (0=Mon ... 6=Sun)
    const dow = (start.getDay() + 6) % 7;

    const cells: CalendarCell[] = [];

    // Cellules vides de décalage
    for (let i = 0; i < dow; i++) {
      cells.push({ empty: true });
    }

    // Cellules jours
    for (const item of this.progress) {
      const date = new Date(start);
      date.setDate(start.getDate() + item.dayNumber - 1);
      cells.push({
        empty: false,
        dayNumber: item.dayNumber,
        date,
        status: item.status,
        amount: item.amount,
        paidAt: item.paidAt,
      });
    }

    // Compléter la dernière semaine
    const rem = cells.length % 7;
    if (rem !== 0) {
      for (let i = 0; i < 7 - rem; i++) {
        cells.push({ empty: true });
      }
    }

    // Découper en semaines
    const weeks: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }

  cellBg(cell: CalendarCell): string {
    switch (cell.status) {
      case 'PAID': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'LATE': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      default: return 'var(--surface-card)';
    }
  }

  cellBorder(cell: CalendarCell): string {
    switch (cell.status) {
      case 'PAID': return '#047857';
      case 'LATE': return '#dc2626';
      default: return 'var(--surface-border)';
    }
  }

  statusLabel(status?: string): string {
    switch (status) {
      case 'PAID': return 'Versé';
      case 'LATE': return 'Manqué';
      default: return 'À venir';
    }
  }
}
