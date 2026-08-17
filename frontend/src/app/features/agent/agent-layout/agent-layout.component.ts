import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  template: `
    <div class="min-h-screen flex" [class.dark]="isDark()">
      <aside class="fixed left-0 top-0 h-full z-30 transition-all duration-300 flex flex-col"
        [class.w-64]="sidebarOpen()" [class.w-16]="!sidebarOpen()"
        style="background: var(--surface-card); border-right: 1px solid var(--surface-border)">
        <div class="flex items-center gap-3 px-4 py-5 border-b" style="border-color: var(--surface-border)">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style="background: linear-gradient(135deg, #0f766e, #14b8a6)">A</div>
          <span *ngIf="sidebarOpen()" class="font-bold text-lg font-display" style="color: var(--text-primary)">AGENT</span>
        </div>

        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          <a routerLink="/agent" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
            class="sidebar-nav-item" [class.justify-center]="!sidebarOpen()">
            <mat-icon class="flex-shrink-0">dashboard</mat-icon>
            <span *ngIf="sidebarOpen()" class="truncate">Terrain</span>
          </a>
        </nav>

        <div class="p-3 border-t" style="border-color: var(--surface-border)">
          <button (click)="logout()" class="sidebar-nav-item w-full" [class.justify-center]="!sidebarOpen()">
            <mat-icon class="flex-shrink-0 text-red-400">logout</mat-icon>
            <span *ngIf="sidebarOpen()" class="text-red-400">Déconnexion</span>
          </button>
        </div>
      </aside>

      <div class="flex-1 flex flex-col transition-all duration-300" [class.ml-64]="sidebarOpen()" [class.ml-16]="!sidebarOpen()">
        <header class="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
          style="background: var(--surface-bg); border-bottom: 1px solid var(--surface-border)">
          <div class="flex items-center gap-3">
            <button mat-icon-button (click)="sidebarOpen.set(!sidebarOpen())">
              <mat-icon style="color: var(--text-secondary)">menu</mat-icon>
            </button>
            <div class="hidden sm:block">
              <p class="text-xs" style="color: var(--text-muted)">Espace agent</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button mat-icon-button (click)="toggleTheme()">
              <mat-icon style="color: var(--text-secondary)">{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <div class="flex items-center gap-2 rounded-xl px-2 py-1">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style="background: linear-gradient(135deg, #0f766e, #14b8a6)">
                {{ userInitials }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-sm font-medium leading-tight" style="color: var(--text-primary)">{{ user?.firstName }}</p>
                <p class="text-xs leading-tight" style="color: var(--text-muted)">AGENT</p>
              </div>
            </div>
          </div>
        </header>

        <main class="flex-1 p-6 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AgentLayoutComponent implements OnInit {
  sidebarOpen = signal(true);
  isDark = signal(false);
  user: User | null = null;

  constructor(
    private auth: AuthService,
    private storage: StorageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.isDark.set(this.storage.getTheme() === 'dark');
  }

  get userInitials(): string {
    if (!this.user) return '?';
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }

  toggleTheme(): void {
    const newTheme = this.isDark() ? 'light' : 'dark';
    this.isDark.set(!this.isDark());
    this.storage.setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }

  logout(): void {
    this.auth.logout();
  }
}