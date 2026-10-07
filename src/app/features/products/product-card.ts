import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AVAILABILITY_LABELS, type Product, type ProductImage } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { QuoteRequestService } from '../../core/services/quote-request.service';
import { PriceFormatPipe } from '../../shared/pipes/price-format.pipe';
import { Icon } from '../../shared/ui/icon';
import { deviceShape } from './device-shape';

@Component({
  selector: 'app-product-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div
      class="rounded-card bg-surface-alt flex items-center justify-center"
      [class]="compact() ? 'h-40 p-2' : 'aspect-[4/3] p-6'"
    >
      @if (image(); as item) {
        <img
          [src]="item.url"
          [alt]="item.alt || title()"
          class="object-contain transition-transform duration-500 ease-out will-change-transform group-hover:scale-110"
          [class]="item.type === 'icon' ? 'max-h-24 max-w-24' : 'max-h-full max-w-full'"
          (error)="failedUrl.set(item.url)"
        />
      } @else {
        <span class="text-[48px]" [class]="shape()" role="img" [attr.aria-label]="title()"></span>
      }
    </div>
  `,
})
export class ProductVisual {
  readonly images = input.required<ProductImage[]>();
  readonly title = input.required<string>();
  /** Short image box for list cards. */
  readonly compact = input(false);
  readonly categoryId = input('');
  protected readonly shape = computed(() => deviceShape(this.categoryId()));
  protected readonly failedUrl = signal<string | null>(null);
  protected readonly image = computed(() => {
    const images = this.images().filter((item) => item.type !== 'video');
    const image =
      images.find((item) => item.type === 'main_image') ??
      images.find((item) => item.type === 'icon') ??
      images[0];
    return image && image.url !== this.failedUrl() ? image : null;
  });
}

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ProductVisual, PriceFormatPipe, Icon],
  host: { class: 'block h-full' },
  template: `
    <div
      class="rounded-card bg-surface-alt text-fg flex h-full flex-col items-center p-6 text-center transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.25)]"
    >
      <div class="flex h-6 w-full">
        @if (product().badge; as badge) {
          <span
            class="rounded-md bg-[#fdf0d5] px-2.5 py-1 text-xs font-bold tracking-wide text-[#b45309]"
          >
            {{ badges[badge] }}
          </span>
        }
      </div>
      <a [routerLink]="['/products', product().slug]" class="group block w-full">
        <app-product-visual
          [images]="product().images"
          [title]="product().title"
          [compact]="true"
          [categoryId]="product().categoryId"
        />
        <h2
          class="group-hover:text-primary mt-4 text-lg font-bold tracking-tight transition-colors"
        >
          {{ product().title }}
        </h2>
      </a>
      @if (product().tagline ?? product().summary ?? product().model; as line) {
        <p class="text-fg-muted mt-1 line-clamp-3 text-xs">{{ line }}</p>
      }
      @if (product().variants.length) {
        <p class="mt-2 line-clamp-2 text-xs font-medium">{{ product().variants.join(' · ') }}</p>
      }
      <p class="mt-4 text-sm font-semibold">
        @if (product().showPrice && product().price !== null) {
          {{ product().variants.length ? 'от ' : ''
          }}{{ product().price | price: product().currency : { hideZeroCents: true } }}
        } @else {
          Цена по запросу
        }
      </p>
      @if (showAvailability()) {
        <p class="text-xs" [class]="stockTone()">
          {{ availability[product().availability] }}
          @if (product().availability === 'on_order' && product().deliveryTime) {
            · {{ product().deliveryTime }}
          }
        </p>
      }
      @if (auth.isAuthenticated() && product().showPrice) {
        <!-- A series is ordered by its concrete model, which is picked on the product page. -->
        <a
          [routerLink]="['/products', product().slug]"
          class="bg-primary hover:bg-primary-hover mt-5 inline-flex h-9 items-center gap-1.5 rounded-md px-6 text-xs font-semibold text-white transition-colors"
        >
          <app-icon name="shopping-cart" [size]="14" />
          {{ product().variants.length ? 'Выбрать модель' : 'Заказать' }}
        </a>
      } @else {
        <button
          type="button"
          class="bg-primary hover:bg-primary-hover mt-5 inline-flex h-9 items-center rounded-md px-6 text-xs font-semibold text-white transition-colors"
          (click)="quote.show(product().title)"
        >
          {{ product().showPrice && product().price !== null ? 'Запросить КП' : 'Запросить цену' }}
        </button>
      }
      @if (comparable()) {
        <label class="text-fg-muted mt-3 flex cursor-pointer items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            [checked]="compared()"
            (change)="compareChange.emit($any($event.target).checked)"
          />
          Сравнить
        </label>
      }
    </div>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** Shows the "Сравнить" checkbox; the parent owns the selection. */
  readonly comparable = input(false);
  readonly compared = input(false);
  readonly compareChange = output<boolean>();
  protected readonly quote = inject(QuoteRequestService);
  protected readonly auth = inject(AuthService);
  protected readonly availability = AVAILABILITY_LABELS;
  protected readonly badges = { new: 'NEW', hit: 'ХИТ', discount: 'СКИДКА' };
  /** "Под заказ" without a lead time is only the default, not information. */
  protected readonly showAvailability = computed(
    () => this.product().availability !== 'on_order' || !!this.product().deliveryTime,
  );
  protected readonly stockTone = computed(() =>
    this.product().availability === 'in_stock'
      ? 'text-success'
      : this.product().availability === 'discontinued'
        ? 'text-fg-muted'
        : 'text-warning',
  );
}
