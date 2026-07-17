import { useEffect } from 'react';
import { ANALYTICS_EVENTS } from '@/analytics/analytics-context';
import { track, flushAnalyticsQueue } from '@/analytics/track';

/** Full-page redirect — runner is a separate app at /runner-app/ */
export default function RunnerRedirectPage() {
  useEffect(() => {
    track(ANALYTICS_EVENTS.RUNNER_STARTED);
    void flushAnalyticsQueue().finally(() => {
      window.location.replace('/runner-app/');
    });
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      Loading 3D Runner…
    </div>
  );
}
