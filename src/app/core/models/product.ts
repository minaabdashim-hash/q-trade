export type Language = 'ru' | 'kz';
export type Availability = 'in_stock' | 'on_order' | 'expected' | 'discontinued';

export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

export interface ProductImage {
  id: string;
  type: 'main_image' | 'gallery_image' | 'interior_image' | 'video' | 'icon' | 'hero';
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string | null;
  tagline: string | null;
  summary: string | null;
  benefits: string[];
  variants: string[];
  categoryId: string;
  categorySlug: string;
  price: number | null;
  currency: 'KZT';
  showPrice: boolean;
  availability: Availability;
  stockQuantity: number | null;
  deliveryTime: string | null;
  warranty: string | null;
  badge: 'new' | 'hit' | 'discount' | null;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

/** A model of a product: one diagonal / pixel pitch with its own specs, photos and documents. */
export interface ProductModel {
  id: string;
  /** Manufacturer article, unique across the catalog; used in the `?model=` URL. */
  model: string;
  /** Short chip text: `55"`, `1,5 мм`. */
  label: string;
  specGroups: {
    name: string;
    specs: { id: string; name: string; value: string; sortOrder: number; forComparison: boolean }[];
  }[];
  media: ProductImage[];
  documents: {
    id: string;
    type: 'brochure' | 'datasheet' | 'manual' | 'certificate' | 'software' | 'drawing';
    title: string;
    language: Language | 'en';
    versionDate: string | null;
    externalUrl: string | null;
    downloadUrl: string | null;
  }[];
}

export interface ProductDetail extends Product {
  models: ProductModel[];
  blocks: {
    id: string;
    sortOrder: number;
    type:
      | 'hero'
      | 'feature'
      | 'feature_dark'
      | 'gallery'
      | 'video'
      | 'benefits_grid'
      | 'variants'
      | 'metrics';
    background: 'white' | 'light_gray' | 'black';
    eyebrow: string | null;
    title: string;
    body: string | null;
    media: ProductImage | null;
  }[];
}

export type ProductSort = 'relevance' | 'price-asc' | 'price-desc' | 'newest';

export const PRODUCT_SORTS: readonly { value: ProductSort; label: string }[] = [
  { value: 'relevance', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'newest', label: 'Сначала новые' },
];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: 'В наличии',
  on_order: 'Под заказ',
  expected: 'Ожидается',
  discontinued: 'Снят с производства',
};

export interface ProductFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: ProductSort;
  lang?: Language;
}

export interface ProductQuery extends ProductFilters {
  page: number;
  size: number;
}

/** API categories are flat; use parentId to build navigation at any depth. */
export function categoryPath(categories: Category[], categoryId: string): Category[] {
  const path: Category[] = [];
  const seen = new Set<string>();
  const byId = new Map(categories.map((item) => [item.id, item]));
  let category = byId.get(categoryId);
  while (category && !seen.has(category.id)) {
    seen.add(category.id);
    path.unshift(category);
    category = byId.get(category.parentId ?? '');
  }
  return path;
}
