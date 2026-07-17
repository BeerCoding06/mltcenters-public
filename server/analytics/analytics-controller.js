import { ingestEvents, buildSummary } from './analytics-service.js';
import { getAnalyticsDbMode } from './db.js';

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export async function postEvent(req, res) {
  if (process.env.ANALYTICS_ENABLED === 'false' || process.env.ANALYTICS_ENABLED === '0') {
    return res.status(204).end();
  }

  const result = await ingestEvents({
    body: req.body,
    ip: clientIp(req),
    userAgent: req.get('user-agent') || '',
    headers: req.headers,
  });

  if (!result.ok) {
    return res.status(result.status || 400).json({ error: result.error });
  }
  return res.status(202).json({ ok: true, accepted: result.accepted });
}

export async function getSummary(req, res) {
  try {
    const summary = await buildSummary();
    return res.json({ ok: true, mode: getAnalyticsDbMode(), summary });
  } catch (err) {
    console.error('[analytics] database error (summary):', err);
    return res.status(500).json({ error: 'Database error' });
  }
}

export function getHealth(_req, res) {
  return res.json({
    ok: true,
    enabled: process.env.ANALYTICS_ENABLED !== 'false' && process.env.ANALYTICS_ENABLED !== '0',
    mode: getAnalyticsDbMode(),
  });
}
