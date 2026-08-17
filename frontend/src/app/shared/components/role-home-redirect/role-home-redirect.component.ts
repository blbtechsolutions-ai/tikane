import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-role-home-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center" style="background: var(--surface-bg)">
      <p class="text-sm" style="color: var(--text-muted)">Redirection...</p>
    </div>
  `,
})
export class RoleHomeRedirectComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const role = this.auth.currentUser?.role;

    if (!this.auth.isAuthenticated || !role) {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
      return;
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      this.router.navigate(['/admin'], { replaceUrl: true });
      return;
    }

    if (role === 'AGENT') {
      this.router.navigate(['/agent'], { replaceUrl: true });
      return;
    }

    this.router.navigate(['/dashboard'], { replaceUrl: true });
  }
}