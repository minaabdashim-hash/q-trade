import {
  ChangeDetectionStrategy,
  Component,
  RESPONSE_INIT,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AVAILABILITY_LABELS, categoryPath } from '../../core/models';
import { ProductService, apiErrorStatus } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { PriceFormatPipe } from '../../shared/pipes/price-format.pipe';
import { Icon } from '../../shared/ui/icon';
import { Spinner } from '../../shared/ui/spinner';
import { ProductCard, ProductVisual } from './product-card';

@Component({
  selector: 'app-product-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Spinner, ProductCard, ProductVisual, PriceFormatPipe],
  templateUrl: './product-detail.html',
})
export class ProductDetailPage {
  private readonly service = inject(ProductService);
  private readonly seo = inject(SeoService);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  readonly slug = input.required<string>();
  protected readonly availability = AVAILABILITY_LABELS;
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
}
