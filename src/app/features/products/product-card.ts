import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AVAILABILITY_LABELS, type Product, type ProductImage } from '../../core/models';
import { PriceFormatPipe } from '../../shared/pipes/price-format.pipe';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-product-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { class: 'block' },
  template: `
    <div class="rounded-card bg-surface-alt flex aspect-[4/3] items-center justify-center p-6">
      @if (image(); as item) {
        <img
          [src]="item.url"
          [alt]="item.alt || title()"
          class="max-h-full max-w-full object-contain"
          (error)="failedUrl.set(item.url)"
        />
      } @else {
        <div class="text-fg-muted flex flex-col items-center gap-4">
          <app-icon name="package" [size]="64" [strokeWidth]="1" />
          <span class="text-sm">Фото скоро появится</span>
        </div>
      }
    </div>
  `,
})
export class ProductVisual {
  readonly images = input.required<ProductImage[]>();
  readonly title = input.required<string>();
  protected readonly failedUrl = signal<string | null>(null);
  protected readonly image = computed(() => {
    const images = this.images().filter((item) => item.type !== 'video' && item.type !== 'icon');
    const image = images.find((item) => item.type === 'main_image') ?? images[0];
    return image && image.url !== this.failedUrl() ? image : null;
  });
}

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductVisual, PriceFormatPipe, Icon],
  host: { class: 'block h-full' },
  template: `
    <a
      [routerLink]="['/products', product().slug]"
      class="group rounded-card text-fg flex h-full flex-col bg-white p-6 transition-shadow hover:shadow-lg"
    >
      <app-product-visual [images]="product().images" [title]="product().title" />
      <div class="mt-6 flex items-center justify-between gap-2 text-sm">
        <span class="text-fg-muted">{{ availability[product().availability] }}</span>
        @if (product().badge; as badge) {
          <span class="bg-surface-alt rounded-full px-3 py-1">{{ badges[badge] }}</span>
        }
      </div>
      <h2 class="mt-3 text-2xl font-semibold tracking-tight">{{ product().title }}</h2>
      @if (product().summary) {
        <p class="text-fg-muted mt-3">{{ product().summary }}</p>
      }
      <div class="mt-auto pt-6">
        <p class="font-medium">
          @if (product().showPrice && product().price !== null) {
            от {{ product().price | price: product().currency : { hideZeroCents: true } }}
          } @else {
            Цена по запросу
          }
        </p>
        <span class="text-primary mt-4 inline-flex items-center gap-1 group-hover:underline">
          Подробнее <app-icon name="chevron-right" [size]="16" />
        </span>
      </div>
    </a>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  protected readonly availability = AVAILABILITY_LABELS;
  protected readonly badges = { new: 'Новинка', hit: 'Хит', discount: 'Скидка' };
}
