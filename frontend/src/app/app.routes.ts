import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/role-home-redirect/role-home-redirect.component').then(
        (m) => m.RoleHomeRedirectComponent,
      ),
  },

  // ─── Auth Routes ────────────────────────────────────────────
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent,
          ),
      },
    ],
  },

  // ─── Client Dashboard ────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT'] },
    loadComponent: () =>
      import('./features/client/client-layout/client-layout.component').then(
        (m) => m.ClientLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/client/dashboard-home/dashboard-home.component').then(
            (m) => m.DashboardHomeComponent,
          ),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/client/plans-list/plans-list.component').then(
            (m) => m.PlansListComponent,
          ),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/client/subscriptions/subscriptions.component').then(
            (m) => m.SubscriptionsComponent,
          ),
      },
      {
        path: 'subscriptions/:id',
        loadComponent: () =>
          import('./features/client/subscription-detail/subscription-detail.component').then(
            (m) => m.SubscriptionDetailComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/client/payments/payments.component').then(
            (m) => m.PaymentsComponent,
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/client/transactions/transactions.component').then(
            (m) => m.TransactionsComponent,
          ),
      },
      {
        path: 'withdrawals',
        loadComponent: () =>
          import('./features/client/withdrawals/withdrawals.component').then(
            (m) => m.WithdrawalsComponent,
          ),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./features/client/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },
      {
        path: 'penalties',
        loadComponent: () =>
          import('./features/client/penalties/penalties.component').then(
            (m) => m.PenaltiesComponent,
          ),
      },
    ],
  },

  // ─── Agent Workspace ────────────────────────────────────────
  {
    path: 'agent',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['AGENT'] },
    loadComponent: () =>
      import('./features/agent/agent-layout/agent-layout.component').then(
        (m) => m.AgentLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/agent/agent-workspace/agent-workspace.component').then(
            (m) => m.AgentWorkspaceComponent,
          ),
      },
    ],
  },

  // ─── Admin Dashboard ─────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'SUPER_ADMIN'] },
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-overview/admin-overview.component').then(
            (m) => m.AdminOverviewComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users-management/users-management.component').then(
            (m) => m.UsersManagementComponent,
          ),
      },
      {
        path: 'carnets',
        loadComponent: () =>
          import('./features/admin/carnets-management/carnets-management.component').then(
            (m) => m.CarnetsManagementComponent,
          ),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/admin/plans-management/plans-management.component').then(
            (m) => m.PlansManagementComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/admin/payments-validation/payments-validation.component').then(
            (m) => m.PaymentsValidationComponent,
          ),
      },
      {
        path: 'withdrawals',
        loadComponent: () =>
          import('./features/admin/withdrawals-management/withdrawals-management.component').then(
            (m) => m.WithdrawalsManagementComponent,
          ),
      },
      {
        path: 'agents',
        loadComponent: () =>
          import('./features/admin/agents-management/agents-management.component').then(
            (m) => m.AgentsManagementComponent,
          ),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/admin/audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsComponent,
          ),
      },
      {
        path: 'penalties',
        loadComponent: () =>
          import('./features/admin/penalties-management/penalties-management.component').then(
            (m) => m.PenaltiesManagementComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/reports.component').then(
            (m) => m.ReportsComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },

  // ─── Error Pages ─────────────────────────────────────────────
  {
    path: '403',
    loadComponent: () =>
      import('./shared/components/error-page/error-page.component').then(
        (m) => m.ErrorPageComponent,
      ),
    data: { code: 403, message: 'Accès refusé' },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/error-page/error-page.component').then(
        (m) => m.ErrorPageComponent,
      ),
    data: { code: 404, message: 'Page introuvable' },
  },
];
