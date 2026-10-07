import { computed, effect, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { CartItem, Product, ProductModel } from '../models';
import { MAX_QUANTITY, toCartItem } from '../models';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'qt.cart';

interface CartState {
  items: CartItem[];
}

/** B2B cart. No shipping, tax or promo maths: the manager confirms the final terms. */
export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ items: [] }),
  withComputed(({ items }) => ({
    count: computed(() => items().reduce((sum, i) => sum + i.quantity, 0)),
    isEmpty: computed(() => items().length === 0),
    total: computed(
      () => Math.round(items().reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100,
    ),
    currency: computed(() => items()[0]?.currency ?? 'KZT'),
  })),
  withMethods((store) => {
    const notifications = inject(NotificationService);
    return {
      add(product: Product, model: Pick<ProductModel, 'model' | 'label'>, quantity = 1): void {
        const existing = store.items().find((i) => i.model === model.model);
        let item: CartItem;
        try {
          item = toCartItem(product, model, (existing?.quantity ?? 0) + quantity);
        } catch (error) {
          notifications.error((error as Error).message);
          return;
        }
        patchState(store, {
          items: existing
            ? store.items().map((i) => (i.model === model.model ? item : i))
            : [...store.items(), item],
        });
        notifications.success(
          `«${[item.title, item.modelLabel].filter(Boolean).join(' · ')}» в корзине`,
        );
      },

      setQuantity(model: string, quantity: number): void {
        if (!Number.isInteger(quantity)) return;
        patchState(store, {
          items:
            quantity <= 0
              ? store.items().filter((i) => i.model !== model)
              : store
                  .items()
                  .map((i) =>
                    i.model === model ? { ...i, quantity: Math.min(quantity, MAX_QUANTITY) } : i,
                  ),
        });
      },

      remove(model: string): void {
        patchState(store, { items: store.items().filter((i) => i.model !== model) });
      },

      clear(): void {
        patchState(store, { items: [] });
      },
    };
  }),
  withHooks({
    onInit(store) {
      const storage = inject(StorageService);
      const persisted = storage.read<CartState>(STORAGE_KEY);
      // Drop lines saved by an older cart format (no model article).
      const items = Array.isArray(persisted?.items) ? persisted.items.filter((i) => i.model) : [];
      patchState(store, { items });
      // Mirror every change back to localStorage (no-op during SSR).
      effect(() => storage.write(STORAGE_KEY, { items: store.items() } satisfies CartState));
    },
  }),
);
