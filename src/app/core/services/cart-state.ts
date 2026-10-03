import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { CartItem, CartTotals, Product } from '../models';
import { toCartItem } from '../models';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'qt.cart';
const FREE_SHIPPING_THRESHOLD = 75;
const TAX_RATE = 0.2;

interface CartState {
  items: CartItem[];
  /** Set by checkout once a shipping method is picked. */
  shippingPrice: number;
  discount: number;
  promoCode: string | null;
}

const initialState: CartState = { items: [], shippingPrice: 0, discount: 0, promoCode: null };

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items, shippingPrice, discount }) => ({
    count: computed(() => items().reduce((sum, i) => sum + i.quantity, 0)),
    isEmpty: computed(() => items().length === 0),
    subtotal: computed(() => items().reduce((sum, i) => sum + i.price * i.quantity, 0)),
    currency: computed(() => items()[0]?.currency ?? 'KZT'),
    totals: computed<CartTotals>(() => {
      const subtotal = items().reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discounted = Math.max(0, subtotal - discount());
      const shipping = discounted >= FREE_SHIPPING_THRESHOLD ? 0 : shippingPrice();
      const tax = round(discounted * TAX_RATE);
      return {
        subtotal: round(subtotal),
        discount: round(discount()),
        shipping: round(shipping),
        tax,
        total: round(discounted + shipping + tax),
        currency: items()[0]?.currency ?? 'KZT',
      };
    }),
  })),
  withMethods((store) => {
    const notifications = inject(NotificationService);

    return {
      add(product: Product, quantity = 1): void {
        const existing = store.items().find((i) => i.productId === product.id);
        let item: CartItem;
        try {
          item = toCartItem(product, (existing?.quantity ?? 0) + quantity);
        } catch (error) {
          notifications.error((error as Error).message);
          return;
        }

        patchState(store, {
          items: existing
            ? store.items().map((i) => (i.productId === product.id ? item : i))
            : [...store.items(), item],
        });
        notifications.success(`${product.title} added to cart`);
      },

      setQuantity(productId: string, quantity: number): void {
        if (quantity <= 0) {
          patchState(store, { items: store.items().filter((i) => i.productId !== productId) });
          return;
        }
        patchState(store, {
          items: store
            .items()
            .map((i) =>
              i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i,
            ),
        });
      },

      remove(productId: string): void {
        patchState(store, { items: store.items().filter((i) => i.productId !== productId) });
      },

      setShippingPrice(shippingPrice: number): void {
        patchState(store, { shippingPrice });
      },

      applyPromo(promoCode: string, discount: number): void {
        patchState(store, { promoCode, discount });
      },

      clear(): void {
        patchState(store, initialState);
      },
    };
  }),
  withHooks({
    onInit(store) {
      const storage = inject(StorageService);
      const persisted = storage.read<CartState>(STORAGE_KEY);
      if (persisted) patchState(store, persisted);

      // Mirror every change back to localStorage (no-op during SSR).
      effect(() =>
        storage.write(STORAGE_KEY, {
          items: store.items(),
          shippingPrice: store.shippingPrice(),
          discount: store.discount(),
          promoCode: store.promoCode(),
        } satisfies CartState),
      );
    },
  }),
);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
