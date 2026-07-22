import { getVisitorId } from '@/analytics/track';
import type {
  VocabAnswerPayload,
  VocabAnswerResult,
  VocabDashboard,
  VocabGoal,
  VocabSentencesResponse,
  VocabSessionMode,
  VocabSessionStart,
  VocabWordDetail,
} from './types';

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

export function startSession(mode: VocabSessionMode): Promise<VocabSessionStart> {
  return vocabFetch<VocabSessionStart>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

export function submitSessionAnswer(
  sessionId: string,
  payload: VocabAnswerPayload,
): Promise<VocabAnswerResult> {
  return vocabFetch<VocabAnswerResult>(`/sessions/${sessionId}/answer`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function completeSession(sessionId: string): Promise<{ ok: boolean }> {
  return vocabFetch<{ ok: boolean }>(`/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function getWordDetail(wordId: string): Promise<VocabWordDetail> {
  return vocabFetch<VocabWordDetail>(`/words/${wordId}`);
}

export function getAiSentences(): Promise<VocabSentencesResponse> {
  return vocabFetch<VocabSentencesResponse>('/ai/sentences', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
