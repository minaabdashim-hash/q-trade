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
const angularApp = new AngularNodeAppEngine();

// Same-origin API for the built frontend; development calls port 3000 directly.
const apiOrigin = process.env['API_ORIGIN'] || 'http://localhost:3000';
app.use('/api', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res
      .status(405)
      .json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Метод не поддерживается.' } });
    return;
  }
  try {
    const response = await fetch(new URL(req.originalUrl, apiOrigin), {
      method: req.method,
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    res.status(response.status);
    // Catalog files are named by content hash, so a found file can be cached forever.
    if (response.ok && req.path.startsWith('/files/'))
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch {
    res
      .status(503)
      .json({ error: { code: 'API_UNAVAILABLE', message: 'Каталог временно недоступен.' } });
  }
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
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
