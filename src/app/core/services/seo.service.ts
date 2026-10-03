import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import type { Product } from '../models';

export interface PageMeta {
  title: string;
  description: string;
  image?: string;
  /** Absolute or root-relative canonical path. */
  path?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
}

const SITE_NAME = 'Q-Trade';
const JSON_LD_ID = 'qt-structured-data';

/**
 * Centralises title/meta/canonical and product structured data. Runs on the
 * server during SSR, so crawlers get fully rendered tags on first response.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  setPageMeta(page: PageMeta): void {
    if (page.type !== 'product') this.clearStructuredData();
    const fullTitle = `${page.title} | ${SITE_NAME}`;
    this.title.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({
      name: 'robots',
      content: page.noIndex ? 'noindex, nofollow' : 'index, follow',
    });

    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:type', content: page.type ?? 'website' });
    this.meta.updateTag({
      name: 'twitter:card',
      content: page.image ? 'summary_large_image' : 'summary',
    });

    if (page.image) {
      this.meta.updateTag({ property: 'og:image', content: page.image });
      this.meta.updateTag({ name: 'twitter:image', content: page.image });
    } else {
      this.meta.removeTag("property='og:image'");
      this.meta.removeTag("name='twitter:image'");
    }

    if (page.path) this.setCanonical(page.path);
  }

  /** Only include an offer when a real public price exists. */
  setProductStructuredData(product: Product, url: string): void {
    this.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.summary,
      productID: product.id,
      model: product.model ?? undefined,
      brand: { '@type': 'Brand', name: product.brand },
      image: product.images.map((i) => i.url),
      offers:
        product.showPrice && product.price !== null
          ? {
              '@type': 'Offer',
              url,
              price: product.price,
              priceCurrency: product.currency,
              availability: {
                in_stock: 'https://schema.org/InStock',
                on_order: 'https://schema.org/BackOrder',
                expected: 'https://schema.org/PreOrder',
                discontinued: 'https://schema.org/Discontinued',
              }[product.availability],
            }
          : undefined,
    });
  }

  setStructuredData(data: Record<string, unknown>): void {
    const script =
      (this.document.getElementById(JSON_LD_ID) as HTMLScriptElement | null) ??
      this.createJsonLdScript();
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }

  clearStructuredData(): void {
    this.document.getElementById(JSON_LD_ID)?.remove();
  }

  private createJsonLdScript(): HTMLScriptElement {
    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    this.document.head.appendChild(script);
    return script;
  }

  private setCanonical(path: string): void {
    // No `document.baseURI` here: the SSR DOM shim throws on it. During SSR the
    // origin is unknown, so the canonical stays root-relative, which is valid.
    const origin = this.document.defaultView?.location?.origin ?? '';
    const href = path.startsWith('http')
      ? path
      : `${origin}${path.startsWith('/') ? path : `/${path}`}`;

    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = href;
    this.meta.updateTag({ property: 'og:url', content: href });
  }
}
