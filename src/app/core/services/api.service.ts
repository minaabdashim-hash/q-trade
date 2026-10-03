import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type QueryParams = Record<
  string,
  string | number | boolean | readonly (string | number)[] | null | undefined
>;

/**
 * Thin typed wrapper over HttpClient. Paths are relative (`/products`); the
 * API prefix interceptor prepends the environment base URL.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(path, { params: toHttpParams(params) });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(path, body ?? {});
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(path, body ?? {});
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(path, body ?? {});
  }

  delete<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.delete<T>(path, { params: toHttpParams(params) });
  }
}

/** Drops null/undefined/empty values so URLs stay clean and cache-friendly. */
export function toHttpParams(params?: QueryParams): HttpParams {
  let httpParams = new HttpParams();
  if (!params) return httpParams;

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      httpParams = httpParams.set(key, value.join(','));
    } else {
      httpParams = httpParams.set(key, String(value));
    }
  }
  return httpParams;
}
