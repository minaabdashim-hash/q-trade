import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'inline-flex items-center gap-2', role: 'status' },
  template: `
    <app-icon name="loader" [size]="size()" class="animate-spin" />
    <span class="sr-only">{{ label() }}</span>
  `,
})
export class Spinner {
  readonly size = input(20);
  readonly label = input('Loading');
}
