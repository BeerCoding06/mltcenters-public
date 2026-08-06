/**
 * Reverse-proxy /millionaire → Next.js TOEIC game (internal port).
 * Keep the full path (incl. /millionaire) so Next basePath works.
 */
import { createProxyMiddleware } from 'http-proxy-middleware';

const MILLIONAIRE_TARGET =
  process.env.MILLIONAIRE_ORIGIN || 'http://127.0.0.1:3002';

export function createMillionaireProxy() {
  return createProxyMiddleware({
    target: MILLIONAIRE_TARGET,
    changeOrigin: true,
    ws: true,
    pathFilter: (pathname) =>
      pathname === '/millionaire' || pathname.startsWith('/millionaire/'),
    on: {
      error(err, _req, res) {
        console.error('[millionaire] proxy error:', err.message);
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(
            'TOEIC เกมส์เศรษฐี is not available yet. Please redeploy or start the millionaire app on :3002.'
          );
        }
      },
    },
  });
}
