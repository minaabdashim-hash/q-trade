import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorStatus } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { FIELD, FIELD_LABEL, fieldInvalid } from '../../shared/ui/field';

/** Sign-in and registration request for the B2B shop; the route's `mode` data picks the tab. */
@Component({
  selector: 'app-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly mode = input<'login' | 'register'>('login');
  protected readonly field = FIELD;
  protected readonly label = FIELD_LABEL;
  protected readonly invalid = fieldInvalid;
  protected readonly submitButton =
    'bg-primary hover:bg-primary-hover mt-3 h-12 w-full rounded-full text-[0.95rem] font-medium ' +
    'text-white transition-colors disabled:pointer-events-none disabled:opacity-50';
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  /** Account requests are reviewed by a manager, so there is no password here. */
  protected readonly registerForm = this.fb.group({
    company: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s()-]{10,}$/)]],
  });

  constructor() {
    inject(SeoService).setPageMeta({
      title: 'B2B Shop — вход',
      description: 'Вход и запрос на регистрацию в B2B-магазине.',
      path: '/auth/login',
      noIndex: true,
    });
    if (this.auth.isAuthenticated()) void this.router.navigateByUrl(this.returnUrl());
  }

  /** Only same-site paths, so a crafted link cannot send the partner elsewhere after sign-in. */
  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/catalog';
  }

  protected submit(): void {
    const register = this.mode() === 'register';
    const form = register ? this.registerForm : this.loginForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    if (register) {
      // ponytail: the backend has no registration-request endpoint yet; do not pretend it was sent.
      this.busy.set(false);
      this.error.set('Приём запросов пока не подключён. Свяжитесь с менеджером по телефону.');
      return;
    }
    this.auth.login(this.loginForm.getRawValue()).subscribe({
      // After sign-in the partner lands in the same catalog, now with prices and a cart.
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: (error: unknown) => {
        this.busy.set(false);
        this.error.set(
          apiErrorStatus(error) === 401
            ? 'Неверный email или пароль.'
            : 'Не удалось войти. Попробуйте ещё раз.',
        );
      },
    });
  }
}
