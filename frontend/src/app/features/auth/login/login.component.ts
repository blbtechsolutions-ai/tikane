import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <div class="login-view">
      <!-- Hidden layout asset SVG definitions for gradients used later -->
      <svg width="0" height="0" style="position: absolute;">
        <defs>
          <linearGradient id="logo-right-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00C2FF" />
            <stop offset="100%" stop-color="#005BFF" />
          </linearGradient>
        </defs>
      </svg>

      <header class="login-view__header">
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
        <h1 class="login-view__title">Connectez-vous</h1>
      
        <p class="login-view__subtitle">Accédez à votre compte fintech premium</p>
      </header>

      <form
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        autocomplete="on"
        method="post"
        novalidate
        class="login-form"
      >
        <div class="login-field-group">
          <label class="login-field-group__label" for="login-email">Adresse Email</label>
          <div class="login-field" [class.login-field--error]="f['email'].touched && f['email'].invalid">
            <span class="login-field__icon" aria-hidden="true">
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
              id="login-email"
              name="username"
              formControlName="email"
              type="email"
              placeholder="votre@email.com"
              inputmode="email"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              class="login-field__input"
            />
          </div>
          <p *ngIf="f['email'].touched && f['email'].errors?.['required']" class="login-field-group__error">
            Email requis
          </p>
          <p *ngIf="f['email'].touched && f['email'].errors?.['email']" class="login-field-group__error">
            Email invalide
          </p>
        </div>

        <div class="login-field-group">
          <label class="login-field-group__label" for="login-password">Mot de passe</label>
          <div class="login-field" [class.login-field--error]="f['password'].touched && f['password'].invalid">
            <span class="login-field__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.5 10.5V7.875a4.5 4.5 0 1 1 9 0V10.5M6.75 10.5h10.5A1.5 1.5 0 0 1 18.75 12v7.125a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <input
              id="login-password"
              name="password"
              formControlName="password"
              [type]="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              class="login-field__input login-field__input--password"
            />
            <button
              type="button"
              class="login-field__toggle"
              (click)="showPassword = !showPassword"
              [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 3l18 18M10.586 10.587a2 2 0 1 0 2.827 2.827M9.878 5.092A10.45 10.45 0 0 1 12 4.875c5.25 0 9.074 3.63 10.125 7.125a11.787 11.787 0 0 1-3.075 4.848M6.227 6.226C3.99 7.678 2.512 9.861 1.875 12c1.05 3.495 4.875 7.125 10.125 7.125 1.832 0 3.501-.442 4.969-1.174"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <p *ngIf="f['password'].touched && f['password'].errors?.['required']" class="login-field-group__error">
            Mot de passe requis
          </p>
        </div>

        <div class="login-form__actions">
          <a routerLink="/auth/forgot-password" class="login-form__forgot-link">Mot de passe oublié ?</a>
        </div>

        <button type="submit" [disabled]="loading" class="login-form__submit">
          <span *ngIf="loading" class="login-form__spinner" aria-hidden="true"></span>
          <span>{{ loading ? 'Connexion...' : 'Se connecter' }}</span>
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        color: #151a2d;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .login-view {
        width: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .blbtech-brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        margin-bottom: 24px;
        width: 100%;
      }

      .blbtech-brand__logo {
        width: 72px;
        height: 72px;
      }

      .blbtech-brand__text {
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        color: #161b2e;
        margin-left: 0.16em;
      }

      .login-view__header {
        width: 100%;
        margin-bottom: 34px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .login-view__title {
        margin: 0;
        color: #161b2e;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 2.3rem;
        font-weight: 700;
        line-height: 1.15;
        letter-spacing: -0.025em;
        text-align: center;
      }

      .login-view__powered {
        margin: 6px 0 0;
        color: #1a0b6b;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.35;
        letter-spacing: -0.01em;
      }

      .login-view__subtitle {
        margin: 10px 0 0;
        color: #64748b;
        font-size: 0.95rem;
        font-weight: 400;
        line-height: 1.4;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
        width: min(100%, 386px);
        margin: 0 auto;
      }

      .login-field-group {
        display: flex;
        flex-direction: column;
      }

      .login-field-group__label {
        margin-bottom: 8px;
        color: #334155;
        font-size: 0.92rem;
        font-weight: 550;
        line-height: 1.35;
      }

      .login-field {
        position: relative;
      }

      .login-field__icon {
        position: absolute;
        top: 50%;
        left: 17px;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        color: #94a3b8;
        transform: translateY(-50%);
        pointer-events: none;
      }

      .login-field__icon svg,
      .login-field__toggle svg {
        width: 100%;
        height: 100%;
      }

      .login-field__input {
        width: 100%;
        height: 52px;
        padding: 0 18px 0 50px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        background: #ffffff;
        color: #0f172a;
        font-size: 0.98rem;
        font-weight: 400;
        line-height: 1.25;
        outline: none;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .login-field__input::placeholder {
        color: #94a3b8;
      }

      .login-field__input:focus {
        border-color: #4f46e5;
        background: #ffffff;
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .login-field__input--password {
        padding-right: 52px;
      }

      .login-field__toggle {
        position: absolute;
        top: 50%;
        right: 15px;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        padding: 0;
        border: 0;
        background: transparent;
        color: #94a3b8;
        transform: translateY(-50%);
        cursor: pointer;
        transition: color 0.18s ease;
      }

      .login-field__toggle:hover {
        color: #475569;
      }

      .login-field--error .login-field__input {
        border-color: #ef4444;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
      }

      .login-field-group__error {
        margin: 6px 0 0;
        color: #ef4444;
        font-size: 0.8rem;
        line-height: 1.35;
      }

      .login-form__actions {
        display: flex;
        justify-content: flex-end;
        margin-top: -2px;
        margin-bottom: 4px;
      }

      .login-form__forgot-link {
        color: #475569;
        font-size: 0.88rem;
        font-weight: 500;
        line-height: 1.35;
        text-decoration: none;
        transition: color 0.18s ease;
      }

      .login-form__forgot-link:hover {
        color: #1e1161;
        text-decoration: underline;
      }

      .login-form__submit {
        position: relative;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        height: 52px;
        margin-top: 4px;
        border: 0;
        border-radius: 12px;
        background: #1e40af;
        color: #ffffff;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.01em;
        box-shadow: 0 4px 14px rgba(30, 64, 175, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12);
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .login-form__submit:hover:not(:disabled) {
        transform: translateY(-1.5px);
        box-shadow: 0 8px 20px rgba(30, 64, 175, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        background: #1e3a8a;
      }

      .login-form__submit:active:not(:disabled) {
        transform: translateY(0.5px);
        box-shadow: 0 3px 10px rgba(30, 64, 175, 0.2);
      }

      .login-form__submit:disabled {
        opacity: 0.8;
        cursor: progress;
      }

      .login-form__spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.35);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: login-spin 0.8s linear infinite;
      }

      @keyframes login-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (max-width: 1100px) {
        :host {
          width: min(100%, 500px);
        }

        .login-view__title {
          font-size: 2.1rem;
          white-space: normal;
        }

        .login-view__header {
          margin-bottom: 28px;
        }
      }

      @media (max-width: 640px) {
        :host {
          width: 100%;
        }

        .login-view__header {
          margin-bottom: 24px;
        }

        .login-view__title {
          font-size: 1.95rem;
          line-height: 1.1;
          white-space: normal;
        }

        .login-view__subtitle {
          margin-top: 8px;
          font-size: 0.92rem;
        }

        .login-form {
          width: 100%;
          gap: 16px;
        }
      }
    `,
  ],
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private ngZone: NgZone,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  get f() { return this.form.controls; }

  private getRedirectTarget(role?: string): string {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return '/admin';
    }

    if (role === 'AGENT') {
      return '/agent';
    }

    return '/dashboard';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const user = this.auth.currentUser;
        this.toastr.success(`Bienvenue, ${user?.firstName}!`, 'Connexion réussie');
        queueMicrotask(() => {
          this.ngZone.run(() => {
            void this.router.navigateByUrl(this.getRedirectTarget(user?.role), {
              replaceUrl: true,
            });
          });
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
