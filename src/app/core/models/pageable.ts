/** Query shape every paginated list endpoint accepts. */
export interface PageQuery {
  page: number;
  size: number;
  sort?: string;
}

/** Envelope every paginated list endpoint returns. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export const DEFAULT_PAGE_SIZE = 12;

export function emptyPage<T>(size = DEFAULT_PAGE_SIZE): Page<T> {
  return { items: [], total: 0, page: 1, size };
}

export function totalPages(page: Page<unknown>): number {
  return Math.max(1, Math.ceil(page.total / page.size));
}
