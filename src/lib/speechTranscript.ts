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

/**
 * Collapse STT stutter / duplicated phrases:
 * "relax relax" → "relax"
 * "go go shopping go shopping" → "go shopping"
 */
export function dedupeSpeechTranscript(text: string): string {
  let result = normalizeTranscript(text);
  if (!result) return '';

  // 1) Consecutive identical words
  result = result.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');

  // 2) Adjacent identical phrases (length 1..n/2), repeat until stable
  let words = result.split(/\s+/).filter(Boolean);
  let changed = true;
  while (changed && words.length > 1) {
    changed = false;
    outer: for (let len = Math.floor(words.length / 2); len >= 1; len -= 1) {
      for (let i = 0; i + 2 * len <= words.length; i += 1) {
        const a = words
          .slice(i, i + len)
          .join(' ')
          .toLowerCase();
        const b = words
          .slice(i + len, i + 2 * len)
          .join(' ')
          .toLowerCase();
        if (a === b) {
          words = [...words.slice(0, i + len), ...words.slice(i + 2 * len)];
          changed = true;
          break outer;
        }
      }
    }
  }

  return words.join(' ').trim();
}

/** Merge buffered finals without stacking the same chunk twice */
export function mergeSpeechChunks(previous: string, next: string): string {
  const a = normalizeTranscript(previous);
  const b = normalizeTranscript(next);
  if (!a) return dedupeSpeechTranscript(b);
  if (!b) return dedupeSpeechTranscript(a);

  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return a;
  if (al.endsWith(bl)) return dedupeSpeechTranscript(a);
  if (bl.startsWith(al)) return dedupeSpeechTranscript(b);

  return dedupeSpeechTranscript(`${a} ${b}`);
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
