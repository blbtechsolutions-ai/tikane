import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="animate-fade-in space-y-6 max-w-2xl">
      <div class="page-header">
        <h1>Sécurité du compte</h1>
        <p>Changez votre mot de passe après votre première connexion ou à tout moment.</p>
      </div>

      <div class="tikane-card space-y-4">
        <div>
          <h3 class="font-semibold" style="color: var(--text-primary)">Changer le mot de passe</h3>
          <p class="text-sm" style="color: var(--text-muted)">
            Utilisez d'abord le mot de passe transmis par l'administration, puis définissez votre propre mot de passe.
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="on" method="post" class="space-y-4">
          <!-- Hidden username field: allows password managers to associate the new password with the correct account -->
          <input type="hidden" id="username-hint" name="username" autocomplete="username" [value]="userEmail">
          <div>
            <label class="block text-xs font-medium mb-1.5" for="current-password" style="color: var(--text-secondary)">Mot de passe actuel</label>
            <input id="current-password" name="current-password" formControlName="currentPassword" type="password" autocomplete="current-password"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>

          <div>
            <label class="block text-xs font-medium mb-1.5" for="new-password" style="color: var(--text-secondary)">Nouveau mot de passe</label>
            <input id="new-password" name="new-password" formControlName="newPassword" type="password" autocomplete="new-password"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
            <p class="text-xs mt-2" style="color: var(--text-muted)">
              Minimum 8 caractères, avec une majuscule, une minuscule et un chiffre.
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium mb-1.5" for="confirm-new-password" style="color: var(--text-secondary)">Confirmer le nouveau mot de passe</label>
            <input id="confirm-new-password" name="confirm-new-password" formControlName="confirmPassword" type="password" autocomplete="new-password"
              class="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style="background: var(--surface-bg); border: 1px solid var(--surface-border); color: var(--text-primary)" />
          </div>

          <button mat-flat-button type="submit" [disabled]="submitting || form.invalid"
            class="!rounded-xl text-white" style="background: #1e40af">
            <mat-spinner *ngIf="submitting" diameter="18" class="mr-2"></mat-spinner>
            {{ submitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {
  submitting = false;
  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
    confirmPassword: ['', Validators.required],
  });

  get userEmail(): string {
    return this.auth.currentUser?.email ?? '';
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toastr: ToastrService,
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.toastr.error('La confirmation ne correspond pas au nouveau mot de passe');
      return;
    }

    this.submitting = true;
    this.auth.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.form.reset();
        this.submitting = false;
        this.toastr.success('Mot de passe modifié avec succès');
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}