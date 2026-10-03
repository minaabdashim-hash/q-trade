import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  Category,
  Language,
  Page,
  Product,
  ProductDetail,
  ProductImage,
  ProductQuery,
} from '../models';
import { ApiService } from './api.service';

/**
 * The API returns file paths as `/api/files/<name>`. Point them at the API server: another origin
 * in development, the same origin (through the /api proxy) in production.
 */
const filesOrigin = environment.apiUrl.replace(/\/api$/, '');
const fileUrl = (url: string) => (url.startsWith('/api/') ? filesOrigin + url : url);
const withImages = (images: ProductImage[]) =>
  images.map((image) => ({ ...image, url: fileUrl(image.url) }));
const withFiles = <T extends Product>(product: T): T => ({
  ...product,
  images: withImages(product.images),
});

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);
  readonly language = signal<Language>('ru');
  readonly categoryList = rxResource({
    params: () => this.language(),
    stream: ({ params }) => this.categories(params),
  });

  list(query: ProductQuery): Observable<Page<Product>> {
    return this.api
      .get<Page<Product>>('/products', { ...query })
      .pipe(map((page) => ({ ...page, items: page.items.map(withFiles) })));
  }

  bySlug(slug: string, lang = this.language()): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { lang }).pipe(
      map((product) => ({
        ...withFiles(product),
        models: product.models.map((model) => ({
          ...model,
          media: withImages(model.media),
          documents: model.documents.map((document) => ({
            ...document,
            downloadUrl: document.downloadUrl && fileUrl(document.downloadUrl),
          })),
        })),
      })),
    );
  }

  related(slug: string, limit = 4, lang = this.language()): Observable<Product[]> {
    return this.api
      .get<Product[]>(`/products/${encodeURIComponent(slug)}/related`, { limit, lang })
      .pipe(map((products) => products.map(withFiles)));
  }

  categories(lang = this.language()): Observable<Category[]> {
    return this.api
      .get<Category[]>('/categories', { lang })
      .pipe(
        map((items) =>
          items.map((item) => ({ ...item, imageUrl: item.imageUrl && fileUrl(item.imageUrl) })),
        ),
      );
  }

  brands(): Observable<string[]> {
    return this.api.get<string[]>('/brands');
  }
}

export function apiErrorStatus(error: unknown): number {
  const cause = error instanceof Error && error.cause ? error.cause : error;
  return cause instanceof HttpErrorResponse ? cause.status : 0;
}
