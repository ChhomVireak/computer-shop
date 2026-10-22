import { FetchBackend, HttpBackend, HttpEvent, HttpRequest } from '@angular/common/http';
import { Injectable, REQUEST, REQUEST_CONTEXT, inject } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Server-only HTTP backend. During SSR, /api calls go straight to this same
 * Node process (http://127.0.0.1:<port>) instead of back out through the
 * public domain / nginx / Cloudflare.
 *
 * It runs after all interceptors, so the HTTP transfer cache still keys on the
 * normal URL and the browser does not re-fetch the data.
 */
@Injectable()
export class InternalApiBackend implements HttpBackend {
  private fetchBackend = inject(FetchBackend);
  private request = inject(REQUEST, { optional: true });
  private context = inject(REQUEST_CONTEXT, { optional: true }) as { apiOrigin?: string } | null;

  handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const apiOrigin = this.context?.apiOrigin;
    if (apiOrigin && this.request) {
      const url = new URL(req.url, this.request.url);
      const sameSite = url.origin === new URL(this.request.url).origin;
      if (sameSite && url.pathname.startsWith('/api/')) {
        req = req.clone({ url: apiOrigin + url.pathname + url.search });
      }
    }
    return this.fetchBackend.handle(req);
  }
}
