import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/** Blocks a route for anonymous visitors and remembers where they wanted to go. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  if (auth.isAuthenticated()) return true;

  inject(NotificationService).info('Please sign in to continue.');
  return inject(Router).createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
