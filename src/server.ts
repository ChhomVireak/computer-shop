import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();

/**
 * Trust proxy headers (X-Forwarded-For, X-Forwarded-Proto, etc.)
 * when running behind reverse proxies (Nginx, Cloudflare, AWS ALB, Caddy, PaaS)
 */
app.set('trust proxy', true);

const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: true,
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application via SSR.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable (defaults to 4000),
 * and binds to `HOST` (defaults to 0.0.0.0 to accept external traffic in production).
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT']) || 4000;
  const host = process.env['HOST'] || '0.0.0.0';

  app.listen(port, host, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express SSR server listening on http://${host}:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
