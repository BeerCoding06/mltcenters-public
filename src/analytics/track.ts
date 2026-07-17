import type { AnalyticsEventInput, AnalyticsMetadata } from './analytics-context';

const QUEUE_KEY = 'mlt-analytics-retry-queue';
const VISITOR_KEY = 'mlt-analytics-visitor';
const SESSION_KEY = 'mlt-analytics-session';
const FLUSH_MS = 2000;
const MAX_BATCH = 10;
const ENDPOINT = '/api/analytics/event';

type QueuedEvent = {
  name: string;
  ts: number;
  path?: string;
  referrer?: string;
  sessionId: string;
  visitorId: string;
  metadata?: AnalyticsMetadata;
};

let queue: QueuedEvent[] = [];
let flushTimer: number | null = null;
let sessionId = '';
let visitorId = '';
let enabled = true;

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getVisitorId(): string {
  if (visitorId) return visitorId;
  try {
    visitorId = localStorage.getItem(VISITOR_KEY) || '';
    if (!visitorId) {
      visitorId = uuid();
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
  } catch {
    visitorId = uuid();
  }
  return visitorId;
}

export function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem(SESSION_KEY) || '';
    if (!sessionId) {
      sessionId = uuid();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch {
    sessionId = uuid();
  }
  return sessionId;
}

export function setAnalyticsEnabled(value: boolean) {
  enabled = value;
}

function loadRetryQueue(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRetryQueue(items: QueuedEvent[]) {
  try {
    if (!items.length) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-200)));
  } catch {
    /* ignore */
  }
}

export function enqueueAnalyticsEvent(input: AnalyticsEventInput) {
  if (!enabled || typeof window === 'undefined') return;

  const event: QueuedEvent = {
    name: String(input.name),
    ts: Date.now(),
    path: input.path || window.location.pathname + window.location.search,
    referrer: input.referrer ?? (document.referrer || undefined),
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    metadata: input.metadata,
  };
  queue.push(event);

  if (queue.length >= MAX_BATCH) {
    void flushAnalyticsQueue();
    return;
  }
  if (flushTimer == null) {
    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      void flushAnalyticsQueue();
    }, FLUSH_MS);
  }
}

function buildBody(events: QueuedEvent[]) {
  return JSON.stringify({
    events,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    screen: { w: window.screen.width, h: window.screen.height },
  });
}

async function sendWithFetch(events: QueuedEvent[]) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: buildBody(events),
    keepalive: true,
  });
  if (!res.ok) throw new Error(`analytics ${res.status}`);
}

function sendWithBeacon(events: QueuedEvent[]) {
  if (!navigator.sendBeacon) return false;
  const blob = new Blob([buildBody(events)], { type: 'application/json' });
  return navigator.sendBeacon(ENDPOINT, blob);
}

export async function flushAnalyticsQueue(opts?: { useBeacon?: boolean }) {
  if (!enabled) return;
  if (flushTimer != null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }

  const pending = [...loadRetryQueue(), ...queue];
  queue = [];
  if (!pending.length) return;

  const chunks: QueuedEvent[][] = [];
  for (let i = 0; i < pending.length; i += MAX_BATCH) {
    chunks.push(pending.slice(i, i + MAX_BATCH));
  }

  const failed: QueuedEvent[] = [];
  for (const chunk of chunks) {
    try {
      if (opts?.useBeacon && sendWithBeacon(chunk)) continue;
      await sendWithFetch(chunk);
    } catch {
      failed.push(...chunk);
    }
  }
  saveRetryQueue(failed);
}

export function track(name: string, metadata?: AnalyticsMetadata, path?: string) {
  enqueueAnalyticsEvent({ name, metadata, path });
}

/** Test helper */
export function _resetAnalyticsQueueForTests() {
  queue = [];
  sessionId = '';
  visitorId = '';
  if (flushTimer != null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
}

export function _getQueueLengthForTests() {
  return queue.length;
}
