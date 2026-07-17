import { describe, it, expect } from 'vitest';
import { buildOutgoingMessages, dedupeMessages } from '@/lib/assessmentConversation';
import type { ChatMessage } from '@/types/assessment';

describe('assessmentConversation client builder', () => {
  it('excludes welcome message from API history', () => {
    const messages: ChatMessage[] = [
      { id: 'welcome', role: 'assistant', content: 'Hello! What is your name?' },
      { id: 'u1', role: 'user', content: 'I am Job.' },
      { id: 'a1', role: 'assistant', content: 'Nice to meet you, Job.' },
    ];

    const outgoing = buildOutgoingMessages(messages, 'I like football.');
    expect(outgoing.some((m) => m.content.includes('What is your name'))).toBe(false);
    expect(outgoing[outgoing.length - 1]).toEqual({
      role: 'user',
      content: 'I like football.',
    });
  });

  it('does not duplicate the same user message twice in a row', () => {
    const messages: ChatMessage[] = [
      { id: 'welcome', role: 'assistant', content: 'Hello!' },
    ];

    const once = buildOutgoingMessages(messages, 'Hello again');
    const twice = dedupeMessages([...once, { role: 'user', content: 'Hello again' }]);
    expect(twice.filter((m) => m.role === 'user' && m.content === 'Hello again')).toHaveLength(1);
  });

  it('preserves multi-turn context for stable conversations', () => {
    const messages: ChatMessage[] = [
      { id: 'welcome', role: 'assistant', content: 'Hello!' },
      { id: 'u1', role: 'user', content: 'My name is Mint.' },
      { id: 'a1', role: 'assistant', content: 'Hi Mint!' },
      { id: 'u2', role: 'user', content: 'I like music.' },
      { id: 'a2', role: 'assistant', content: 'Music is wonderful.' },
    ];

    const outgoing = buildOutgoingMessages(messages, 'I play guitar.');
    expect(outgoing.map((m) => m.content)).toEqual([
      'My name is Mint.',
      'Hi Mint!',
      'I like music.',
      'Music is wonderful.',
      'I play guitar.',
    ]);
  });

  it('drops filler user messages and duplicate assistant replies from outgoing history', () => {
    const messages: ChatMessage[] = [
      { id: 'welcome', role: 'assistant', content: 'Hello!' },
      { id: 'u1', role: 'user', content: 'I like dogs.' },
      { id: 'a1', role: 'assistant', content: 'Dogs are great. Do you have one?' },
      { id: 'u2', role: 'user', content: 'and' },
      {
        id: 'a2',
        role: 'assistant',
        content: 'Dogs are great. Do you have one?',
      },
    ];

    const outgoing = buildOutgoingMessages(messages, 'I have a puppy.');
    expect(outgoing.some((m) => m.content === 'and')).toBe(false);
    expect(outgoing.filter((m) => m.role === 'assistant')).toHaveLength(1);
    expect(outgoing[outgoing.length - 1].content).toBe('I have a puppy.');
  });
});
