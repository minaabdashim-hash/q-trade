import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  NotificationService,
  type NotificationKind,
} from '../../core/services/notification.service';
import { Icon, type IconName } from './icon';

const TONE: Record<NotificationKind, { icon: IconName; classes: string }> = {
  success: { icon: 'check', classes: 'border-success/40 text-success' },
  error: { icon: 'alert-circle', classes: 'border-danger/40 text-danger' },
  info: { icon: 'info', classes: 'border-line text-fg' },
};

/** Renders NotificationService toasts. Mounted once in the app shell. */
@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    class:
      'pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6',
  },
  template: `
    @for (toast of notifications.notifications(); track toast.id) {
      <output
        class="bg-surface pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
        [class]="tone[toast.kind].classes"
      >
        <app-icon [name]="tone[toast.kind].icon" [size]="18" class="mt-0.5" />
        <span class="text-fg flex-1">{{ toast.text }}</span>
        <button
          type="button"
          class="text-fg-muted hover:text-fg rounded p-0.5"
          aria-label="Dismiss notification"
          (click)="notifications.dismiss(toast.id)"
        >
          <app-icon name="x" [size]="16" />
        </button>
      </output>
    }
  `,
})
export class ToastHost {
  protected readonly notifications = inject(NotificationService);
  protected readonly tone = TONE;
}
