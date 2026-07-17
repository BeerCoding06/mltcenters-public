// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  buildAssessApiMessages,
  dedupeMessages,
  getPreviousAssistantReply,
  isSubstantiallySimilar,
  parseAssessResponse,
  trimConversationHistory,
} from './conversation.js';

describe('dedupeMessages', () => {
  it('removes consecutive duplicate user messages', () => {
    const input = [
      { role: 'user', content: 'Hello' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];

    expect(dedupeMessages(input)).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]);
  });

  it('keeps alternating roles even with similar text', () => {
    const input = [
      { role: 'user', content: 'Yes' },
      { role: 'assistant', content: 'Yes' },
      { role: 'user', content: 'No' },
    ];

    expect(dedupeMessages(input)).toHaveLength(3);
  });
});

describe('trimConversationHistory', () => {
  it('limits history length', () => {
    const input = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `message-${i}`,
    }));

    expect(trimConversationHistory(input, 12)).toHaveLength(12);
    expect(trimConversationHistory(input, 12)[0].content).toBe('message-8');
  });
});

describe('buildAssessApiMessages', () => {
  it('includes each user message once and excludes duplicate turns', () => {
    const { apiMessages, history } = buildAssessApiMessages({
      messages: [
        { role: 'user', content: 'My name is Mint.' },
        { role: 'user', content: 'My name is Mint.' },
        { role: 'assistant', content: 'Nice to meet you, Mint!' },
        { role: 'user', content: 'I like cats.' },
      ],
      scenario: 'free_talk',
      greetingAlreadySpoken: 'Hello, friend! I am happy to see you. What is your name?',
    });

    const userTurns = history.filter((m) => m.role === 'user');
    expect(userTurns).toEqual([
      { role: 'user', content: 'My name is Mint.' },
      { role: 'user', content: 'I like cats.' },
    ]);

    expect(apiMessages[0].role).toBe('system');
    expect(apiMessages[0].content).toContain('Never repeat words');
    expect(apiMessages[0].content).toContain('opening greeting was already shown');
  });

  it('adds speech context as a separate system note', () => {
    const { apiMessages } = buildAssessApiMessages({
      messages: [{ role: 'user', content: 'I like ba' }],
      speechContext: { raw: 'I like ba', alternatives: ['I like ball', 'I like bat'] },
    });

    const speechNote = apiMessages.find((m) => m.content.includes('Speech recognition note'));
    expect(speechNote).toBeTruthy();
    expect(speechNote?.content).toContain('I like ball');
  });
});

describe('isSubstantiallySimilar', () => {
  it('detects near-duplicate assistant replies', () => {
    const previous = 'That sounds fun! What is your favorite color?';
    const repeated = 'That sounds fun! What is your favorite color today?';
    expect(isSubstantiallySimilar(repeated, previous)).toBe(true);
  });

  it('allows genuinely different replies', () => {
    const previous = 'Nice to meet you, Mint! Do you have any pets?';
    const next = 'Cats are playful. What games do you like to play with yours?';
    expect(isSubstantiallySimilar(next, previous)).toBe(false);
  });
});

describe('getPreviousAssistantReply', () => {
  it('returns the assistant message before the latest user turn', () => {
    const messages = [
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'I am Ploy.' },
      { role: 'assistant', content: 'Nice to meet you, Ploy.' },
      { role: 'user', content: 'I like drawing.' },
    ];

    expect(getPreviousAssistantReply(messages)).toBe('Nice to meet you, Ploy.');
  });
});

describe('parseAssessResponse', () => {
  it('parses JSON wrapped in extra text', () => {
    const parsed = parseAssessResponse(
      'Here you go:\n{"reply":"Great job!","scores":{"grammar":80,"vocabulary":75,"fluency":70,"coherence":78},"level":"Intermediate"}'
    );

    expect(parsed.reply).toBe('Great job!');
    expect(parsed.level).toBe('Intermediate');
  });
});
