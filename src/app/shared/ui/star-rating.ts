import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-star-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'inline-flex items-center gap-0.5' },
  template: `
    @for (star of stars(); track $index) {
      <app-icon
        name="star"
        [size]="size()"
        [class]="star ? 'text-secondary [&_svg]:fill-current' : 'text-line'"
      />
    }
    <span class="sr-only">{{ value() }} out of 5</span>
  `,
})
export class StarRating {
  readonly value = input.required<number>();
  readonly size = input(14);

  protected readonly stars = computed(() => {
    const rounded = Math.round(this.value());
    return Array.from({ length: 5 }, (_, i) => i < rounded);
  });
}
