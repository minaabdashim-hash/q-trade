import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // B2B pages depend on the partner's token in localStorage, which the server never sees.
  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'account/orders', renderMode: RenderMode.Client },
  // The shared menu and catalog must read current data on each server request.
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
