import { Router } from 'express';
import crypto from 'crypto';
import { postEvent, getSummary, getHealth, postLogin, getAdminCredentials } from './analytics-controller.js';

const hits = new Map();
const loginHits = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;
const LOGIN_RATE_MAX = 20;

function rateLimitFactory(bucket, max) {
  return (req, res, next) => {
    const xf = req.headers['x-forwarded-for'];
    const ip = typeof xf === 'string' && xf.trim() ? xf.split(',')[0].trim() : req.ip || 'unknown';
    const now = Date.now();
    const entry = bucket.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + RATE_WINDOW_MS;
    }
    entry.count += 1;
    bucket.set(ip, entry);
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    return next();
  };
}

const rateLimit = rateLimitFactory(hits, RATE_MAX);
const loginRateLimit = rateLimitFactory(loginHits, LOGIN_RATE_MAX);

function timingSafeEqualString(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function requireAdminToken(req, res, next) {
  const { token } = getAdminCredentials();
  if (!token) {
    return res.status(503).json({
      error: 'Admin auth is not configured. Set ANALYTICS_ADMIN_TOKEN or ANALYTICS_ADMIN_PASS.',
    });
  }
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const provided = match?.[1]?.trim() || '';
  if (!provided || !timingSafeEqualString(provided, token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

export function createAnalyticsRouter() {
  const router = Router();
  router.get('/health', getHealth);
  router.post('/login', loginRateLimit, postLogin);
  router.post('/event', rateLimit, postEvent);
  router.get('/summary', requireAdminToken, getSummary);
  return router;
}

export default createAnalyticsRouter;
