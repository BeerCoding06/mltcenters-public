/** Conversation history + prompt builder for /api/assess */
import {
  CONTINUE_PROMPT,
  dedupeSpeechTranscript,
  filterSpeechAlternatives,
  looksIncompleteUtterance,
  shouldIgnoreTranscript,
} from './speechTranscript.js';

export {
  CONTINUE_PROMPT,
  dedupeSpeechTranscript,
  looksIncompleteUtterance,
  shouldIgnoreTranscript,
};

export const ANTI_REPETITION_RULES = `Conversation quality rules (strict):
- Focus primarily on the user's latest message. Prioritize it over older turns.
- Preserve only relevant context. Do not restate earlier answers.
- Never repeat words, phrases, sentences, or your previous responses.
- Never guess the user's intent or invent missing information.
- If the user's message is incomplete or cut off, politely ask them to continue. Do not answer as if you understood a full thought.
- Never respond meaningfully to isolated conjunctions or filler words (and, because, the, um, uh, etc.).
- Keep "reply" to 1–3 short sentences. Ask at most ONE follow-up question.
- Correct English naturally inside the reply, then continue the conversation — prioritize conversation over explanation.
- Sound like a friendly native English conversation partner, not a textbook or chatbot script.
- Stay on the current topic. Never change the topic unexpectedly.
- Never hallucinate facts about the user.
- Avoid generic filler such as "Great question!", "Absolutely!", "Certainly!", or "That's interesting!" unless it fits naturally once.
- If intent is unclear, ask one short clarifying question instead of assuming.
- If your reply would be similar to your previous reply, rewrite it completely before sending.`;

export const SYSTEM_PROMPT = `You are a professional English conversation tutor.

Your goal is to create a natural, engaging, human-like conversation with Thai learners practicing spoken English.

Rules for the "reply" field (read aloud by text-to-speech):
- English only in "reply" — never Thai.
- Keep replies concise: 1–3 sentences for normal turns.
- Ask at most one follow-up question.
- Speak like a kind, warm native speaker — natural rhythm, varied vocabulary.
- Do not produce long paragraphs unless the user explicitly asks for an explanation.
- Do not produce unnecessary lectures or lists.

Speech and incomplete input:
- The user message is the learner's exact spoken or typed words.
- You may receive alternative speech-recognition guesses in a separate note. Use those ONLY to interpret unclear audio — never replace what they said.
- Never answer incomplete user messages. Ask them to continue politely.
- Never guess missing information.

${ANTI_REPETITION_RULES}

After each user message, respond with ONLY valid JSON (no markdown):
{"reply": "...", "scores": {"grammar": 0-100, "vocabulary": 0-100, "fluency": 0-100, "coherence": 0-100}, "level": "Beginner"|"Intermediate"|"Advanced"}

Scores: be generous but fair; adjust up slightly for full sentences and good effort.
Include scores on every turn after the user's first complete message. On greeting-only or continue-prompt turns, scores may be null.`;

export const SCENARIO_PROMPTS = {
  free_talk:
    'Situation: free talk. Chat naturally about hobbies, favorites, and daily life. Stay a warm conversation partner. Do not jump topics.',
  school:
    'Situation: at school. Role-play a kind teacher. Talk about class, friends, subjects, recess, and lunch. Stay on school topics unless the user leads elsewhere.',
  restaurant:
    'Situation: at a restaurant. Role-play ordering food and drinks. Stay on restaurant topics.',
  park:
    'Situation: at the park. Role-play outdoor fun — swings, running, birds, sunshine. Stay playful and on topic.',
  shopping:
    'Situation: at a shop. Role-play buying things. Stay on shopping topics.',
  home:
    'Situation: at home. Role-play family time — meals, pets, toys, bedtime. Stay on home topics.',
  making_friends:
    'Situation: meeting a new friend. Practice greetings and getting-to-know-you questions. Stay on that topic.',
  doctor:
    'Situation: at the doctor. Role-play gently. Stay calm and reassuring — never scary.',
  hotel_booking:
    'Situation: hotel front desk. Role-play booking a room with simple polite English.',
  getting_lost:
    'Situation: the student is lost. Role-play a kind helper with simple direction words. Stay calm.',
  asking_directions:
    'Situation: a visitor asks the student for directions. You are the visitor. Let the student practice giving directions.',
};

const VALID_ROLES = new Set(['user', 'assistant', 'system']);
const MAX_HISTORY_DEFAULT = 10;

function normalizeExact(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Exact normalized duplicate for history cleanup (avoid fuzzy false positives) */
export function isNearExactDuplicate(a, b) {
  const na = normalizeExact(a);
  const nb = normalizeExact(b);
  return Boolean(na && nb && na === nb);
}

/** @param {unknown} messages */
export function dedupeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  const result = [];
  const seenAssistant = [];

  for (const raw of messages) {
    if (!raw || typeof raw !== 'object') continue;
    const role = raw.role;
    const content = typeof raw.content === 'string' ? raw.content.trim() : '';
    if (!VALID_ROLES.has(role) || !content) continue;

    const prev = result[result.length - 1];
    if (prev && prev.role === role && prev.content === content) continue;

    if (role === 'assistant') {
      const duplicateEarlier = seenAssistant.some((prevReply) =>
        isNearExactDuplicate(content, prevReply)
      );
      if (duplicateEarlier) continue;
      seenAssistant.push(content);
    }

    if (role === 'user') {
      content = dedupeSpeechTranscript(content);
      if (!content || shouldIgnoreTranscript(content)) continue;
    }

    result.push({ role, content });
  }
  return result;
}

/** @param {Array<{ role: string, content: string }>} messages @param {number} maxMessages */
export function trimConversationHistory(messages, maxMessages = MAX_HISTORY_DEFAULT) {
  const cleaned = dedupeMessages(messages);
  if (cleaned.length <= maxMessages) return cleaned;

  // Keep the latest turns; prefer ending on a user message when possible.
  let trimmed = cleaned.slice(-maxMessages);
  if (trimmed[0]?.role === 'assistant' && trimmed.length > 2) {
    trimmed = trimmed.slice(1);
  }
  return trimmed;
}

/** @param {Array<{ role: string, content: string }>} messages */
export function getPreviousAssistantReply(messages) {
  // Walk backward past the latest user turn to the prior assistant reply
  let seenLatestUser = false;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const role = messages[i]?.role;
    if (!seenLatestUser) {
      if (role === 'user') seenLatestUser = true;
      continue;
    }
    if (role === 'assistant') return messages[i].content;
  }
  return '';
}

/** @param {Array<{ role: string, content: string }>} messages */
export function getLatestUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') return messages[i].content;
  }
  return '';
}

/** @param {string} a @param {string} b */
export function isSubstantiallySimilar(a, b) {
  if (!a || !b) return false;

  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const wordsA = na.split(' ').filter(Boolean);
  const wordsB = nb.split(' ').filter(Boolean);
  if (wordsA.length === 0 || wordsB.length === 0) return false;

  const setA = new Set(wordsA);
  const overlap = wordsB.filter((word) => setA.has(word)).length;
  const overlapRatio = overlap / Math.max(wordsB.length, wordsA.length, 1);
  if (overlapRatio >= 0.72) return true;

  const lenRatio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length, 1);
  if (lenRatio > 0.7 && na.includes(nb.slice(0, Math.min(40, nb.length)))) return true;

  // Shared opening phrase (first 6 words)
  const headA = wordsA.slice(0, 6).join(' ');
  const headB = wordsB.slice(0, 6).join(' ');
  if (headA && headA === headB && wordsA.length > 3) return true;

  return false;
}

/** Collapse accidental word/phrase stuttering and cap sentence count */
export function postProcessReply(reply, previousAssistant = '') {
  let text = String(reply || '').trim();
  if (!text) return 'Could you say that again in a full sentence?';

  // Collapse consecutive repeated words: "I I like" → "I like"
  text = text.replace(/\b(\w+)(?:\s+\1\b)+/gi, '$1');

  // Collapse immediate repeated sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const uniqueSentences = [];
  for (const sentence of sentences) {
    const prev = uniqueSentences[uniqueSentences.length - 1];
    if (prev && isSubstantiallySimilar(sentence, prev)) continue;
    uniqueSentences.push(sentence);
  }

  text = uniqueSentences.slice(0, 3).join(' ').trim();

  if (previousAssistant && isSubstantiallySimilar(text, previousAssistant)) {
    return CONTINUE_PROMPT;
  }

  // Strip leading robotic fillers once
  text = text.replace(/^(great question!|absolutely!|certainly!|that's interesting!)\s*/i, '');

  return text || CONTINUE_PROMPT;
}

/**
 * @param {{
 *   messages: Array<{ role: string, content: string }>,
 *   scenario?: string,
 *   speechContext?: { raw?: string, alternatives?: string[] },
 *   greetingAlreadySpoken?: string,
 * }} options
 */
export function buildAssessApiMessages({
  messages,
  scenario,
  speechContext,
  greetingAlreadySpoken,
}) {
  const history = trimConversationHistory(messages);
  const latestUser = getLatestUserMessage(history);
  const scenarioPrompt =
    scenario && SCENARIO_PROMPTS[scenario] ? SCENARIO_PROMPTS[scenario] : SCENARIO_PROMPTS.free_talk;

  const systemParts = [
    SYSTEM_PROMPT,
    scenarioPrompt,
    `[Focus] Reply only to the latest user message: "${latestUser}". Keep context from earlier turns but do not repeat it.`,
  ];

  if (greetingAlreadySpoken?.trim()) {
    systemParts.push(
      `[Context] The opening greeting was already shown to the user: "${greetingAlreadySpoken.trim()}". Do NOT repeat that greeting, re-introduce yourself, or ask for their name again unless they bring it up.`
    );
  }

  const apiMessages = [{ role: 'system', content: systemParts.join('\n\n') }, ...history];

  if (speechContext?.alternatives?.length) {
    const alts = filterSpeechAlternatives(speechContext.raw || latestUser, speechContext.alternatives);
    if (alts.length) {
      apiMessages.push({
        role: 'system',
        content: `[Speech recognition note — do NOT change the user message text] Exact transcript: "${speechContext.raw || latestUser}". Other microphone guesses: ${alts.map((a) => `"${a}"`).join(', ')}. Use guesses only if audio was unclear; never invent a different topic.`,
      });
    }
  }

  return { apiMessages, history, latestUser };
}

/** Structured debug logs for assessment turns */
export function logAssessDebug(label, payload) {
  if (process.env.ASSESS_DEBUG !== '1' && process.env.DEBUG !== 'true') return;
  try {
    console.info(`[assess] ${label}:`, typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
  } catch {
    console.info(`[assess] ${label}:`, payload);
  }
}

/** @param {Array<{ role: string, content: string }>} apiMessages */
export function logAssessPrompt(apiMessages) {
  if (process.env.ASSESS_DEBUG !== '1' && process.env.DEBUG !== 'true') return;

  const summary = apiMessages.map((msg, index) => ({
    index,
    role: msg.role,
    chars: msg.content.length,
    preview: msg.content.slice(0, 160).replace(/\s+/g, ' '),
  }));

  console.info('[assess] final prompt sent to LLM:', JSON.stringify(summary, null, 2));
}

/** @param {string} content */
export function parseAssessResponse(content) {
  const trimmed = (content || '').trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { reply: postProcessReply(trimmed), scores: null, level: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply.trim() : CONTINUE_PROMPT,
      scores: parsed.scores ?? null,
      level: parsed.level ?? null,
    };
  } catch {
    return { reply: postProcessReply(trimmed), scores: null, level: null };
  }
}

/** @param {string} previousAssistant @param {string} latestUserMessage */
export function buildRewriteInstruction(previousAssistant, latestUserMessage) {
  const userFocus = latestUserMessage?.trim() || 'their latest message';
  return `[Rewrite required] Your previous reply was too similar to an earlier one: "${previousAssistant.slice(0, 220)}". Write a completely new 1–3 sentence reply focused on: ${userFocus}. Different opening, vocabulary, and question. Never repeat prior sentences.`;
}

/**
 * Local handling for ignored / incomplete speech — avoid LLM hallucination.
 * @param {string} latestUser
 * @returns {{ handled: true, ignore?: boolean, reply: string, scores: null, level: null } | { handled: false }}
 */
export function handleIncompleteUserMessage(latestUser) {
  if (shouldIgnoreTranscript(latestUser)) {
    return {
      handled: true,
      ignore: true,
      reply: '',
      scores: null,
      level: null,
    };
  }
  if (looksIncompleteUtterance(latestUser)) {
    return {
      handled: true,
      ignore: false,
      reply: CONTINUE_PROMPT,
      scores: null,
      level: null,
    };
  }
  return { handled: false };
}
