import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';

interface NavSection {
  title: string;
  items: { label: string; icon: string; route: string }[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatMenuModule],
  template: `
    <div class="min-h-screen flex" [class.dark]="isDark()">
      <!-- Sidebar -->
      <aside class="fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300"
        [class.w-64]="sidebarOpen()" [class.w-16]="!sidebarOpen()"
        style="background: var(--surface-card); border-right: 1px solid var(--surface-border)">
        <!-- Logo -->
        <div class="flex items-center gap-3 px-4 py-5 border-b" style="border-color: var(--surface-border)">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style="background: linear-gradient(135deg, #6d28d9, #3b82f6)">T</div>
          <div *ngIf="sidebarOpen()">
            <span class="font-bold text-lg font-display" style="color: var(--text-primary)">SABOTAY</span>
            <span class="text-xs ml-2 px-1.5 py-0.5 rounded text-white text-opacity-80"
              style="background: rgba(109,40,217,0.6); font-size: 10px">{{ adminRoleLabel }}</span>
          </div>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto p-3">
          <ng-container *ngFor="let section of navSections">
            <p *ngIf="sidebarOpen()" class="text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-4"
              style="color: var(--text-muted)">{{ section.title }}</p>
            <div class="space-y-0.5 mb-2">
              <a *ngFor="let item of section.items"
                [routerLink]="item.route"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: item.route === '/admin' }"
                class="sidebar-nav-item"
                [class.justify-center]="!sidebarOpen()"
                [title]="!sidebarOpen() ? item.label : ''">
                <mat-icon class="flex-shrink-0">{{ item.icon }}</mat-icon>
                <span *ngIf="sidebarOpen()" class="truncate">{{ item.label }}</span>
              </a>
            </div>
          </ng-container>
        </nav>

        <!-- Footer -->
        <div class="p-3 border-t" style="border-color: var(--surface-border)">
          <button (click)="logout()" class="sidebar-nav-item w-full" [class.justify-center]="!sidebarOpen()">
            <mat-icon class="flex-shrink-0 text-red-400">logout</mat-icon>
            <span *ngIf="sidebarOpen()" class="text-red-400">Déconnexion</span>
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex-1 flex flex-col transition-all duration-300"
        [class.ml-64]="sidebarOpen()" [class.ml-16]="!sidebarOpen()">
        <!-- Topbar -->
        <header class="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
          style="background: var(--surface-bg); border-bottom: 1px solid var(--surface-border)">
          <div class="flex items-center gap-3">
            <button mat-icon-button (click)="sidebarOpen.set(!sidebarOpen())">
              <mat-icon style="color: var(--text-secondary)">menu</mat-icon>
            </button>
            <span class="text-xs font-medium px-2 py-0.5 rounded text-white"
              style="background: rgba(239,68,68,0.7)">Administration</span>
          </div>

          <div class="flex items-center gap-3">
            <button mat-icon-button (click)="toggleTheme()">
              <mat-icon style="color: var(--text-secondary)">{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <button mat-button [matMenuTriggerFor]="userMenu" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style="background: linear-gradient(135deg, #ef4444, #6d28d9)">
                {{ userInitials }}
              </div>
              <span class="text-sm font-medium hidden sm:block" style="color: var(--text-primary)">
                {{ auth.currentUser?.firstName }}
              </span>
              <mat-icon class="text-sm" style="color: var(--text-muted)">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu>
              <button mat-menu-item (click)="logout()">
                <mat-icon class="text-red-500">logout</mat-icon><span>Déconnexion</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <main class="flex-1 p-6 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  sidebarOpen = signal(true);
  isDark = signal(false);

  navSections: NavSection[] = [
    {
      title: 'Vue d\'ensemble',
      items: [
        { label: 'Tableau de bord', icon: 'dashboard', route: '/admin' },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { label: 'Utilisateurs', icon: 'people', route: '/admin/users' },
        { label: 'Carnets', icon: 'book', route: '/admin/carnets' },
        { label: 'Plans', icon: 'savings', route: '/admin/plans' },
        { label: 'Paiements', icon: 'payment', route: '/admin/payments' },
        { label: 'Touchements', icon: 'account_balance_wallet', route: '/admin/withdrawals' },
        { label: 'Agents', icon: 'support_agent', route: '/admin/agents' },
        { label: 'Pénalités', icon: 'warning', route: '/admin/penalties' },
      ],
    },
    {
      title: 'Système',
      items: [
        { label: 'Journaux d\'audit', icon: 'history', route: '/admin/audit-logs' },
        { label: 'Rapports', icon: 'bar_chart', route: '/admin/reports' },
        { label: 'Paramètres', icon: 'settings', route: '/admin/settings' },
      ],
    },
  ];

  constructor(
    public auth: AuthService,
    private storage: StorageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isDark.set(this.storage.getTheme() === 'dark');
  }

  get userInitials(): string {
    const u = this.auth.currentUser;
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  get adminRoleLabel(): string {
    return this.auth.currentUser?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN';
  }

  toggleTheme(): void {
    const newTheme = this.isDark() ? 'light' : 'dark';
    this.isDark.set(!this.isDark());
    this.storage.setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }

  logout(): void { this.auth.logout(); }
}
