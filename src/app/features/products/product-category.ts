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
import { Spinner } from '../../shared/ui/spinner';
import { deviceShape } from './device-shape';
import { ProductCard } from './product-card';

/** Price capsule presets, KZT. Keys go into the URL. */
const PRICE_RANGES = [
  { key: 'lt500', label: 'до 500 000 ₸', max: 500_000 },
  { key: '500-2000', label: '500 000 – 2 000 000 ₸', min: 500_000, max: 2_000_000 },
  { key: 'gt2000', label: 'от 2 000 000 ₸', min: 2_000_000 },
];

@Component({
  selector: 'app-product-category',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Spinner, ProductCard],
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
  /** Subcategory row: own children, or the siblings when this is a leaf. */
  protected readonly tabs = computed(() => {
    const own = this.children();
    if (own.length) return own;
    const parentId = this.category()?.parentId;
    return parentId
      ? this.categories()
          .filter((item) => item.parentId === parentId)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      : [];
  });
  protected readonly compare = signal<ReadonlySet<string>>(new Set());
  protected readonly maxCompare = 4;
  protected readonly priceRanges = PRICE_RANGES;
  protected readonly priceKey = computed(() => this.queryParams()?.get('price') ?? '');
  protected readonly deviceShape = deviceShape;
  protected readonly query = computed<ProductQuery>(() => {
    const params = this.queryParams();
    const page = Number(params?.get('page') ?? 1);
    const sort = params?.get('sort');
    const range = PRICE_RANGES.find((item) => item.key === params?.get('price'));
    return {
      category: this.slug(),
      minPrice: range?.min,
      maxPrice: range?.max,
      q: params?.get('q')?.trim().slice(0, 200) || undefined,
      page: Number.isInteger(page) && page >= 1 && page <= 1000000 ? page : 1,
      size: 12,
      inStockOnly: params?.get('stock') === '1' || undefined,
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
  /**
   * Price and stock filters make sense only once the catalog has prices / stock. Until then they
   * would empty the list, so they are hidden (but stay visible while one is applied, to reset it).
   * ponytail: judged by the current page of results.
   */
  protected readonly priced = computed(
    () =>
      !!this.priceKey() ||
      (this.products.hasValue() && this.products.value().items.some((item) => item.showPrice)),
  );
  protected readonly stocked = computed(
    () =>
      !!this.query().inStockOnly ||
      (this.products.hasValue() &&
        this.products.value().items.some((item) => item.availability === 'in_stock')),
  );
  protected readonly sorts = computed(() =>
    PRODUCT_SORTS.filter((item) => this.priced() || !item.value.startsWith('price')),
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

  protected toggleStock(): void {
    this.updateQuery({ stock: this.query().inStockOnly ? null : '1', page: 1 });
  }

  protected setPrice(event: Event): void {
    this.updateQuery({ price: (event.target as HTMLSelectElement).value || null, page: 1 });
  }

  protected setCompared(id: string, on: boolean): void {
    const next = new Set(this.compare());
    if (on && next.size < this.maxCompare) next.add(id);
    else next.delete(id);
    this.compare.set(next);
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
