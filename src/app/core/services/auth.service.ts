import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import type { AuthSession, LoginPayload, User } from '../models';
import { ApiService } from './api.service';
import { CartStore } from './cart-state';
import { StorageService } from './storage.service';

export const SESSION_KEY = 'qt.session';

/** B2B partner session. The token lives in localStorage, so the server render is always anonymous. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartStore);

  private readonly session = signal<AuthSession | null>(this.restore());

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  /** Read synchronously by the auth interceptor. */
  get accessToken(): string | null {
    return this.session()?.token ?? null;
  }

  login(payload: LoginPayload) {
    return this.api.post<AuthSession>('/auth/login', payload).pipe(
      tap((session) => {
        this.session.set(session);
        this.storage.write(SESSION_KEY, session);
      }),
    );
  }

  logout(redirectTo = '/'): void {
    // Revoke the token server-side; the interceptor attaches it before the session is cleared below.
    if (this.session()) this.api.post('/auth/logout').subscribe({ error: () => undefined });
    this.session.set(null);
    this.storage.remove(SESSION_KEY);
    this.cart.clear();
    void this.router.navigateByUrl(redirectTo);
  }

  private restore(): AuthSession | null {
    const session = this.storage.read<AuthSession>(SESSION_KEY);
    if (session?.token && Date.parse(session.expiresAt) > Date.now()) return session;
    this.storage.remove(SESSION_KEY);
    return null;
  }
}
