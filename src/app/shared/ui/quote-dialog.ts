import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuoteRequestService } from '../../core/services/quote-request.service';
import { FIELD, FIELD_LABEL, fieldInvalid } from './field';
import { Modal } from './modal';

/** "Запросить КП" dialog: name, email, phone plus a free-text message. Mounted once in the app shell. */
@Component({
  selector: 'app-quote-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Modal],
  template: `
    <app-modal [(open)]="quote.open" heading="Запросить КП">
      <p class="text-fg-muted -mt-1 mb-6 text-[0.95rem] leading-snug">
        Расскажите, что нужно, — подготовим коммерческое предложение.
      </p>
      <form id="quote-form" [formGroup]="form" (ngSubmit)="submit()" class="space-y-3" novalidate>
        <label class="relative block">
          <input
            type="text"
            formControlName="name"
            autocomplete="name"
            placeholder=" "
            [class]="field + ' h-14'"
            [attr.aria-invalid]="invalid(form.controls.name)"
          />
          <span [class]="label">Имя</span>
        </label>
        <label class="relative block">
          <input
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder=" "
            [class]="field + ' h-14'"
            [attr.aria-invalid]="invalid(form.controls.email)"
          />
          <span [class]="label">Email</span>
        </label>
        <label class="relative block">
          <input
            type="tel"
            formControlName="phone"
            autocomplete="tel"
            placeholder="+7 (___) ___-__-__"
            [class]="field + ' h-14'"
            [attr.aria-invalid]="invalid(form.controls.phone)"
          />
          <span [class]="label">Телефон</span>
        </label>
        <label class="relative block">
          <textarea
            formControlName="message"
            rows="4"
            placeholder="Модели, количество, сроки, пожелания"
            [class]="field + ' min-h-32 resize-none pt-7'"
          ></textarea>
          <span [class]="label">Сообщение</span>
        </label>
        @if (error()) {
          <p role="alert" class="text-danger px-1 text-sm">{{ error() }}</p>
        }
      </form>

      <ng-container modalFooter>
        <button
          type="submit"
          form="quote-form"
          class="bg-primary hover:bg-primary-hover h-12 w-full rounded-full text-[0.95rem] font-medium text-white transition-colors"
        >
          Отправить запрос
        </button>
        <button
          type="button"
          class="text-primary mx-auto text-sm hover:underline"
          (click)="quote.open.set(false)"
        >
          Отмена
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class QuoteDialog {
  protected readonly quote = inject(QuoteRequestService);
  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly field = FIELD;
  protected readonly label = FIELD_LABEL;
  protected readonly invalid = fieldInvalid;
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s()-]{10,}$/)]],
    message: [''],
  });

  constructor() {
    // Every opening starts clean, with the product the visitor clicked from as the first line.
    effect(() => {
      if (!this.quote.open()) return;
      const subject = this.quote.subject();
      untracked(() => {
        this.form.reset({ message: subject ? `Интересует: ${subject}. ` : '' });
        this.error.set(null);
      });
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // ponytail: the backend has no inquiry endpoint yet; do not pretend it was sent.
    this.error.set('Приём заявок пока не подключён. Свяжитесь с менеджером по телефону.');
  }
}
