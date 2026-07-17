import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AnalyticsContext,
  ANALYTICS_EVENTS,
  type AnalyticsMetadata,
} from './analytics-context';
import {
  enqueueAnalyticsEvent,
  flushAnalyticsQueue,
  getSessionId,
  getVisitorId,
  track as trackFn,
} from './track';

const SCROLL_MARKS = [25, 50, 75, 100];

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pageStartedAt = useRef(Date.now());
  const maxScroll = useRef(0);
  const scrollMarksSent = useRef<Set<number>>(new Set());
  const sessionStarted = useRef(false);

  const track = useCallback((name: string, metadata?: AnalyticsMetadata) => {
    trackFn(name, metadata);
  }, []);

  const trackPageView = useCallback((path?: string) => {
    enqueueAnalyticsEvent({
      name: ANALYTICS_EVENTS.PAGE_VIEW,
      path: path || window.location.pathname + window.location.search,
    });
  }, []);

  // Session start + restore retries
  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    getVisitorId();
    getSessionId();
    enqueueAnalyticsEvent({ name: ANALYTICS_EVENTS.SESSION_START });
    void flushAnalyticsQueue();

    const onHide = () => {
      const duration = Date.now() - pageStartedAt.current;
      enqueueAnalyticsEvent({
        name: ANALYTICS_EVENTS.TIME_ON_PAGE,
        metadata: { duration_ms: duration, scroll_depth: maxScroll.current },
      });
      enqueueAnalyticsEvent({ name: ANALYTICS_EVENTS.SESSION_END });
      void flushAnalyticsQueue({ useBeacon: true });
    };

    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });
    return () => {
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  // Route / page views
  useEffect(() => {
    const path = location.pathname + location.search;
    const duration = Date.now() - pageStartedAt.current;
    if (duration > 500) {
      enqueueAnalyticsEvent({
        name: ANALYTICS_EVENTS.TIME_ON_PAGE,
        metadata: { duration_ms: duration, scroll_depth: maxScroll.current },
      });
    }
    pageStartedAt.current = Date.now();
    maxScroll.current = 0;
    scrollMarksSent.current = new Set();
    enqueueAnalyticsEvent({ name: ANALYTICS_EVENTS.ROUTE_CHANGE, path });
    enqueueAnalyticsEvent({ name: ANALYTICS_EVENTS.PAGE_VIEW, path });
  }, [location.pathname, location.search]);

  // Scroll depth
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      maxScroll.current = Math.max(maxScroll.current, pct);
      for (const mark of SCROLL_MARKS) {
        if (pct >= mark && !scrollMarksSent.current.has(mark)) {
          scrollMarksSent.current.add(mark);
          enqueueAnalyticsEvent({
            name: ANALYTICS_EVENTS.SCROLL_DEPTH,
            metadata: { depth: mark },
          });
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click + form submit delegation
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest(
        'button, a, [role="button"], input[type="submit"]'
      ) as HTMLElement | null;
      if (!el) return;
      const label =
        el.getAttribute('aria-label') ||
        el.getAttribute('data-analytics') ||
        (el.textContent || '').trim().slice(0, 80);
      const isButton =
        el.tagName === 'BUTTON' ||
        el.getAttribute('role') === 'button' ||
        (el instanceof HTMLInputElement && el.type === 'submit');
      enqueueAnalyticsEvent({
        name: isButton ? ANALYTICS_EVENTS.BUTTON_CLICK : ANALYTICS_EVENTS.CLICK,
        metadata: {
          tag: el.tagName.toLowerCase(),
          label: label || null,
          href: el instanceof HTMLAnchorElement ? el.href.slice(0, 300) : null,
        },
      });
    };

    const onSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || form.tagName !== 'FORM') return;
      enqueueAnalyticsEvent({
        name: ANALYTICS_EVENTS.FORM_SUBMIT,
        metadata: {
          form_id: form.id || null,
          form_name: form.getAttribute('name') || null,
        },
      });
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
    };
  }, []);

  const value = useMemo(
    () => ({
      track,
      trackPageView,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
    }),
    [track, trackPageView]
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
