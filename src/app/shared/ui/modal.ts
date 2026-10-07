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
      class="bg-surface text-fg open:animate-sheet-in m-auto w-[min(30rem,calc(100vw-2rem))] rounded-[28px] p-0 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.45)] backdrop:bg-black/35 backdrop:backdrop-blur-2xl backdrop:backdrop-saturate-150 motion-reduce:animate-none"
      [attr.aria-label]="heading()"
      (close)="open.set(false)"
      (click)="onBackdropClick($event)"
    >
      <div class="flex items-start justify-between gap-4 px-6 pt-7 sm:px-9 sm:pt-9">
        <h2 class="text-[1.75rem] leading-tight font-semibold tracking-tight">{{ heading() }}</h2>
        <button
          type="button"
          class="bg-surface-alt text-fg-muted hover:text-fg inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
          aria-label="Close dialog"
          (click)="open.set(false)"
        >
          <app-icon name="x" [size]="16" />
        </button>
      </div>

      <div class="px-6 pt-2 pb-6 sm:px-9">
        <ng-content />
      </div>

      <footer class="flex flex-col gap-3 px-6 pb-7 sm:px-9 sm:pb-9">
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
