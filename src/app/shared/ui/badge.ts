import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-alt text-fg-muted',
  primary: 'bg-primary text-primary-fg',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/15 text-danger',
};

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
  template: `<ng-content />`,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');

  protected readonly classes = computed(
    () =>
      `inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[this.tone()]}`,
  );
}
