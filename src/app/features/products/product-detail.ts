import {
  ChangeDetectionStrategy,
  Component,
  RESPONSE_INIT,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AVAILABILITY_LABELS, MAX_QUANTITY, categoryPath } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartStore } from '../../core/services/cart-state';
import { ProductService, apiErrorStatus } from '../../core/services/product.service';
import { QuoteRequestService } from '../../core/services/quote-request.service';
import { SeoService } from '../../core/services/seo.service';
import { PriceFormatPipe } from '../../shared/pipes/price-format.pipe';
import { Icon } from '../../shared/ui/icon';
import { Spinner } from '../../shared/ui/spinner';
import { deviceShape } from './device-shape';
import { ProductVisual } from './product-card';

@Component({
  selector: 'app-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Spinner, ProductVisual, PriceFormatPipe, Icon],
  templateUrl: './product-detail.html',
})
export class ProductDetailPage {
  private readonly service = inject(ProductService);
  private readonly seo = inject(SeoService);
  protected readonly quote = inject(QuoteRequestService);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartStore);
  protected readonly maxQuantity = MAX_QUANTITY;
  protected readonly quantity = signal(1);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  readonly slug = input.required<string>();
  /** Article of the chosen model, from `?model=`; the first model when absent or unknown. */
  readonly model = input<string>();
  protected readonly availability = AVAILABILITY_LABELS;
  protected readonly deviceShape = deviceShape;
  protected readonly previewGroups = 4;
  protected readonly allSpecs = signal(false);
  protected readonly product = rxResource({
    params: () => ({ slug: this.slug(), lang: this.service.language() }),
    stream: ({ params }) => this.service.bySlug(params.slug, params.lang),
  });
  protected readonly related = rxResource({
    params: () =>
      this.product.hasValue()
        ? { slug: this.product.value().slug, lang: this.service.language() }
        : undefined,
    stream: ({ params }) => this.service.related(params.slug, 4, params.lang),
  });
  protected readonly current = computed(() => {
    const models = this.product.hasValue() ? this.product.value().models : [];
    return models.find((item) => item.model === this.model()) ?? models[0] ?? null;
  });
  protected readonly inCart = computed(
    () => this.cart.items().find((i) => i.model === this.current()?.model)?.quantity ?? 0,
  );
  protected readonly specGroups = computed(() => this.current()?.specGroups ?? []);
  protected readonly documents = computed(() => this.current()?.documents ?? []);
  protected readonly photos = computed(() =>
    (this.current()?.media ?? []).filter((item) => item.type !== 'video'),
  );
  /** Photo chosen in the gallery by URL, so the choice survives switching to a model with the same photos. */
  protected readonly picked = signal<string | null>(null);
  protected readonly shown = computed(
    () => this.photos().find((item) => item.url === this.picked()) ?? this.photos()[0] ?? null,
  );
  protected readonly visualImages = computed(() => {
    const shown = this.shown();
    return shown ? [shown] : this.product.hasValue() ? this.product.value().images : [];
  });
  protected readonly notFound = computed(() => apiErrorStatus(this.product.error()) === 404);
  protected readonly breadcrumbs = computed(() =>
    categoryPath(
      this.service.categoryList.hasValue() ? this.service.categoryList.value() : [],
      this.product.hasValue() ? this.product.value().categoryId : '',
    ),
  );

  constructor() {
    effect(() => {
      if (this.product.hasValue()) {
        const product = this.product.value();
        this.seo.setPageMeta({
          title: product.title,
          description: product.summary ?? product.tagline ?? product.title,
          image: product.images[0]?.url,
          path: `/products/${product.slug}`,
          type: 'product',
        });
        this.seo.setProductStructuredData(product, `/products/${product.slug}`);
      } else {
        this.seo.clearStructuredData();
        this.seo.setPageMeta({
          title: this.notFound() ? 'Товар не найден' : 'Товар',
          description: 'Оборудование MAXHUB в Казахстане.',
          path: `/products/${this.slug()}`,
          noIndex: !!this.product.error(),
        });
      }
      if (this.response)
        this.response.status = this.notFound() ? 404 : this.product.error() ? 503 : 200;
    });
  }

  protected setQuantity(value: string): void {
    const quantity = Number(value);
    if (Number.isInteger(quantity) && quantity >= 1) {
      this.quantity.set(Math.min(quantity, MAX_QUANTITY));
    }
  }

  protected visibleGroups<T>(groups: T[]): T[] {
    return this.allSpecs() ? groups : groups.slice(0, this.previewGroups);
  }

  protected specCount(groups: { specs: unknown[] }[]): number {
    return groups.reduce((sum, group) => sum + group.specs.length, 0);
  }
}
