import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/** Turns HTTP failures into a single user-facing toast and a typed rethrow. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && auth.isAuthenticated()) {
          auth.logout('/auth/login');
        }
        // The sign-in form shows its own error next to the fields.
        if (!req.url.endsWith('/auth/login')) notifications.error(messageFor(error));
      }
      return throwError(() => error);
    }),
  );
};

function messageFor(error: HttpErrorResponse): string {
  const body = error.error as { error?: { message?: string }; message?: string } | null;
  const serverMessage = body?.error?.message ?? body?.message;
  if (serverMessage) return serverMessage;

  switch (error.status) {
    case 0:
      return 'Не удалось связаться с сервером. Попробуйте ещё раз.';
    case 401:
      return 'Сессия истекла. Войдите снова.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'We could not find what you were looking for.';
    case 422:
      return 'Some of the submitted data is invalid.';
    default:
      return error.status >= 500 ? 'Something went wrong on our side.' : 'Request failed.';
  }
}
