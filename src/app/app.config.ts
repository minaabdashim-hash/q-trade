import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { apiPrefixInterceptor, authInterceptor, errorInterceptor } from './core/interceptors';
import { SESSION_KEY } from './core/services/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // The server renders anonymously (no prices); a signed-in partner must not reuse that response.
    provideClientHydration(withHttpTransferCacheOptions({ filter: () => !hasBrowserSession() })),
    provideHttpClient(
      withFetch(),
      withInterceptors([apiPrefixInterceptor, authInterceptor, errorInterceptor]),
    ),
  ],
};

function hasBrowserSession(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
}
