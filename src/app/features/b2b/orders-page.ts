import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ORDER_STATUS_LABELS, type Order } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { PriceFormatPipe } from '../../shared/pipes/price-format.pipe';
import { Spinner } from '../../shared/ui/spinner';

const DATE = new Intl.DateTimeFormat('ru-KZ', { dateStyle: 'long', timeStyle: 'short' });

@Component({
  selector: 'app-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PriceFormatPipe, Spinner],
  template: `
    <section class="text-fg min-h-screen bg-white px-6 pt-20 pb-16 lg:px-12">
      <div class="mx-auto max-w-[1100px]">
        <p class="text-fg-muted text-xs font-semibold tracking-wide uppercase">
          B2B Shop · {{ auth.user()?.company }}
        </p>
        <h1 class="mt-1 text-4xl font-bold tracking-[-0.02em] md:text-5xl">Мои заказы</h1>

        @if (orders.isLoading()) {
          <div class="text-fg-muted flex items-center gap-3 py-20" aria-live="polite">
            <app-spinner label="Загрузка заказов" /> Загрузка заказов…
          </div>
        } @else if (orders.error()) {
          <p role="alert" class="py-16">
            Не удалось загрузить заказы.
            <button type="button" class="text-primary ml-3" (click)="orders.reload()">
              Повторить
            </button>
          </p>
        } @else if (orders.value()?.length) {
          <ul class="mt-10 space-y-4">
            @for (order of orders.value(); track order.id) {
              <li class="rounded-card bg-surface-alt p-6">
                <div class="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 class="text-lg font-semibold">
                    Заказ № {{ order.id }}
                    <span class="text-fg-muted ml-2 text-sm font-normal">{{
                      date(order.createdAt)
                    }}</span>
                  </h2>
                  <span
                    class="rounded-md bg-white px-2.5 py-1 text-xs font-semibold"
                    [class]="order.status === 'cancelled' ? 'text-fg-muted' : 'text-primary'"
                  >
                    {{ statuses[order.status] }}
                  </span>
                </div>
                <ul class="text-fg-muted mt-4 space-y-1 text-sm">
                  @for (item of order.items; track item.model) {
                    <li class="flex justify-between gap-4">
                      <span>{{ item.title }} · {{ item.model }} × {{ item.quantity }}</span>
                      <span class="text-fg shrink-0">{{
                        item.price * item.quantity | price: order.currency : { hideZeroCents: true }
                      }}</span>
                    </li>
                  }
                </ul>
                @if (order.comment) {
                  <p class="text-fg-muted mt-3 text-xs">Комментарий: {{ order.comment }}</p>
                }
                <p class="border-line mt-4 flex justify-between border-t pt-3 font-semibold">
                  <span>Итого</span>
                  <span>{{ order.total | price: order.currency : { hideZeroCents: true } }}</span>
                </p>
              </li>
            }
          </ul>
        } @else {
          <div class="rounded-card bg-surface-alt mt-10 p-8 text-center sm:p-12">
            <h2 class="text-2xl font-semibold">Заказов пока нет</h2>
            <a
              routerLink="/catalog"
              class="bg-primary hover:bg-primary-hover mt-6 inline-flex h-10 items-center rounded-md px-6 text-sm font-semibold text-white transition-colors"
              >Перейти в каталог</a
            >
          </div>
        }
      </div>
    </section>
  `,
})
export class OrdersPage {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  protected readonly statuses = ORDER_STATUS_LABELS;
  protected readonly orders = rxResource({ stream: () => this.api.get<Order[]>('/orders') });

  constructor() {
    inject(SeoService).setPageMeta({
      title: 'Мои заказы',
      description: 'Заказы B2B-партнёра.',
      path: '/account/orders',
      noIndex: true,
    });
  }

  protected date(iso: string): string {
    return DATE.format(new Date(iso));
  }
}
