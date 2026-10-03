import {
  ChangeDetectionStrategy,
  Component,
  RESPONSE_INIT,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PRODUCT_SORTS,
  categoryPath,
  totalPages,
  type ProductQuery,
  type ProductSort,
} from '../../core/models';
import { ProductService, apiErrorStatus } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { Icon } from '../../shared/ui/icon';
import { Spinner } from '../../shared/ui/spinner';
import { ProductCard } from './product-card';

@Component({
  selector: 'app-product-category',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, Spinner, ProductCard],
  templateUrl: './product-category.html',
})
export class ProductCategory {
  protected readonly service = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  private readonly queryParams = toSignal(this.route.queryParamMap);
  readonly slug = input<string>();
  protected readonly sorts = PRODUCT_SORTS;
  protected readonly categories = computed(() =>
    this.service.categoryList.hasValue() ? this.service.categoryList.value() : [],
  );
  protected readonly category = computed(() =>
    this.categories().find((item) => item.slug === this.slug()),
  );
  protected readonly breadcrumbs = computed(() =>
    categoryPath(this.categories(), this.category()?.id ?? ''),
  );
  protected readonly children = computed(() =>
    this.categories()
      .filter((item) => item.parentId === (this.category()?.id ?? null))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
  );
  protected readonly query = computed<ProductQuery>(() => {
    const params = this.queryParams();
    const page = Number(params?.get('page') ?? 1);
    const sort = params?.get('sort');
    return {
      category: this.slug(),
      q: params?.get('q')?.trim().slice(0, 200) || undefined,
      page: Number.isInteger(page) && page >= 1 && page <= 1000000 ? page : 1,
      size: 12,
      sort: PRODUCT_SORTS.some((item) => item.value === sort) ? (sort as ProductSort) : 'relevance',
      lang: this.service.language(),
    };
  });
  protected readonly products = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.service.list(params),
  });
  protected readonly notFound = computed(
    () =>
      apiErrorStatus(this.products.error()) === 404 ||
      (!!this.slug() && this.service.categoryList.hasValue() && !this.category()),
  );
  protected readonly pages = computed(() =>
    this.products.hasValue() ? totalPages(this.products.value()) : 1,
  );

  constructor() {
    effect(() => {
      this.seo.setPageMeta({
        title: this.notFound() ? 'Категория не найдена' : (this.category()?.name ?? 'Каталог'),
        description: this.category()?.description ?? 'Каталог оборудования MAXHUB в Казахстане.',
        path: this.slug() ? `/catalog/${this.slug()}` : '/catalog',
        noIndex: this.notFound() || !!this.products.error() || !!this.service.categoryList.error(),
      });
      if (this.response)
        this.response.status = this.notFound()
          ? 404
          : this.products.error() || this.service.categoryList.error()
            ? 503
            : 200;
    });
  }

  protected search(event: Event, q: string): void {
    event.preventDefault();
    this.updateQuery({ q: q.trim() || null, page: 1 });
  }

  protected sort(event: Event): void {
    this.updateQuery({ sort: (event.target as HTMLSelectElement).value, page: 1 });
  }

  protected changePage(page: number): void {
    this.updateQuery({ page });
  }

  protected retry(): void {
    this.service.categoryList.reload();
    this.products.reload();
  }

  private updateQuery(queryParams: Record<string, string | number | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }
}
