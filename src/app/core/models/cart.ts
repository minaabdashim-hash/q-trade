import type { Product } from './product';

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
  /** Stock snapshot, used to cap quantity client-side. */
  stock: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
}

export function toCartItem(product: Product, quantity = 1): CartItem {
  // Checkout is not connected yet: never turn unknown prices/stock into zero.
  if (
    !product.showPrice ||
    product.price === null ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    product.availability !== 'in_stock' ||
    product.stockQuantity === null ||
    !Number.isInteger(product.stockQuantity) ||
    product.stockQuantity < 1 ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new Error('Этот товар доступен только по запросу.');
  }
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    image: product.images[0]?.url ?? '',
    price: product.price,
    currency: product.currency,
    quantity: Math.min(quantity, product.stockQuantity),
    stock: product.stockQuantity,
  };
}
