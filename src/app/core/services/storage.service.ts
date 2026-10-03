import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * SSR-safe localStorage facade. On the server every read returns null and
 * every write is a no-op, so stores can persist state without platform checks.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  read<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  write(key: string, value: unknown): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private mode - persistence is best effort */
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(key);
  }
}
