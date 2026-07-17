import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _getQueueLengthForTests,
  _resetAnalyticsQueueForTests,
  enqueueAnalyticsEvent,
  flushAnalyticsQueue,
  setAnalyticsEnabled,
} from './track';

describe('analytics track queue', () => {
  beforeEach(() => {
    _resetAnalyticsQueueForTests();
    setAnalyticsEnabled(true);
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('queues events and flushes via fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    enqueueAnalyticsEvent({ name: 'page_view', path: '/' });
    expect(_getQueueLengthForTests()).toBe(1);

    await flushAnalyticsQueue();
    expect(fetchMock).toHaveBeenCalled();
    expect(_getQueueLengthForTests()).toBe(0);
  });

  it('retries failed events via localStorage', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    enqueueAnalyticsEvent({ name: 'button_click', metadata: { label: 'Go' } });
    await flushAnalyticsQueue();
    expect(localStorage.getItem('mlt-analytics-retry-queue')).toBeTruthy();

    await flushAnalyticsQueue();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
