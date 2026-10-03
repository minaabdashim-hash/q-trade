import { Pipe, type PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, locale: string, cents: boolean): Intl.NumberFormat {
  const key = `${locale}|${currency}|${cents}`;
  let found = formatters.get(key);
  if (!found) {
    found = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: 2,
    });
    formatters.set(key, found);
  }
  return found;
}

/**
 * Currency formatting for prices. Wraps Intl.NumberFormat (rather than
 * Angular's CurrencyPipe) so the currency travels with the product and the
 * formatter instances are cached across renders, including during SSR.
 */
@Pipe({ name: 'price' })
export class PriceFormatPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    currency: string = environment.defaultCurrency,
    options?: { locale?: string; hideZeroCents?: boolean },
  ): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';

    const locale = options?.locale ?? environment.defaultLocale;
    const cents = options?.hideZeroCents ? !Number.isInteger(value) : true;
    return formatter(currency, locale, cents).format(value);
  }
}
