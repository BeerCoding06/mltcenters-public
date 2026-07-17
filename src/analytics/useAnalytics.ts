import { useContext } from 'react';
import { AnalyticsContext, type AnalyticsContextValue } from './analytics-context';
import { track as trackDirect } from './track';

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (ctx) return ctx;

  // Safe fallback when used outside provider
  return {
    track: (name, metadata) => trackDirect(name, metadata),
    trackPageView: (path) => trackDirect('page_view', undefined, path),
    sessionId: '',
    visitorId: '',
  };
}
