import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'auth/login',
    data: { mode: 'login' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'auth/register',
    data: { mode: 'register' },
    loadComponent: () => import('./features/auth/auth-page').then((m) => m.AuthPage),
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
