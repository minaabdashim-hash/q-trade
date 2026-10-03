import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'qt.theme';

/** Drives the `data-theme` attribute consumed by the CSS custom properties. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(StorageService);

  readonly preference = signal<ThemePreference>(
    this.storage.read<ThemePreference>(STORAGE_KEY) ?? 'system',
  );
  private readonly systemPrefersDark = signal(false);

  readonly isDark = computed(() =>
    this.preference() === 'system' ? this.systemPrefersDark() : this.preference() === 'dark',
  );

  constructor() {
    const media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
    if (media) {
      this.systemPrefersDark.set(media.matches);
      media.addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));
    }

    effect(() => {
      // setAttribute, not dataset: the SSR DOM shim has no `dataset`.
      this.document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
    });

    effect(() => this.storage.write(STORAGE_KEY, this.preference()));
  }

  toggle(): void {
    this.preference.set(this.isDark() ? 'light' : 'dark');
  }
}
