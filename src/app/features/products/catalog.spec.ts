import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { categoryPath, toCartItem, type Category, type Product } from '../../core/models';
import { apiPrefixInterceptor } from '../../core/interceptors/api-prefix.interceptor';
import { ProductService, apiErrorStatus } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { ProductCard } from './product-card';

const product: Product = {
  id: 'xboard-v7-mtr',
  slug: 'xboard-v7-mtr',
  title: 'XBoard V7 MTR',
  brand: 'MAXHUB',
  model: 'XBoard V7 MTR',
  tagline: null,
  summary: null,
  benefits: [],
  variants: [],
  categoryId: 'collab-xboard',
  categorySlug: 'xboard',
  price: null,
  currency: 'KZT',
  showPrice: false,
  availability: 'on_order',
  stockQuantity: null,
  deliveryTime: '3–5 недель',
  warranty: '3 года',
  badge: 'new',
  images: [],
  createdAt: '2026-10-02T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
};

afterEach(() => TestBed.resetTestingModule());

describe('catalog integration', () => {
  it('builds breadcrumbs beyond two levels and terminates on a malformed cycle', () => {
    const categories = [
      { id: 'root', parentId: null },
      { id: 'child', parentId: 'root' },
      { id: 'leaf', parentId: 'child' },
    ] as Category[];
    expect(categoryPath(categories, 'leaf').map((item) => item.id)).toEqual([
      'root',
      'child',
      'leaf',
    ]);
    expect(categoryPath(categories, 'unknown')).toEqual([]);
    categories[0].parentId = 'leaf';
    expect(categoryPath(categories, 'leaf')).toHaveLength(3);
  });

  it('renders an unknown price and empty media without inventing a purchase button', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProductCard);
    fixture.componentRef.setInput('product', product);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Цена по запросу');
    expect(element.textContent).toContain('Под заказ');
    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/products/xboard-v7-mtr');
    // The only button asks for a price (opens the quote dialog); there is nothing to buy.
    const buttons = [...element.querySelectorAll('button')].map((item) => item.textContent?.trim());
    expect(buttons).toEqual(['Запросить цену']);
  });

  it('keeps hidden/unknown prices out of the B2B cart and keys lines by model', () => {
    const model = { model: 'V6550', label: '65"' };
    expect(() => toCartItem(product, model)).toThrow();
    const priced: Product = { ...product, showPrice: true, price: 100 };
    // Unknown stock does not block a B2B order: the manager confirms availability.
    expect(toCartItem(priced, model, 5)).toMatchObject({
      price: 100,
      quantity: 5,
      model: 'V6550',
      modelLabel: '',
    });
    expect(toCartItem({ ...priced, variants: ['55"', '65"'] }, model).modelLabel).toBe('65"');
    expect(toCartItem(priced, model, 10 ** 6).quantity).toBe(10000);
    expect(() => toCartItem({ ...priced, showPrice: false }, model)).toThrow();
    expect(() => toCartItem({ ...priced, availability: 'discontinued' }, model)).toThrow();
    expect(() => toCartItem(priced, model, Number.NaN)).toThrow();
  });

  it('offers a B2B partner an order link instead of a quote request', async () => {
    localStorage.setItem(
      'qt.session',
      JSON.stringify({ token: 't', expiresAt: '2999-01-01T00:00:00Z', user: { company: 'ТОО' } }),
    );
    try {
      TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
      const fixture = TestBed.createComponent(ProductCard);
      fixture.componentRef.setInput('product', { ...product, showPrice: true, price: 250000 });
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      expect(element.textContent).toMatch(/250\s000/);
      expect(element.querySelector('button')).toBeNull();
      expect(element.textContent).toContain('Заказать');
    } finally {
      localStorage.removeItem('qt.session');
    }
  });

  it('omits fabricated offers/ratings and escapes structured data for SSR', () => {
    const seo = TestBed.inject(SeoService);
    seo.setProductStructuredData(
      { ...product, title: '</script><script>alert(1)</script>' },
      '/products/xboard-v7-mtr',
    );
    const json = document.getElementById('qt-structured-data')!.textContent!;
    expect(json).not.toContain('</script>');
    const data = JSON.parse(json);
    expect(data.offers).toBeUndefined();
    expect(data.aggregateRating).toBeUndefined();
    expect(data.name).toBe('</script><script>alert(1)</script>');
    seo.clearStructuredData();
  });

  it('uses the real API contract, keeps NULL prices and sends the selected language', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiPrefixInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const service = TestBed.inject(ProductService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    const categories = http.expectOne((req) => req.url.endsWith('/api/categories'));
    expect(categories.request.params.get('lang')).toBe('ru');
    categories.flush([]);
    service
      .list({ page: 1, size: 12, category: 'collaboration-board', lang: 'kz' })
      .subscribe((page) => {
        expect(page.items[0].price).toBeNull();
        expect(page.items[0].stockQuantity).toBeNull();
      });
    const list = http.expectOne((req) => req.url.endsWith('/api/products'));
    expect(list.request.params.keys().sort()).toEqual(['category', 'lang', 'page', 'size']);
    expect(list.request.params.get('lang')).toBe('kz');
    list.flush({ items: [product], total: 1, page: 1, size: 12 });
    service.language.set('kz');
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/categories') && req.params.get('lang') === 'kz')
      .flush([]);
    http.verify();
  });

  it('distinguishes an unavailable product from a network failure, including resource errors', () => {
    expect(
      apiErrorStatus(new Error('resource', { cause: new HttpErrorResponse({ status: 404 }) })),
    ).toBe(404);
    expect(apiErrorStatus(new HttpErrorResponse({ status: 503 }))).toBe(503);
    expect(apiErrorStatus(new Error('network'))).toBe(0);
  });
});
