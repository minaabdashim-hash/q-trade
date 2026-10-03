import { Directive, computed, input } from '@angular/core';

/**
 * Styles native form controls. Keeping the native element means Angular forms,
 * validation and autofill work without a ControlValueAccessor shim.
 */
@Directive({
  selector: 'input[appInput], textarea[appInput], select[appInput]',
  host: {
    '[class]': 'classes()',
    '[attr.aria-invalid]': 'invalid() || null',
  },
})
export class InputDirective {
  /** Mirror of the control's error state; drives the danger ring. */
  readonly invalid = input(false);

  protected readonly classes = computed(
    () =>
      'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted ' +
      'transition-colors disabled:cursor-not-allowed disabled:opacity-60 ' +
      (this.invalid() ? 'border-danger focus-visible:outline-danger' : 'border-line'),
  );
}
