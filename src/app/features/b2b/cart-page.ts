import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MAX_QUANTITY, type CartItem, type Order, type OrderPayload } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartStore } from '../../core/services/cart-state';
import { SeoService } from '../../core/services/seo.service';
import { PriceFormatPipe } from '../../shared/pipes/price-format.pipe';
import { FIELD, FIELD_LABEL } from '../../shared/ui/field';
import { Icon } from '../../shared/ui/icon';
import { ProductVisual } from '../products/product-card';

/** B2B cart: the order goes to a manager, who confirms stock, delivery and the final invoice. */
@Component({
  selector: 'app-cart-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PriceFormatPipe, ProductVisual, Icon],
  templateUrl: './cart-page.html',
})
export class CartPage {
  private readonly api = inject(ApiService);
  protected readonly cart = inject(CartStore);
  protected readonly auth = inject(AuthService);
  protected readonly field = FIELD;
  protected readonly label = FIELD_LABEL;
  protected readonly max = MAX_QUANTITY;
  protected readonly comment = signal('');
  protected readonly busy = signal(false);
  protected readonly placed = signal<Order | null>(null);

  constructor() {
    inject(SeoService).setPageMeta({
      title: 'Корзина',
      description: 'Корзина B2B-магазина.',
      path: '/cart',
      noIndex: true,
    });
  }

  protected images(item: CartItem) {
    return item.image
      ? [
          {
            id: item.productId,
            type: 'main_image' as const,
            url: item.image,
            alt: null,
            sortOrder: 0,
          },
        ]
      : [];
  }

  protected setQuantity(model: string, value: string): void {
    const quantity = Number(value);
    if (Number.isInteger(quantity) && quantity >= 1) this.cart.setQuantity(model, quantity);
  }

  protected submit(): void {
    const payload: OrderPayload = {
      items: this.cart
        .items()
        .map(({ productId, model, quantity }) => ({ productId, model, quantity })),
      comment: this.comment().trim() || undefined,
    };
    this.busy.set(true);
    // Failures (e.g. a product lost its price) reach the visitor as the error interceptor's toast.
    this.api.post<Order>('/orders', payload).subscribe({
      next: (order) => {
        this.cart.clear();
        this.comment.set('');
        this.placed.set(order);
        this.busy.set(false);
      },
      error: () => this.busy.set(false),
    });
  }
}
