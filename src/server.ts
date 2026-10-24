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
 * REST API is no longer used — Angular components now run 100% on in-memory arrays.
 * app.use('/api', api);
 */

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
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    // apiOrigin: lets SSR call the API on this same process (see app/core/internal-api.backend.ts)
    .handle(req, { apiOrigin: `http://127.0.0.1:${req.socket.localPort}` })
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
