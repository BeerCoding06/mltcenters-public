import {
  dedupeSpeechTranscript,
  filterSpeechAlternatives,
  normalizeTranscript,
} from '@/lib/speechTranscript';

/** Clean mic transcript: collapse STT word/phrase repeats */
export function refineChildTranscript(primary: string, _alternatives: string[] = []): string {
  return dedupeSpeechTranscript(primary);
}

export function refineSpeechContext(primary: string, alternatives: string[] = []) {
  const raw = dedupeSpeechTranscript(primary);
  return {
    raw,
    alternatives: filterSpeechAlternatives(raw, alternatives.map(normalizeTranscript)),
  };
}
