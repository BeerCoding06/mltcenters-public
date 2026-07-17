/** Final-speech validation for the English assessment chatbot */

const FILLER_WORDS = new Set([
  'and',
  'or',
  'because',
  'the',
  'a',
  'an',
  'to',
  'if',
  'but',
  'um',
  'uh',
  'uhh',
  'umm',
  'er',
  'ah',
  'hmm',
  'mm',
  'mhm',
  'like',
  'so',
  'well',
  'you',
  'know',
]);

const TRAILING_INCOMPLETE = /(?:^|\s)(and|or|because|but|if|so|to|the|a|an|um|uh)$/i;

export function normalizeTranscript(text: string): string {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeTranscript(text: string): string[] {
  return normalizeTranscript(text)
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/** Isolated fillers / conjunctions that must never reach the LLM */
export function shouldIgnoreTranscript(text: string): boolean {
  const words = tokenizeTranscript(text);
  if (words.length === 0) return true;
  if (words.length === 1 && (FILLER_WORDS.has(words[0]) || words[0].length <= 1)) return true;
  if (words.every((w) => FILLER_WORDS.has(w))) return true;
  return false;
}

/** Has some content but sounds cut off mid-thought */
export function looksIncompleteUtterance(text: string): boolean {
  if (shouldIgnoreTranscript(text)) return true;
  const normalized = normalizeTranscript(text);
  const words = tokenizeTranscript(normalized);
  if (words.length <= 2 && TRAILING_INCOMPLETE.test(normalized)) return true;
  if (TRAILING_INCOMPLETE.test(normalized) && !/[.!?]$/.test(normalized)) return true;
  return false;
}

export function isSendableTranscript(text: string): boolean {
  return !shouldIgnoreTranscript(text) && !looksIncompleteUtterance(text);
}

export const CONTINUE_PROMPT =
  'Please continue — I only caught part of that. What did you want to say?';

export function filterSpeechAlternatives(primary: string, alternatives: string[] = []): string[] {
  const primaryNorm = normalizeTranscript(primary).toLowerCase();
  return [...new Set(alternatives.map(normalizeTranscript).filter(Boolean))]
    .filter((alt) => alt.toLowerCase() !== primaryNorm)
    .filter((alt) => !shouldIgnoreTranscript(alt));
}
