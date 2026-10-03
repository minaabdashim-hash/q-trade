import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/** Attaches the JWT access token to first-party API calls only. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).accessToken;
  if (!token || !req.url.startsWith(environment.apiUrl)) return next(req);

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
