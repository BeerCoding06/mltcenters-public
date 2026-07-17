// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  isSendableTranscript,
  looksIncompleteUtterance,
  shouldIgnoreTranscript,
} from './speechTranscript.js';

describe('server speechTranscript', () => {
  it('never sends isolated conjunctions to the LLM path', () => {
    for (const word of ['and', 'because', 'the', 'um', 'uh']) {
      expect(shouldIgnoreTranscript(word)).toBe(true);
      expect(isSendableTranscript(word)).toBe(false);
    }
  });

  it('detects interrupted speech endings', () => {
    expect(looksIncompleteUtterance('I want pizza and')).toBe(true);
  });
});
