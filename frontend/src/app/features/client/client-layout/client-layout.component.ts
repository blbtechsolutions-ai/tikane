import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { User } from '../../../core/models/user.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatDividerModule, MatMenuModule, MatBadgeModule,
  ],
  template: `
    <div class="min-h-screen flex" [class.dark]="isDark()">
      <!-- Sidebar -->
      <aside
        class="fixed left-0 top-0 h-full z-30 transition-all duration-300 flex flex-col"
        [class.w-64]="sidebarOpen()"
        [class.w-16]="!sidebarOpen()"
        style="background: var(--surface-card); border-right: 1px solid var(--surface-border)"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 px-4 py-5 border-b" style="border-color: var(--surface-border)">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style="background: linear-gradient(135deg, #6d28d9, #3b82f6)">T</div>
          <span *ngIf="sidebarOpen()" class="font-bold text-lg font-display" style="color: var(--text-primary)">SABOTAY</span>
        </div>

        <!-- Nav -->
        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          <a *ngFor="let item of navItems"
            [routerLink]="item.route" routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            class="sidebar-nav-item"
            [class.justify-center]="!sidebarOpen()"
            [title]="!sidebarOpen() ? item.label : ''"
          >
            <mat-icon class="flex-shrink-0">{{ item.icon }}</mat-icon>
            <span *ngIf="sidebarOpen()" class="truncate">{{ item.label }}</span>
          </a>
        </nav>

        <!-- Footer -->
        <div class="p-3 border-t" style="border-color: var(--surface-border)">
          <button (click)="logout()" class="sidebar-nav-item w-full"
            [class.justify-center]="!sidebarOpen()" title="Déconnexion">
            <mat-icon class="flex-shrink-0 text-red-400">logout</mat-icon>
            <span *ngIf="sidebarOpen()" class="text-red-400">Déconnexion</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col transition-all duration-300"
        [class.ml-64]="sidebarOpen()" [class.ml-16]="!sidebarOpen()">
        <!-- Topbar -->
        <header class="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
          style="background: var(--surface-bg); border-bottom: 1px solid var(--surface-border)">
          <div class="flex items-center gap-3">
            <button mat-icon-button (click)="sidebarOpen.set(!sidebarOpen())">
              <mat-icon style="color: var(--text-secondary)">menu</mat-icon>
            </button>
            <div class="hidden sm:block">
              <p class="text-xs" style="color: var(--text-muted)">Tableau de bord</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Theme toggle -->
            <button mat-icon-button (click)="toggleTheme()">
              <mat-icon style="color: var(--text-secondary)">{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <!-- User menu -->
            <button mat-button [matMenuTriggerFor]="userMenu"
              class="flex items-center gap-2 rounded-xl px-2 py-1">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style="background: linear-gradient(135deg, #6d28d9, #3b82f6)">
                {{ userInitials }}
              </div>
              <div class="hidden sm:block text-left">
                <p class="text-sm font-medium leading-tight" style="color: var(--text-primary)">{{ user?.firstName }}</p>
                <p class="text-xs leading-tight" style="color: var(--text-muted)">{{ user?.role }}</p>
              </div>
              <mat-icon class="text-sm" style="color: var(--text-muted)">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu>
              <button mat-menu-item routerLink="/dashboard">
                <mat-icon>dashboard</mat-icon><span>Tableau de bord</span>
              </button>
              <button mat-menu-item routerLink="/dashboard/security">
                <mat-icon>lock</mat-icon><span>Changer le mot de passe</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()" class="text-red-500">
                <mat-icon class="text-red-500">logout</mat-icon><span>Déconnexion</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 p-6 overflow-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ClientLayoutComponent implements OnInit {
  sidebarOpen = signal(true);
  isDark = signal(false);
  user: User | null = null;

  navItems: NavItem[] = [
    { label: 'Accueil', icon: 'home', route: '/dashboard' },
    { label: 'Plans', icon: 'savings', route: '/dashboard/plans' },
    { label: 'Mes carnets', icon: 'list_alt', route: '/dashboard/subscriptions' },
    { label: 'Paiements', icon: 'payment', route: '/dashboard/payments' },
    { label: 'Transactions', icon: 'swap_horiz', route: '/dashboard/transactions' },
    { label: 'Touchements', icon: 'account_balance_wallet', route: '/dashboard/withdrawals' },
    { label: 'Pénalités', icon: 'warning_amber', route: '/dashboard/penalties' },
    { label: 'Sécurité', icon: 'lock', route: '/dashboard/security' },
  ];

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
