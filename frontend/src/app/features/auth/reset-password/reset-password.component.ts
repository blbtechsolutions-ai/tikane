import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="reset-view animate-fade-in">
      <!-- Hidden layout asset SVG definitions for gradients used later -->
      <svg width="0" height="0" style="position: absolute;">
        <defs>
          <linearGradient id="logo-right-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00C2FF" />
            <stop offset="100%" stop-color="#005BFF" />
          </linearGradient>
        </defs>
      </svg>

      <header class="reset-header">
        <div class="blbtech-brand">
          <svg class="blbtech-brand__logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="url(#logo-right-grad)"
              stroke-width="5.5"
              stroke-linecap="round"
              stroke-dasharray="180 58"
              transform="rotate(-90 50 50)"
            />
            <line x1="50" y1="28" x2="50" y2="72" stroke="url(#logo-right-grad)" stroke-width="5.5" stroke-linecap="round" />
            <path
              d="M 50 30 C 22 30 22 50 50 50"
              stroke="url(#logo-right-grad)"
              stroke-width="5.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 50 50 C 20 50 20 70 50 70"
              stroke="url(#logo-right-grad)"
              stroke-width="5.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 50 30 C 78 30 78 50 50 50"
              stroke="url(#logo-right-grad)"
              stroke-width="5.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 50 50 C 80 50 80 70 50 70"
              stroke="url(#logo-right-grad)"
              stroke-width="5.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <path
              d="M 43 21 A 8 8 0 0 1 57 21"
              fill="none"
              stroke="url(#logo-right-grad)"
              stroke-width="4.5"
              stroke-linecap="round"
            />
            <path
              d="M 37 14 A 15 14 0 0 1 63 14"
              fill="none"
              stroke="url(#logo-right-grad)"
              stroke-width="4.5"
              stroke-linecap="round"
            />
          </svg>
          <span class="blbtech-brand__text">BLBTECH-SABOTAY</span>
        </div>
        <h1 class="reset-header__title">Nouveau mot de passe</h1>
       
        <p class="reset-header__subtitle">Choisissez un nouveau mot de passe hautement sécurisé</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="on" method="post" class="reset-form">
        <!-- Hidden username field: signals to password managers which account this password belongs to -->
        <input type="hidden" id="username-hint" name="username" autocomplete="username" [value]="emailHint">
        <div class="reset-field-group">
          <label class="reset-field-group__label" for="reset-new-password">Nouveau mot de passe</label>
          <div class="reset-field" [class.reset-field--error]="f['newPassword'].touched && f['newPassword'].invalid">
            <span class="reset-field__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
            <input
              id="reset-new-password"
              name="new-password"
              formControlName="newPassword"
              type="password"
              placeholder="Min. 8 caractères"
              autocomplete="new-password"
            />
          </div>
          <p *ngIf="f['newPassword'].touched && f['newPassword'].errors?.['minlength']"
            class="reset-error-msg animate-slide-up">
            Le mot de passe doit contenir au moins 8 caractères
          </p>
        </div>

        <button
          type="submit"
          [disabled]="loading || form.invalid"
          class="reset-submit-btn"
        >
          <mat-spinner *ngIf="loading" diameter="18" class="spinner-light"></mat-spinner>
          <span>{{ loading ? 'Enregistrement...' : 'Réinitialiser le mot de passe' }}</span>
        </button>
      </form>

      <p class="reset-footer">
        <a routerLink="/auth/login" class="reset-back-link">
          <span class="arrow">←</span> Retourner à la connexion
        </a>
      </p>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        max-width: 440px;
        margin: 0 auto;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }

      .reset-view {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
      }

      .reset-header {
        text-align: center;
        margin-bottom: 28px;
      }

      .reset-header__title {
        color: #1e293b;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.015em;
        margin: 6px 0 2px 0;
      }

      .reset-header__powered {
        font-size: 10.5px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #818cf8;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .reset-header__subtitle {
        color: #64748b;
        font-size: 14.5px;
        font-weight: 400;
        line-height: 1.45;
        max-width: 320px;
        margin: 0 auto;
      }

      .blbtech-brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        margin-bottom: 8px;
      }

      .blbtech-brand__logo {
        height: 38px;
        width: 38px;
        display: block;
      }

      .blbtech-brand__text {
        font-family: 'Inter', -apple-system, system-ui, sans-serif;
        font-weight: 850;
        font-size: 18.5px;
        letter-spacing: 0.08em;
        color: #0c0b29;
        background: linear-gradient(135deg, #13005a 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .reset-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .reset-field-group {
        display: flex;
        flex-direction: column;
      }

      .reset-field-group__label {
        color: #475569;
        font-size: 13.5px;
        font-weight: 500;
        margin-bottom: 7px;
        letter-spacing: -0.01em;
      }

      .reset-field {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }

      .reset-field__icon {
        position: absolute;
        left: 16px;
        color: #94a3b8;
        width: 19px;
        height: 19px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        transition: color 0.25s ease;
      }

      .reset-field {
        input {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #1e293b;
          height: 52px;
          border-radius: 12px;
          padding: 0 16px 0 46px;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

          &::placeholder {
            color: #94a3b8;
            font-weight: 400;
          }

          &:focus {
            border-color: #4f46e5;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);

            + .reset-field__icon {
              color: #4f46e5;
            }
          }
        }
      }

      .reset-field--error {
        input {
          border-color: #ef4444;
          &:focus {
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
          }
        }
        .reset-field__icon {
          color: #ef4444 !important;
        }
      }

      .reset-error-msg {
        color: #ef4444;
        font-size: 12px;
        margin-top: 6px;
        font-weight: 500;
      }

      .reset-submit-btn {
        width: 100%;
        height: 52px;
        border-radius: 12px;
        background: #1e40af;
        color: #ffffff;
        font-weight: 600;
        font-size: 15px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 4px 14px rgba(30, 64, 175, 0.25);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 8px 20px rgba(30, 64, 175, 0.35);
          background: #1e3a8a;
        }

        &:active:not(:disabled) {
          transform: translateY(0.5px);
          box-shadow: 0 2px 8px rgba(19, 0, 90, 0.12);
        }

        &:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          box-shadow: none;
        }
      }

      .reset-footer {
        text-align: center;
        margin-top: 24px;
        margin-bottom: 0;
      }

      .reset-back-link {
        color: #4f46e5;
        font-weight: 600;
        font-size: 13.5px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.25s ease;

        .arrow {
          transition: transform 0.25s ease;
        }

        &:hover {
          color: #4338ca;
          .arrow {
            transform: translateX(-3px);
          }
        }
      }

      .spinner-light ::ng-deep circle {
        stroke: #ffffff !important;
      }
    `,
  ],
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  token = '';
  /** Populated from query param so password managers can associate the new credential */
  emailHint = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.emailHint = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!this.token) {
      this.toastr.error('Token invalide ou manquant', 'Erreur');
      this.router.navigate(['/auth/login']);
    }
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: () => {
        this.toastr.success('Mot de passe réinitialisé avec succès!');
        this.router.navigate(['/auth/login']);
      },
      error: () => { this.loading = false; },
    });
  }
}
