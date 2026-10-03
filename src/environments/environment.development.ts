// Replaces environment.ts in the development configuration (see angular.json
// fileReplacements), so it must declare the same shape rather than import it.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  defaultCurrency: 'KZT',
  defaultLocale: 'ru-KZ',
} as const;

export type Environment = typeof environment;
