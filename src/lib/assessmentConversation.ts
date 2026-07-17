import type { ChatMessage } from '@/types/assessment';
import { shouldIgnoreTranscript } from '@/lib/speechTranscript';

export type ConversationTurn = { role: 'user' | 'assistant'; content: string };

const MAX_HISTORY = 10;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNearExactDuplicate(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return Boolean(na && nb && na === nb);
}

export function dedupeMessages(messages: ConversationTurn[]): ConversationTurn[] {
  const result: ConversationTurn[] = [];
  const seenAssistant: string[] = [];

  for (const message of messages) {
    const content = message.content.trim();
    if (!content) continue;
    if (message.role === 'user' && shouldIgnoreTranscript(content)) continue;

    const prev = result[result.length - 1];
    if (prev && prev.role === message.role && prev.content === content) continue;

    if (message.role === 'assistant') {
      if (seenAssistant.some((prevReply) => isNearExactDuplicate(content, prevReply))) continue;
      seenAssistant.push(content);
    }

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

export function logClientAssessDebug(label: string, payload: unknown): void {
  if (!import.meta.env.DEV) return;
  try {
    console.info(`[assess-client] ${label}:`, payload);
  } catch {
    /* ignore */
  }
}
