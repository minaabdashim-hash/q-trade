export const environment = {
  production: true,
  apiUrl: '/api',
  defaultCurrency: 'KZT',
  defaultLocale: 'ru-KZ',
} as const;

export type Environment = typeof environment;
