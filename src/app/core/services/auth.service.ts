import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import type { AuthSession, LoginPayload, RegisterPayload, User, UserRole } from '../models';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'qt.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly session = signal<AuthSession | null>(
    this.storage.read<AuthSession>(STORAGE_KEY),
  );

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isAdmin = computed(() => this.hasRole('admin'));

  /** Read synchronously by the auth interceptor. */
  get accessToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  hasRole(role: UserRole): boolean {
    return !!this.user()?.roles.includes(role);
  }

  login(payload: LoginPayload) {
    return this.api
      .post<AuthSession>('/auth/login', payload)
      .pipe(tap((session) => this.setSession(session)));
  }

  register(payload: RegisterPayload) {
    return this.api
      .post<AuthSession>('/auth/register', payload)
      .pipe(tap((session) => this.setSession(session)));
  }

  requestPasswordReset(email: string) {
    return this.api.post<void>('/auth/forgot-password', { email });
  }

  refresh() {
    const refreshToken = this.session()?.refreshToken;
    return this.api
      .post<AuthSession>('/auth/refresh', { refreshToken })
      .pipe(tap((session) => this.setSession(session)));
  }

  logout(redirectTo = '/'): void {
    this.session.set(null);
    this.storage.remove(STORAGE_KEY);
    void this.router.navigateByUrl(redirectTo);
  }

  private setSession(session: AuthSession): void {
    this.session.set(session);
    this.storage.write(STORAGE_KEY, session);
  }
}
