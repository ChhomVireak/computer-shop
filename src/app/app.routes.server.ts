import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every page is rendered on the server for each request (SSR), because the
 * catalog filters, cart (cookie) and invoices change per visitor.
 * You could use RenderMode.Prerender (SSG) or RenderMode.Client (CSR) per route.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Server },
];
