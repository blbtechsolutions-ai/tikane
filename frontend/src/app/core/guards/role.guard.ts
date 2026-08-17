import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const requiredRoles: string[] = route.data['roles'] ?? [];

  if (!auth.isAuthenticated) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (requiredRoles.length === 0 || auth.hasRole(...requiredRoles)) {
    return true;
  }

  router.navigate(['/403']);
  return false;
};
