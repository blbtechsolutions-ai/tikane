import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center px-4"
      style="background: var(--surface-bg)">
      <div class="text-center animate-fade-in">
        <div class="text-8xl font-black mb-4 font-display"
          style="background: linear-gradient(135deg, #6d28d9, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent">
          {{ code }}
        </div>
        <h2 class="text-2xl font-bold mb-3" style="color: var(--text-primary)">{{ message }}</h2>
        <p class="text-sm mb-8" style="color: var(--text-muted)">
          La page que vous cherchez est introuvable ou vous n'y avez pas accès.
        </p>
        <a routerLink="/dashboard"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm"
          style="background: #1e40af">
          ← Retour au tableau de bord
        </a>
      </div>
    </div>
  `,
})
export class ErrorPageComponent {
  @Input() code: number = 404;
  @Input() message: string = 'Page introuvable';
}
