import { filterSpeechAlternatives, normalizeTranscript } from '@/lib/speechTranscript';

/** Keep the mic transcript as-is; only clean whitespace / drop useless alts */
export function refineChildTranscript(primary: string, alternatives: string[] = []): string {
  return normalizeTranscript(primary);
}

export function refineSpeechContext(primary: string, alternatives: string[] = []) {
  const raw = normalizeTranscript(primary);
  return {
    raw,
    alternatives: filterSpeechAlternatives(raw, alternatives),
  };
}
