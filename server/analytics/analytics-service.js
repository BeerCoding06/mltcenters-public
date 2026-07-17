import crypto from 'crypto';
import {
  insertEvent,
  insertPageView,
  upsertAssessment,
  upsertChatSession,
  upsertRunner,
  getSummary,
} from './analytics-model.js';

const EVENT_NAME_RE = /^[a-z][a-z0-9_]{1,63}$/;
const MAX_EVENTS = 50;
const MAX_META_KEYS = 20;
const MAX_META_KEY = 40;
const MAX_META_VALUE = 500;
const BLOCKED_META_KEYS = new Set([
  'email',
  'password',
  'pass',
  'token',
  'authorization',
  'ip',
  'transcript',
  'message',
  'content',
]);

export function hashIp(ip, salt = process.env.ANALYTICS_IP_SALT || process.env.ANALYTICS_ADMIN_TOKEN || 'dev-salt') {
  const value = String(ip || 'unknown');
  return crypto.createHash('sha256').update(`${salt}:${value}`).digest('hex');
}

export function parseUserAgent(ua = '') {
  const s = String(ua || '');
  let browser = 'Other';
  if (/Edg\//i.test(s)) browser = 'Edge';
  else if (/Chrome\//i.test(s) && !/Edg\//i.test(s)) browser = 'Chrome';
  else if (/Firefox\//i.test(s)) browser = 'Firefox';
  else if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) browser = 'Safari';
  else if (/MSIE|Trident/i.test(s)) browser = 'IE';

  let device_type = 'desktop';
  if (/Mobi|Android|iPhone|iPod/i.test(s)) device_type = 'mobile';
  else if (/iPad|Tablet/i.test(s)) device_type = 'tablet';

  return { browser, device_type };
}

export function resolveCountryCode(headers = {}, timezone = '') {
  const h = headers || {};
  const fromHeader =
    h['cf-ipcountry'] ||
    h['x-vercel-ip-country'] ||
    h['x-country-code'] ||
    h['x-appengine-country'];
  if (typeof fromHeader === 'string' && /^[A-Za-z]{2}$/.test(fromHeader.trim())) {
    return fromHeader.trim().toUpperCase();
  }
  if (typeof timezone === 'string' && timezone.includes('Bangkok')) return 'TH';
  if (typeof timezone === 'string' && timezone.startsWith('Asia/')) return 'XX';
  return 'XX';
}

export function sanitizeMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out = {};
  const keys = Object.keys(input).slice(0, MAX_META_KEYS);
  for (const key of keys) {
    const k = String(key).slice(0, MAX_META_KEY).toLowerCase();
    if (BLOCKED_META_KEYS.has(k)) continue;
    if (!/^[a-z0-9_]+$/.test(k)) continue;
    const value = input[key];
    if (value == null) {
      out[k] = null;
      continue;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      if (typeof value === 'number' && !Number.isFinite(value)) continue;
      out[k] = value;
      continue;
    }
    if (typeof value === 'string') {
      out[k] = value.slice(0, MAX_META_VALUE);
    }
  }
  return out;
}

export function validateEventBatch(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON body' };
  }
  if (!Array.isArray(body.events) || body.events.length === 0) {
    return { ok: false, error: 'events array required' };
  }
  if (body.events.length > MAX_EVENTS) {
    return { ok: false, error: `Max ${MAX_EVENTS} events per request` };
  }

  const events = [];
  for (const raw of body.events) {
    if (!raw || typeof raw !== 'object') continue;
    const name = String(raw.name || '').trim();
    if (!EVENT_NAME_RE.test(name)) {
      return { ok: false, error: `Invalid event name: ${name || '(empty)'}` };
    }
    const sessionId = String(raw.sessionId || raw.session_id || '').trim();
    const visitorId = String(raw.visitorId || raw.visitor_id || '').trim();
    if (!sessionId || !visitorId || sessionId.length > 80 || visitorId.length > 80) {
      return { ok: false, error: 'sessionId and visitorId required' };
    }
    const ts = Number(raw.ts) || Date.now();
    events.push({
      name,
      ts,
      path: raw.path ? String(raw.path).slice(0, 500) : undefined,
      referrer: raw.referrer ? String(raw.referrer).slice(0, 500) : undefined,
      sessionId,
      visitorId,
      metadata: sanitizeMetadata(raw.metadata),
    });
  }

  if (!events.length) return { ok: false, error: 'No valid events' };

  return {
    ok: true,
    events,
    timezone: typeof body.timezone === 'string' ? body.timezone.slice(0, 80) : '',
    language: typeof body.language === 'string' ? body.language.slice(0, 32) : '',
  };
}

async function applyDomainSideEffects(event, ctx) {
  const meta = event.metadata || {};
  const base = {
    visitor_id: event.visitorId,
    session_id: event.sessionId,
  };

  switch (event.name) {
    case 'page_view':
    case 'route_change':
      await insertPageView({
        ...base,
        path: event.path || '/',
        started_at: event.ts,
        duration_ms: 0,
        scroll_depth: 0,
        referrer: event.referrer,
        country_code: ctx.country_code,
      });
      break;
    case 'time_on_page':
      await insertPageView({
        ...base,
        path: event.path || '/',
        started_at: event.ts - Number(meta.duration_ms || 0),
        duration_ms: Number(meta.duration_ms || 0),
        scroll_depth: Number(meta.scroll_depth || 0),
        referrer: event.referrer,
        country_code: ctx.country_code,
      });
      break;
    case 'chat_started':
      await upsertChatSession({
        ...base,
        started_at: event.ts,
        last_event_at: event.ts,
        inc_messages: 0,
        status: 'active',
      });
      break;
    case 'chat_message_sent':
      await upsertChatSession({
        ...base,
        started_at: event.ts,
        last_event_at: event.ts,
        inc_messages: 1,
        status: 'active',
      });
      break;
    case 'assessment_started':
      await upsertAssessment({ ...base, status: 'started' });
      break;
    case 'assessment_completed':
      await upsertAssessment({
        ...base,
        status: 'completed',
        level: typeof meta.level === 'string' ? meta.level : null,
        score_avg: typeof meta.score_avg === 'number' ? meta.score_avg : null,
        metadata_json: JSON.stringify(meta),
      });
      break;
    case 'assessment_failed':
      await upsertAssessment({ ...base, status: 'failed', metadata_json: JSON.stringify(meta) });
      break;
    case 'runner_started':
      await upsertRunner({ ...base, status: 'started' });
      break;
    case 'runner_finished':
      await upsertRunner({
        ...base,
        status: 'finished',
        score: typeof meta.score === 'number' ? meta.score : null,
        duration_ms: typeof meta.duration_ms === 'number' ? meta.duration_ms : null,
        metadata_json: JSON.stringify(meta),
      });
      break;
    default:
      break;
  }
}

/**
 * @param {{ body: unknown, ip: string, userAgent: string, headers: Record<string, string|string[]|undefined> }} input
 */
export async function ingestEvents(input) {
  const validated = validateEventBatch(input.body);
  if (!validated.ok) {
    console.warn('[analytics] validation error:', validated.error);
    return { ok: false, status: 400, error: validated.error };
  }

  const ipHash = hashIp(input.ip);
  const { browser, device_type } = parseUserAgent(input.userAgent);
  const country_code = resolveCountryCode(input.headers, validated.timezone);
  const ctx = { country_code, ipHash, browser, device_type };

  try {
    for (const event of validated.events) {
      await insertEvent({
        name: event.name,
        ts: event.ts,
        path: event.path,
        referrer: event.referrer,
        session_id: event.sessionId,
        visitor_id: event.visitorId,
        ip_hash: ipHash,
        country_code,
        user_agent: String(input.userAgent || '').slice(0, 400),
        device_type,
        browser,
        metadata_json: JSON.stringify(event.metadata || {}),
      });
      await applyDomainSideEffects(event, ctx);
    }
    console.info(`[analytics] event received: ${validated.events.length} events`);
    return { ok: true, status: 202, accepted: validated.events.length };
  } catch (err) {
    console.error('[analytics] database error:', err);
    return { ok: false, status: 500, error: 'Database error' };
  }
}

export async function buildSummary() {
  return getSummary();
}
