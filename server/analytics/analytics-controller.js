import crypto from 'crypto';
import { ingestEvents, buildSummary } from './analytics-service.js';
import { getAnalyticsDbMode } from './db.js';

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function timingSafeEqualString(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function getAdminCredentials() {
  const username = (process.env.ANALYTICS_ADMIN_USER || 'admin').trim();
  const password = (
    process.env.ANALYTICS_ADMIN_PASS ||
    process.env.ANALYTICS_ADMIN_TOKEN ||
    ''
  ).trim();
  const token = (process.env.ANALYTICS_ADMIN_TOKEN || password || '').trim();
  return { username, password, token };
}

export async function postLogin(req, res) {
  const { username, password } = req.body || {};
  const creds = getAdminCredentials();

  if (!creds.password || !creds.token) {
    return res.status(503).json({
      error: 'Admin login is not configured. Set ANALYTICS_ADMIN_PASS or ANALYTICS_ADMIN_TOKEN.',
    });
  }

  const userOk = timingSafeEqualString(String(username || '').trim(), creds.username);
  const passOk = timingSafeEqualString(String(password || '').trim(), creds.password);
  if (!userOk || !passOk) {
    console.warn('[analytics] admin login failed');
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  console.info('[analytics] admin login ok');
  return res.json({
    ok: true,
    token: creds.token,
    username: creds.username,
  });
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
