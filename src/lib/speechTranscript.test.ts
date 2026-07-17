import { describe, it, expect } from 'vitest';
import {
  dedupeSpeechTranscript,
  filterSpeechAlternatives,
  isSendableTranscript,
  looksIncompleteUtterance,
  mergeSpeechChunks,
  shouldIgnoreTranscript,
} from '@/lib/speechTranscript';

describe('dedupeSpeechTranscript', () => {
  it('collapses repeated words from STT', () => {
    expect(dedupeSpeechTranscript('relax relax')).toBe('relax');
    expect(dedupeSpeechTranscript('go go shopping go shopping')).toBe('go shopping');
  });

  it('merges buffered chunks without stacking duplicates', () => {
    expect(mergeSpeechChunks('go shopping', 'go shopping')).toBe('go shopping');
    expect(mergeSpeechChunks('I like', 'I like cats')).toBe('I like cats');
  });
});

describe('partial speech / filler transcripts', () => {
  it.each(['and', 'or', 'because', 'the', 'a', 'an', 'to', 'if', 'but', 'um', 'uh', 'AND', 'Um'])(
    'ignores isolated filler "%s"',
    (word) => {
      expect(shouldIgnoreTranscript(word)).toBe(true);
      expect(isSendableTranscript(word)).toBe(false);
    }
  );

  it('ignores filler-only combinations', () => {
    expect(shouldIgnoreTranscript('um uh')).toBe(true);
    expect(shouldIgnoreTranscript('and or')).toBe(true);
  });

  it('allows real short answers', () => {
    expect(shouldIgnoreTranscript('Cats')).toBe(false);
    expect(isSendableTranscript('I like cats')).toBe(true);
  });
});

describe('incomplete / interrupted speech', () => {
  it('flags utterances that end with a conjunction', () => {
    expect(looksIncompleteUtterance('I like cats and')).toBe(true);
    expect(looksIncompleteUtterance('because')).toBe(true);
    expect(looksIncompleteUtterance('I went to')).toBe(true);
  });

  it('does not flag complete thoughts', () => {
    expect(looksIncompleteUtterance('I like cats because they are cute')).toBe(false);
    expect(looksIncompleteUtterance('My name is Mint.')).toBe(false);
  });
});

describe('duplicate transcripts / alternatives', () => {
  it('filters alternatives that match primary or are fillers', () => {
    expect(filterSpeechAlternatives('I like cats', ['I like cats', 'and', 'I like class'])).toEqual([
      'I like class',
    ]);
  });
});
