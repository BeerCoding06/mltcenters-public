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

function stripEnvQuotes(value) {
  const s = String(value || '').trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1).trim();
  }
  return s;
}

export function getAdminCredentials() {
  const username = stripEnvQuotes(process.env.ANALYTICS_ADMIN_USER || 'admin') || 'admin';
  const pass = stripEnvQuotes(process.env.ANALYTICS_ADMIN_PASS);
  const tokenEnv = stripEnvQuotes(process.env.ANALYTICS_ADMIN_TOKEN);
  // Accept either ADMIN_PASS or ADMIN_TOKEN as the login password
  const passwordCandidates = [...new Set([pass, tokenEnv].filter(Boolean))];
  const token = tokenEnv || pass || '';
  return { username, passwordCandidates, token, configured: passwordCandidates.length > 0 && Boolean(token) };
}

export async function postLogin(req, res) {
  const { username, password } = req.body || {};
  const creds = getAdminCredentials();

  if (!creds.configured) {
    console.warn('[analytics] admin login not configured (missing ANALYTICS_ADMIN_PASS / TOKEN)');
    return res.status(503).json({
      error: 'Admin login is not configured. Set ANALYTICS_ADMIN_PASS (and optionally ANALYTICS_ADMIN_TOKEN) as runtime Environment in Dokploy.',
    });
  }

  const userOk = timingSafeEqualString(String(username || '').trim(), creds.username);
  const providedPass = String(password || '').trim();
  const passOk = creds.passwordCandidates.some((candidate) =>
    timingSafeEqualString(providedPass, candidate)
  );

  if (!userOk || !passOk) {
    console.warn(
      `[analytics] admin login failed (userOk=${userOk}, passOk=${passOk}, expectedUser=${creds.username})`
    );
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
