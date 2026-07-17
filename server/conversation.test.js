// @vitest-environment node

import { describe, it, expect } from 'vitest';
import {
  buildAssessApiMessages,
  CONTINUE_PROMPT,
  dedupeMessages,
  getPreviousAssistantReply,
  handleIncompleteUserMessage,
  isSubstantiallySimilar,
  parseAssessResponse,
  postProcessReply,
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

  it('removes duplicate assistant responses even if not consecutive', () => {
    const input = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'That sounds fun! What is your favorite color?' },
      { role: 'user', content: 'Blue' },
      { role: 'assistant', content: 'That sounds fun! What is your favorite color?' },
    ];

    const result = dedupeMessages(input);
    expect(result.filter((m) => m.role === 'assistant')).toHaveLength(1);
  });

  it('drops filler-only user turns from memory', () => {
    const input = [
      { role: 'user', content: 'I like dogs.' },
      { role: 'assistant', content: 'Nice!' },
      { role: 'user', content: 'and' },
    ];
    expect(dedupeMessages(input).some((m) => m.content === 'and')).toBe(false);
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
  it('limits history length for long conversations', () => {
    const input = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `unique-turn-content-number-${i}`,
    }));

    const trimmed = trimConversationHistory(input, 10);
    expect(trimmed.length).toBeLessThanOrEqual(10);
    expect(trimmed[trimmed.length - 1].content).toBe('unique-turn-content-number-19');
  });

  it('preserves latest user message in long chats', () => {
    const input = [];
    for (let i = 0; i < 8; i += 1) {
      input.push({ role: 'user', content: `turn-${i}` });
      input.push({ role: 'assistant', content: `reply-${i}` });
    }
    input.push({ role: 'user', content: 'I play guitar.' });

    const trimmed = trimConversationHistory(input, 10);
    expect(trimmed[trimmed.length - 1]).toEqual({ role: 'user', content: 'I play guitar.' });
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
    expect(apiMessages[0].content).toContain('1–3');
    expect(apiMessages[0].content).toContain('opening greeting was already shown');
    expect(apiMessages[0].content).toContain('I like cats.');
  });

  it('adds speech context as a separate system note', () => {
    const { apiMessages } = buildAssessApiMessages({
      messages: [{ role: 'user', content: 'I like ba' }],
      speechContext: { raw: 'I like ba', alternatives: ['I like ball', 'I like bat', 'and'] },
    });

    const speechNote = apiMessages.find((m) => m.content.includes('Speech recognition note'));
    expect(speechNote).toBeTruthy();
    expect(speechNote?.content).toContain('I like ball');
    expect(speechNote?.content).not.toContain('"and"');
  });

  it('does not repeat the same assistant prompt context twice', () => {
    const { apiMessages } = buildAssessApiMessages({
      messages: [
        { role: 'assistant', content: 'Hello there!' },
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello there!' },
        { role: 'user', content: 'I like music.' },
      ],
    });
    const assistantTurns = apiMessages.filter((m) => m.role === 'assistant');
    expect(assistantTurns).toHaveLength(1);
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

describe('postProcessReply', () => {
  it('collapses repeated words and caps length', () => {
    const reply = postProcessReply('I I I like that. I I like that. More text here. Extra sentence four.');
    expect(reply.toLowerCase()).not.toContain('i i i');
    expect(reply.split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(3);
  });

  it('avoids returning a duplicate of the previous assistant reply', () => {
    const previous = 'That sounds fun! What is your favorite color?';
    expect(postProcessReply(previous, previous)).toBe(CONTINUE_PROMPT);
  });
});

describe('handleIncompleteUserMessage', () => {
  it('silently ignores isolated fillers', () => {
    const result = handleIncompleteUserMessage('and');
    expect(result.handled).toBe(true);
    expect(result.ignore).toBe(true);
    expect(result.reply).toBe('');
  });

  it('asks to continue on interrupted speech', () => {
    const result = handleIncompleteUserMessage('I like and');
    expect(result.handled).toBe(true);
    expect(result.ignore).toBe(false);
    expect(result.reply).toBe(CONTINUE_PROMPT);
  });

  it('passes complete messages through', () => {
    expect(handleIncompleteUserMessage('I like playing football.').handled).toBe(false);
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

describe('repeated prompts / context', () => {
  it('keeps focus instruction on the latest user message', () => {
    const { apiMessages, latestUser } = buildAssessApiMessages({
      messages: [
        { role: 'user', content: 'Old topic about school.' },
        { role: 'assistant', content: 'Tell me more about school.' },
        { role: 'user', content: 'I want to talk about pizza.' },
      ],
    });

    expect(latestUser).toBe('I want to talk about pizza.');
    expect(apiMessages[0].content).toContain('I want to talk about pizza.');
    expect(apiMessages[0].content).toContain('Never change the topic unexpectedly');
  });
});
