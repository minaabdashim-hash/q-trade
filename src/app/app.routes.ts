import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./features/products/product-category').then((m) => m.ProductCategory),
  },
  {
    path: 'catalog/:slug',
    loadComponent: () =>
      import('./features/products/product-category').then((m) => m.ProductCategory),
  },
  {
    path: 'products/:slug',
    loadComponent: () =>
      import('./features/products/product-detail').then((m) => m.ProductDetailPage),
  },
];
