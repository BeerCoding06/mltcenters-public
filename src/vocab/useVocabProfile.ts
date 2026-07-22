import { useCallback, useState } from 'react';
import { getDashboard, postProfile } from './api';
import type { VocabDashboard, VocabGoal } from './types';

export const VOCAB_ONBOARDING_KEY = 'mlt-vocab-onboarded';

export function isVocabOnboarded(): boolean {
  try {
    return localStorage.getItem(VOCAB_ONBOARDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markVocabOnboarded(): void {
  try {
    localStorage.setItem(VOCAB_ONBOARDING_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function needsOnboarding(dashboard: VocabDashboard | null, error: string | null): boolean {
  if (error) return true;
  if (!isVocabOnboarded()) return true;
  if (!dashboard?.goal) return true;
  return false;
}

export function useVocabProfile() {
  const [dashboard, setDashboard] = useState<VocabDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboard();
      setDashboard(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
      setDashboard(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (goal: VocabGoal, levelId = 'starter') => {
    setLoading(true);
    setError(null);
    try {
      const data = await postProfile(goal, levelId);
      markVocabOnboarded();
      setDashboard(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboard,
    loading,
    error,
    fetchDashboard,
    saveProfile,
    needsOnboarding: needsOnboarding(dashboard, error),
  };
}
