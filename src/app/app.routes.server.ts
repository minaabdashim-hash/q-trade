import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // The shared menu and catalog must read current data on each server request.
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
