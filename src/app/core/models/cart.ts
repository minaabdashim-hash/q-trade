import type { Product, ProductModel } from './product';

/** The API's limit for one order line. */
export const MAX_QUANTITY = 10000;

/** One line per model article: a series is ordered by its concrete model (55", 65", …). */
export interface CartItem {
  productId: string;
  /** Model article, unique across the catalog; the cart key. */
  model: string;
  /** Model label shown next to the title; empty for single-model products. */
  modelLabel: string;
  slug: string;
  title: string;
  image: string;
  categoryId: string;
  /** Snapshot for display only: the order is priced by the API. */
  price: number;
  currency: string;
  quantity: number;
}

export function toCartItem(
  product: Product,
  model: Pick<ProductModel, 'model' | 'label'>,
  quantity = 1,
): CartItem {
  // Never turn an unknown price into zero: such a product can only be quoted.
  if (
    !product.showPrice ||
    product.price === null ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    product.availability === 'discontinued' ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error('Этот товар доступен только по запросу.');
  }
  return {
    productId: product.id,
    model: model.model,
    modelLabel: product.variants.length ? model.label : '',
    slug: product.slug,
    title: product.title,
    image: product.images[0]?.url ?? '',
    categoryId: product.categoryId,
    price: product.price,
    currency: product.currency,
    quantity: Math.min(quantity, MAX_QUANTITY),
  };
}
