import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="forgot-view animate-fade-in">
      <!-- Hidden layout asset SVG definitions for gradients used later -->
      <svg width="0" height="0" style="position: absolute;">
        <defs>
          <linearGradient id="logo-right-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00C2FF" />
            <stop offset="100%" stop-color="#005BFF" />
          </linearGradient>
        </defs>
      </svg>

      <header class="forgot-header">
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
        <h1 class="forgot-header__title">Mot de passe oublié</h1>
        
        <p class="forgot-header__subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>
      </header>

      <div *ngIf="!sent">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="on" method="post" class="forgot-form">
          <div class="forgot-field-group">
            <label class="forgot-field-group__label" for="forgot-password-email">Adresse Email</label>
            <div class="forgot-field" [class.forgot-field--error]="form.get('email')?.touched && form.get('email')?.invalid">
              <span class="forgot-field__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M16.5 8.625a4.875 4.875 0 1 0 0 6.75V12a2.625 2.625 0 0 0 5.25 0v-.375A9.375 9.375 0 1 0 12 21.375"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <input
                id="forgot-password-email"
                name="username"
                formControlName="email"
                type="email"
                placeholder="votre@email.com"
                inputmode="email"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
              />
            </div>
            <p
              *ngIf="form.get('email')?.touched && form.get('email')?.invalid"
              class="forgot-error-msg"
            >
              Veuillez saisir une adresse email valide
            </p>
          </div>

          <button
            type="submit"
            [disabled]="loading || form.invalid"
            class="forgot-submit-btn"
          >
            <mat-spinner *ngIf="loading" diameter="18" class="spinner-light"></mat-spinner>
            <span>{{ loading ? 'Envoi...' : 'Envoyer le lien' }}</span>
          </button>
        </form>
      </div>

      <div *ngIf="sent" class="forgot-success">
        <div class="forgot-success__icon-box">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12 l5 5 L20 7" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="forgot-success__title">Email de réinitialisation envoyé !</h2>
        <p class="forgot-success__desc">
          Un lien sécurisé de réinitialisation a été transmis à votre adresse email. S'il n'apparaît pas d'ici quelques minutes, vérifiez votre dossier de spams.
        </p>
      </div>

      <p class="forgot-footer">
        <a routerLink="/auth/login" class="forgot-back-link">
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

      .forgot-view {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
      }

      .forgot-header {
        text-align: center;
        margin-bottom: 28px;
      }

      .forgot-header__title {
        color: #1e293b;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -0.015em;
        margin: 6px 0 2px 0;
      }

      .forgot-header__powered {
        font-size: 10.5px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #818cf8;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .forgot-header__subtitle {
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

      .forgot-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .forgot-field-group {
        display: flex;
        flex-direction: column;
      }

      .forgot-field-group__label {
        color: #475569;
        font-size: 13.5px;
        font-weight: 500;
        margin-bottom: 7px;
        letter-spacing: -0.01em;
      }

      .forgot-field {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
      }

      .forgot-field__icon {
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

      .forgot-field {
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

            + .forgot-field__icon {
              color: #4f46e5;
            }
          }
        }
      }

      .forgot-field--error {
        input {
          border-color: #ef4444;
          &:focus {
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
          }
        }
        .forgot-field__icon {
          color: #ef4444 !important;
        }
      }

      .forgot-error-msg {
        color: #ef4444;
        font-size: 12px;
        margin-top: 6px;
        font-weight: 500;
      }

      .forgot-submit-btn {
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

      .forgot-success {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
      }

      .forgot-success__icon-box {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #ecfdf5;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }

      .forgot-success__icon-box svg {
        width: 22px;
        height: 22px;
      }

      .forgot-success__title {
        color: #0f172a;
        font-size: 17px;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .forgot-success__desc {
        color: #475569;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
      }

      .forgot-footer {
        text-align: center;
        margin-top: 24px;
        margin-bottom: 0;
      }

      .forgot-back-link {
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
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  sent = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private toastr: ToastrService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.forgotPassword(this.form.value.email).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
