import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { CartStore } from '../core/services/cart-state';
import { ProductService } from '../core/services/product.service';
import { QuoteRequestService } from '../core/services/quote-request.service';
import { Icon } from '../shared/ui/icon';

const NAV = ['Продукты', 'Решения', 'Проекты', 'Поддержка', 'Компания', 'Партнёрам'];
// Decorative icons only: names, links and hierarchy come from the API.
const CATEGORY_ICONS: Record<string, string> = {
  collab: 'panel',
  edu: 'panel',
  signage: 'display',
  led: 'led',
  uc: 'uc',
  capture: 'capture',
  accessories: 'accessories',
  software: 'software',
};

/** Sticky light header shared by every page. */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  host: {
    class:
      'fixed inset-x-0 top-0 z-30 block border-b border-white/45 bg-white/85 text-fg shadow-[0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-2xl backdrop-saturate-150',
    '(document:keydown.escape)': 'productsOpen.set(false); accountOpen.set(false)',
    // The panel lives inside the header, so leaving the header closes it.
    '(mouseleave)': 'productsOpen.set(false)',
  },
  template: `
    <div
      class="mx-auto grid h-11 max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 lg:px-10"
    >
      <a routerLink="/" class="flex items-center gap-2 whitespace-nowrap" aria-label="Q-TS">
        <span class="text-fg text-lg font-bold tracking-tight">Q-TS</span>
      </a>

      <nav class="hidden items-center gap-11 lg:flex" aria-label="Main">
        @for (item of nav; track item) {
          @if (item === 'Продукты') {
            <button
              type="button"
              class="text-fg/80 hover:text-fg inline-flex items-center gap-1 text-xs transition-colors"
              [attr.aria-expanded]="productsOpen()"
              (mouseenter)="productsOpen.set(true)"
              (focus)="productsOpen.set(true)"
              (click)="productsOpen.set(true)"
            >
              {{ item }}
              <span
                class="transition-transform"
                [class.rotate-180]="productsOpen()"
                [style.display]="'inline-flex'"
              >
                <app-icon name="chevron-down" [size]="14" />
              </span>
            </button>
          } @else {
            <a
              routerLink="/"
              class="text-fg/80 hover:text-fg text-xs transition-colors"
              (mouseenter)="productsOpen.set(false)"
            >
              {{ item }}
            </a>
          }
        }
      </nav>

      <div class="col-start-3 flex items-center gap-6 justify-self-end">
        <a
          routerLink="/catalog"
          class="text-fg/80 hover:text-fg hidden items-center gap-2 text-xs md:flex"
        >
          Поиск
          <app-icon name="search" [size]="18" />
        </a>

        <button
          type="button"
          class="text-fg/80 hover:text-fg hidden items-center gap-2 text-xs sm:flex"
          [attr.aria-label]="
            service.language() === 'ru'
              ? 'Показать контент на казахском'
              : 'Показать контент на русском'
          "
          (click)="service.language.set(service.language() === 'ru' ? 'kz' : 'ru')"
        >
          <app-icon name="globe" [size]="18" />
          {{ service.language().toUpperCase() }}
        </button>

        @if (auth.user(); as user) {
          <a
            routerLink="/cart"
            class="text-fg/80 hover:text-fg relative inline-flex"
            [attr.aria-label]="'Корзина, товаров: ' + cart.count()"
          >
            <app-icon name="shopping-cart" [size]="18" />
            @if (cart.count()) {
              <span
                class="bg-primary absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold text-white"
                >{{ cart.count() > 99 ? '99+' : cart.count() }}</span
              >
            }
          </a>
          <div class="relative" (mouseleave)="accountOpen.set(false)">
            <button
              type="button"
              class="border-fg bg-fg inline-flex h-7 max-w-44 items-center gap-1 rounded-md border-[1.5px] px-3 text-xs font-medium whitespace-nowrap text-white"
              [attr.aria-expanded]="accountOpen()"
              (click)="accountOpen.set(!accountOpen())"
            >
              <span class="truncate">{{ user.company }}</span>
              <app-icon name="chevron-down" [size]="14" />
            </button>
            @if (accountOpen()) {
              <div class="absolute top-full right-0 w-60 pt-2">
                <div
                  class="rounded-card border border-black/5 bg-white p-2 text-xs shadow-[0_18px_40px_-16px_rgba(0,0,0,0.3)]"
                >
                  <p class="px-3 pt-2 pb-3">
                    <span class="block font-semibold">{{ user.fullName }}</span>
                    <span class="text-fg-muted block truncate">{{ user.email }}</span>
                  </p>
                  <a
                    routerLink="/catalog"
                    class="block rounded-md px-3 py-2 hover:bg-black/5"
                    (click)="accountOpen.set(false)"
                    >Каталог с ценами</a
                  >
                  <a
                    routerLink="/cart"
                    class="block rounded-md px-3 py-2 hover:bg-black/5"
                    (click)="accountOpen.set(false)"
                    >Корзина</a
                  >
                  <a
                    routerLink="/account/orders"
                    class="block rounded-md px-3 py-2 hover:bg-black/5"
                    (click)="accountOpen.set(false)"
                    >Мои заказы</a
                  >
                  <button
                    type="button"
                    class="text-fg-muted hover:text-fg flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-black/5"
                    (click)="accountOpen.set(false); auth.logout()"
                  >
                    <app-icon name="log-out" [size]="14" /> Выйти
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <a
            routerLink="/auth/login"
            class="border-fg text-fg hover:bg-fg inline-flex h-7 items-center rounded-md border-[1.5px] px-4 text-xs font-medium whitespace-nowrap transition-colors hover:text-white"
          >
            B2B Shop
          </a>
        }

        <button
          type="button"
          class="bg-primary hover:bg-primary-hover inline-flex h-7 items-center gap-1.5 rounded-md px-4 text-xs font-medium whitespace-nowrap text-white transition-colors"
          (click)="quote.show()"
        >
          Запросить КП
          <app-icon name="chevron-right" [size]="15" />
        </button>

        <button
          type="button"
          class="inline-flex size-12 items-center justify-center rounded-md lg:hidden"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Toggle navigation"
          (click)="menuOpen.set(!menuOpen())"
        >
          <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="26" />
        </button>
      </div>
    </div>

    <!-- Products mega menu: stays mounted so it can slide open smoothly. -->
    <div
      class="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
      [class]="
        productsOpen()
          ? 'grid-rows-[1fr] opacity-100'
          : 'pointer-events-none grid-rows-[0fr] opacity-0'
      "
      [attr.aria-hidden]="!productsOpen() || null"
      [attr.inert]="!productsOpen() ? '' : null"
    >
      <div class="overflow-hidden">
        <div
          class="text-fg border-t border-white/40 bg-white/45 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150"
        >
          <div class="mx-auto max-w-[1500px] px-6 pt-10 pb-2 lg:px-10">
            <!-- Apple-style rail: bare icons on the panel, no cards. -->
            @if (service.categoryList.isLoading()) {
              <p role="status" class="text-fg-muted py-6">Загрузка категорий…</p>
            } @else if (service.categoryList.error()) {
              <p role="alert" class="py-6">
                Каталог временно недоступен.
                <button
                  type="button"
                  (click)="service.categoryList.reload()"
                  class="text-primary ml-3"
                >
                  Повторить
                </button>
              </p>
            }
            <ul class="flex items-end justify-between gap-4 overflow-x-auto">
              @for (product of products(); track product.id; let i = $index) {
                <li>
                  <a
                    [routerLink]="['/catalog', product.slug]"
                    class="group flex w-[150px] flex-col items-center gap-4 pb-2"
                    (click)="openProduct(i)"
                  >
                    <span
                      class="flex h-[110px] w-[130px] items-center justify-center transition-transform duration-300 ease-out will-change-transform group-hover:-translate-y-1 group-hover:scale-110"
                      [class]="i === activeProduct() ? 'text-primary' : 'text-fg'"
                    >
                      <svg
                        viewBox="0 0 64 64"
                        class="size-[84px]"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        @switch (product.key) {
                          @case ('panel') {
                            <rect x="8" y="14" width="48" height="34" rx="3" />
                            <rect x="13" y="19" width="38" height="24" rx="2" />
                            <path d="M28 14v-3h8v3" />
                            <path d="M20 37h2M25 37h2M30 37h2M35 37h2" />
                            <path d="M18 25h12" />
                            <path d="M30 48v4H34v-4" />
                            <path d="M24 54h16" />
                          }
                          @case ('display') {
                            <rect x="10" y="12" width="44" height="28" rx="2" />
                            <path d="M24 26h2M29 26h2M34 26h2M39 26h2" />
                            <path d="M32 40v10" />
                            <path d="M32 50 20 58M32 50l12 8M32 50v8" />
                          }
                          @case ('led') {
                            <rect x="8" y="18" width="48" height="28" rx="2" />
                            <text
                              x="32"
                              y="38"
                              text-anchor="middle"
                              font-size="15"
                              font-weight="700"
                              letter-spacing="1.5"
                              stroke="none"
                              fill="currentColor"
                            >
                              LED
                            </text>
                          }
                          @case ('uc') {
                            <rect x="24" y="8" width="16" height="34" rx="4" />
                            <circle cx="32" cy="18" r="4" />
                            <path d="M30 28h4" />
                            <path d="M28 42h8v12h-8z" />
                            <path d="M22 56h20" />
                          }
                          @case ('teams') {
                            <rect x="10" y="20" width="26" height="26" rx="3" />
                            <path d="M17 28h12M23 28v12" stroke-width="2" />
                            <circle cx="44" cy="20" r="6" />
                            <circle cx="54" cy="25" r="4" />
                            <path d="M38 46v-6a8 8 0 0 1 16 0v6" />
                          }
                          @case ('capture') {
                            <rect x="10" y="16" width="44" height="28" rx="3" />
                            <circle cx="32" cy="30" r="8" />
                            <path d="M30 26l6 4-6 4z" fill="currentColor" stroke="none" />
                            <path d="M6 50h52l-4-6H10z" />
                          }
                          @case ('accessories') {
                            <path d="M40 10 22 44" stroke-width="3" />
                            <path d="M46 14 28 48" stroke-width="3" />
                            <path d="M40 10c3-3 9 0 6 4" />
                            <path d="M22 44l-4 10 10-6" />
                          }
                          @case ('software') {
                            <rect x="8" y="14" width="48" height="36" rx="8" />
                            <text
                              x="32"
                              y="30"
                              text-anchor="middle"
                              font-size="8"
                              font-weight="700"
                              letter-spacing="1"
                              stroke="none"
                              fill="currentColor"
                            >
                              QTRADE
                            </text>
                            <text
                              x="32"
                              y="45"
                              text-anchor="middle"
                              font-size="14"
                              font-weight="700"
                              stroke="none"
                              fill="currentColor"
                            >
                              OS
                            </text>
                          }
                        }
                      </svg>
                    </span>
                    <span
                      class="min-h-[2.6rem] text-center text-[0.85rem] leading-snug"
                      [class]="
                        i === activeProduct()
                          ? 'text-primary font-medium'
                          : 'text-fg group-hover:text-primary'
                      "
                    >
                      {{ product.name }}
                    </span>
                  </a>
                </li>
              }
            </ul>
            <div class="h-10"></div>
          </div>
        </div>
      </div>
    </div>

    @if (menuOpen()) {
      <nav class="border-t border-black/10 bg-white px-6 py-3 lg:hidden" aria-label="Mobile">
        @for (item of nav; track item) {
          <a
            [routerLink]="item === 'Продукты' ? '/catalog' : '/'"
            class="text-fg/80 block rounded px-2 py-3 text-xl hover:bg-black/5"
            (click)="menuOpen.set(false)"
          >
            {{ item }}
          </a>
        }
        @for (category of products(); track category.id) {
          <a
            [routerLink]="['/catalog', category.slug]"
            (click)="menuOpen.set(false)"
            class="text-fg-muted block rounded px-4 py-3 hover:bg-black/5"
            >{{ category.name }}</a
          >
        }
      </nav>
    }
  `,
})
export class Header {
  protected readonly service = inject(ProductService);
  protected readonly quote = inject(QuoteRequestService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartStore);
  protected readonly accountOpen = signal(false);
  protected readonly nav = NAV;
  protected readonly products = computed(() =>
    this.service.categoryList.hasValue()
      ? this.service.categoryList
          .value()
          .filter((item) => item.parentId === null)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
          .map((item) => ({ ...item, key: CATEGORY_ICONS[item.id] ?? 'panel' }))
      : [],
  );
  protected readonly menuOpen = signal(false);
  protected readonly productsOpen = signal(false);
  protected readonly activeProduct = signal(0);

  protected openProduct(index: number): void {
    this.activeProduct.set(index);
    this.productsOpen.set(false);
  }
}
