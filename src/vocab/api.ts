import { getVisitorId } from '@/analytics/track';
import type { VocabDashboard, VocabGoal } from './types';

export async function vocabFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('X-Visitor-Id', getVisitorId());
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`/api/vocab${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `vocab ${res.status}`);
  }
  return res.json();
}

export function getDashboard(): Promise<VocabDashboard> {
  return vocabFetch<VocabDashboard>('/dashboard');
}

export function postProfile(goal: VocabGoal, levelId: string): Promise<VocabDashboard> {
  return vocabFetch<VocabDashboard>('/profile', {
    method: 'POST',
    body: JSON.stringify({ goal, levelId }),
  });
}
