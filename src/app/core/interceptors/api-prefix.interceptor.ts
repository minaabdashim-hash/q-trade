import { HttpInterceptorFn } from '@angular/common/http';
import { REQUEST, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

const ABSOLUTE_URL = /^(https?:)?\/\//i;

/** Prepends the environment API base URL to every relative request path. */
export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  if (ABSOLUTE_URL.test(req.url) || req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  let url = `${environment.apiUrl}${path}`;
  const request = inject(REQUEST, { optional: true });
  if (request && !ABSOLUTE_URL.test(url)) url = new URL(url, request.url).href;
  return next(req.clone({ url }));
};
