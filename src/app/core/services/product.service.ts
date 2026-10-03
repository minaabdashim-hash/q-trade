import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import type { Category, Language, Page, Product, ProductDetail, ProductQuery } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);
  readonly language = signal<Language>('ru');
  readonly categoryList = rxResource({
    params: () => this.language(),
    stream: ({ params }) => this.categories(params),
  });

  list(query: ProductQuery): Observable<Page<Product>> {
    return this.api.get<Page<Product>>('/products', { ...query });
  }

  bySlug(slug: string, lang = this.language()): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { lang });
  }

  related(slug: string, limit = 4, lang = this.language()): Observable<Product[]> {
    return this.api.get<Product[]>(`/products/${encodeURIComponent(slug)}/related`, {
      limit,
      lang,
    });
  }

  categories(lang = this.language()): Observable<Category[]> {
    return this.api.get<Category[]>('/categories', { lang });
  }

  brands(): Observable<string[]> {
    return this.api.get<string[]>('/brands');
  }
}

export function apiErrorStatus(error: unknown): number {
  const cause = error instanceof Error && error.cause ? error.cause : error;
  return cause instanceof HttpErrorResponse ? cause.status : 0;
}
