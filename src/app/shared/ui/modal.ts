import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';

/**
 * Wraps the native `<dialog>` element: the platform already provides the
 * backdrop, focus trap, Esc handling and inert background, so there is no
 * overlay/focus-trap code to maintain here.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <!-- Escape is handled natively by <dialog>; the click only closes on the backdrop. -->
    <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #dialog
      class="rounded-card border-line bg-surface text-fg m-auto w-[min(32rem,calc(100vw-2rem))] border p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      [attr.aria-label]="heading()"
      (close)="open.set(false)"
      (click)="onBackdropClick($event)"
    >
      <div class="border-line flex items-start justify-between gap-4 border-b px-5 py-4">
        <h2 class="text-lg font-semibold">{{ heading() }}</h2>
        <button
          type="button"
          class="text-fg-muted hover:bg-surface-alt hover:text-fg rounded-md p-1"
          aria-label="Close dialog"
          (click)="open.set(false)"
        >
          <app-icon name="x" />
        </button>
      </div>

      <div class="px-5 py-4">
        <ng-content />
      </div>

      <footer class="border-line flex justify-end gap-2 border-t px-5 py-4">
        <ng-content select="[modalFooter]" />
      </footer>
    </dialog>
  `,
})
export class Modal {
  readonly open = model(false);
  readonly heading = input('');

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog()?.nativeElement;
      if (!el) return;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  /** `<dialog>` reports backdrop clicks as clicks on the dialog itself. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog()?.nativeElement) this.open.set(false);
  }
}
