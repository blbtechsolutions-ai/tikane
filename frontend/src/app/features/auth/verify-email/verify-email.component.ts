import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in text-center">
      <div *ngIf="loading" class="py-10">
        <mat-spinner diameter="48" class="mx-auto mb-4"></mat-spinner>
        <p class="text-blue-200">Vérification en cours...</p>
      </div>

      <div *ngIf="!loading && success" class="py-6">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-2xl font-bold text-white mb-2 font-display">Email vérifié!</h2>
        <p class="text-blue-200 opacity-70 mb-6 text-sm">Votre email a été confirmé avec succès.</p>
        <a routerLink="/auth/login"
          class="inline-block px-6 py-3 rounded-xl font-semibold text-white text-sm"
          style="background: #1e40af">
          Se connecter
        </a>
      </div>

      <div *ngIf="!loading && !success" class="py-6">
        <div class="text-6xl mb-4">❌</div>
        <h2 class="text-2xl font-bold text-white mb-2 font-display">Lien invalide</h2>
        <p class="text-blue-200 opacity-70 mb-6 text-sm">Le lien de vérification est invalide ou a expiré.</p>
        <a routerLink="/auth/login" class="text-purple-400 hover:text-purple-300 text-sm">← Retour à la connexion</a>
      </div>
    </div>
  `,
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.loading = false; return; }

    this.auth.verifyEmail(token).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: () => { this.success = false; this.loading = false; },
    });
  }
}
