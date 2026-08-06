/**
 * Reverse-proxy `/millionaire` → Next.js TOEIC game (internal :3002).
 *
 * Important: keep the full path including `/millionaire` so Next `basePath` works.
 * Do not mount as `app.use('/millionaire', proxy)` without rewriting — Express
 * would strip the prefix and Next would 404.
 */
import { createProxyMiddleware } from 'http-proxy-middleware';

const MILLIONAIRE_TARGET =
  process.env.MILLIONAIRE_ORIGIN || 'http://127.0.0.1:3002';

const UNAVAILABLE_HTML = `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TOEIC เกมส์เศรษฐี | MLTCENTERS</title>
  <style>
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
      font-family: system-ui, sans-serif; background:#0a0a0f; color:#e8e8ed; }
    .box { max-width:28rem; padding:2rem; text-align:center; }
    h1 { color:#fbbf24; font-size:1.35rem; margin:0 0 .75rem; }
    p { color:#a1a1aa; line-height:1.55; margin:0 0 1.25rem; }
    a { color:#5bc0ff; }
  </style>
</head>
<body>
  <div class="box">
    <h1>TOEIC เกมส์เศรษฐี ยังไม่พร้อม</h1>
    <p>เซิร์ฟเวอร์เกมยังไม่สตาร์ท หรือกำลังรีดีพลอยอยู่ กรุณารอสักครู่แล้วลองใหม่</p>
    <p><a href="/">← กลับหน้าแรก MLTCENTERS</a></p>
  </div>
</body>
</html>`;

function isMillionairePath(pathname = '') {
  return pathname === '/millionaire' || pathname.startsWith('/millionaire/');
}

export function createMillionaireProxy() {
  return createProxyMiddleware({
    target: MILLIONAIRE_TARGET,
    changeOrigin: true,
    ws: true,
    // Preserve full URL path for Next.js basePath=/millionaire
    pathFilter: (pathname) => isMillionairePath(pathname),
    on: {
      proxyReq(proxyReq, req) {
        // If Express already parsed JSON (mis-ordered middleware), re-send body.
        const body = req.body;
        if (
          body != null &&
          typeof body === 'object' &&
          !(body instanceof Buffer) &&
          Object.keys(body).length > 0
        ) {
          const data = JSON.stringify(body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(data));
          proxyReq.write(data);
        }
      },
      error(err, _req, res) {
        console.error('[millionaire] proxy error:', err.message);
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(UNAVAILABLE_HTML);
        }
      },
    },
  });
}

/** Final safety net if the proxy calls next() without answering. */
export function millionaireUnavailableHandler(req, res, next) {
  if (!isMillionairePath(req.path)) {
    return next();
  }
  res.status(503).type('html').send(UNAVAILABLE_HTML);
}

export { isMillionairePath, UNAVAILABLE_HTML };
