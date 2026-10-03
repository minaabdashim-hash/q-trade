import { Directive, computed, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
  secondary: 'bg-secondary text-secondary-fg hover:brightness-95',
  outline: 'border border-line bg-surface text-fg hover:bg-surface-alt',
  ghost: 'text-fg hover:bg-surface-alt',
  danger: 'bg-danger text-white hover:brightness-95',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'size-10 p-0',
};

/**
 * Styles native buttons and anchors instead of wrapping them, so `type`,
 * `disabled`, `form` and `routerLink` keep working without pass-through inputs.
 */
@Directive({
  selector: 'button[appButton], a[appButton]',
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.disabled]': 'disabledAttr()',
  },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false);
  readonly disabled = input(false);

  protected readonly classes = computed(
    () => `${BASE} ${VARIANTS[this.variant()]} ${SIZES[this.size()]}`,
  );

  protected readonly disabledAttr = computed(() =>
    this.disabled() || this.loading() ? true : null,
  );
}
