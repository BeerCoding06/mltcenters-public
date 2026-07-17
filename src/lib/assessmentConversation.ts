import type { ChatMessage } from '@/types/assessment';

export type ConversationTurn = { role: 'user' | 'assistant'; content: string };

const MAX_HISTORY = 12;

export function dedupeMessages(messages: ConversationTurn[]): ConversationTurn[] {
  const result: ConversationTurn[] = [];

  for (const message of messages) {
    const content = message.content.trim();
    if (!content) continue;

    const prev = result[result.length - 1];
    if (prev && prev.role === message.role && prev.content === content) continue;

    result.push({ role: message.role, content });
  }

  return result;
}

export function buildOutgoingMessages(
  messages: ChatMessage[],
  userText: string,
  options?: { excludeWelcome?: boolean }
): ConversationTurn[] {
  const excludeWelcome = options?.excludeWelcome ?? true;
  const prior = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => !(excludeWelcome && m.id === 'welcome'))
    .map((m) => ({ role: m.role, content: m.content }));

  return dedupeMessages([...prior, { role: 'user', content: userText.trim() }]).slice(-MAX_HISTORY);
}

export function getLatestUserMessage(messages: ConversationTurn[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') return messages[i].content;
  }
  return '';
}
