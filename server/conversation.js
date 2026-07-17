/** Conversation history + prompt builder for /api/assess */

export const ANTI_REPETITION_RULES = `Conversation quality rules (strict):
- Never repeat words, phrases, sentences, or paragraphs from your earlier replies.
- Focus primarily on the user's latest message.
- Remember previous context without repeating it verbatim.
- Keep "reply" between 2–5 sentences unless the user asks for more.
- Use varied vocabulary and sentence structures each turn.
- Avoid generic filler such as "Great question!" or "Absolutely!" every turn.
- Ask at most one follow-up question per turn.
- Correct English mistakes naturally in "reply", then continue the conversation.
- Sound like a native English speaker — warm, natural, and human.
- If your reply would be substantially similar to your previous reply, rewrite it before sending.
- Do not summarize previous turns unless the user asks.
- Never ignore the latest user message.
- Maintain a consistent, friendly tutor personality throughout the conversation.`;

export const SYSTEM_PROMPT = `You are an experienced English conversation partner for Thai learners practicing spoken English.

Your goal is to make the conversation feel natural, engaging, and human.

Rules for the "reply" field (read aloud by text-to-speech):
- Use English only in "reply" — never use Thai in the reply.
- Simple, clear English suited to the learner. Short sentences with natural pauses.
- Speak like a kind tutor: encouraging, patient, and conversational.
- Ask at most ONE follow-up question per turn when it helps the flow.

Unclear speech (IMPORTANT):
- The user message is the learner's EXACT spoken or typed words — never rewrite or replace their words in your mental model of what they said.
- You may receive alternative speech-recognition guesses in a separate note. Use those ONLY to interpret unclear audio.
- Respond to what they said or clearly meant. Do not substitute different words for what they said.
- If audio was unclear, respond to the most likely meaning gently — never harshly say you did not understand.

${ANTI_REPETITION_RULES}

After each user message, respond with ONLY valid JSON (no markdown):
{"reply": "...", "scores": {"grammar": 0-100, "vocabulary": 0-100, "fluency": 0-100, "coherence": 0-100}, "level": "Beginner"|"Intermediate"|"Advanced"}

Scores: be generous but fair; adjust up slightly for full sentences and good effort.
Include scores on every turn after the user's first message. On greeting-only turns, scores may be null.`;

export const SCENARIO_PROMPTS = {
  free_talk:
    'Situation: free talk. Chat naturally about hobbies, favorites, and daily life. Stay in character as a warm friend.',
  school:
    'Situation: at school. Role-play a kind teacher. Talk about class, friends, subjects, recess, and lunch. Use simple school words.',
  restaurant:
    'Situation: at a restaurant. Role-play ordering food and drinks. Be polite. Use menu words like soup, rice, juice, please, thank you.',
  park:
    'Situation: at the park. Role-play outdoor fun — swings, running, birds, sunshine. Keep it playful and active.',
  shopping:
    'Situation: at a shop. Role-play buying things. Ask what they want, colors, and simple prices.',
  home:
    'Situation: at home. Role-play family time — meals, pets, toys, bedtime, helping mom or dad.',
  making_friends:
    'Situation: meeting a new friend. Practice greetings, sharing, and kind getting-to-know-you questions.',
  doctor:
    'Situation: at the doctor. Role-play gently. Ask how they feel. Use simple body words. Stay calm and reassuring — never scary.',
  hotel_booking:
    'Situation: hotel front desk. Role-play booking a room. Use simple words: room, night, name, key, check-in. Be polite like a hotel receptionist.',
  getting_lost:
    'Situation: the student is lost. Role-play a kind helper. Ask where they want to go. Use direction words: left, right, straight, near, far. Stay calm.',
  asking_directions:
    'Situation: a visitor asks the student for directions. You are the visitor who is a little lost. Ask where places are. Let the student practice telling you the way in simple English.',
};

const VALID_ROLES = new Set(['user', 'assistant', 'system']);

/** @param {unknown} messages */
export function dedupeMessages(messages) {
  if (!Array.isArray(messages)) return [];

  const result = [];
  for (const raw of messages) {
    if (!raw || typeof raw !== 'object') continue;
    const role = raw.role;
    const content = typeof raw.content === 'string' ? raw.content.trim() : '';
    if (!VALID_ROLES.has(role) || !content) continue;

    const prev = result[result.length - 1];
    if (prev && prev.role === role && prev.content === content) continue;

    result.push({ role, content });
  }
  return result;
}

/** @param {Array<{ role: string, content: string }>} messages @param {number} maxMessages */
export function trimConversationHistory(messages, maxMessages = 12) {
  return dedupeMessages(messages).slice(-maxMessages);
}

/** @param {Array<{ role: string, content: string }>} messages */
export function getPreviousAssistantReply(messages) {
  for (let i = messages.length - 2; i >= 0; i -= 1) {
    if (messages[i]?.role === 'assistant') return messages[i].content;
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
  if (overlapRatio >= 0.82) return true;

  const lenRatio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length, 1);
  if (lenRatio > 0.75 && na.includes(nb.slice(0, Math.min(40, nb.length)))) return true;

  return false;
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
  const scenarioPrompt =
    scenario && SCENARIO_PROMPTS[scenario] ? SCENARIO_PROMPTS[scenario] : SCENARIO_PROMPTS.free_talk;

  const systemParts = [SYSTEM_PROMPT, scenarioPrompt];

  if (greetingAlreadySpoken?.trim()) {
    systemParts.push(
      `[Context] The opening greeting was already shown to the user: "${greetingAlreadySpoken.trim()}". Do NOT repeat that greeting, re-introduce yourself, or ask for their name again unless they bring it up.`
    );
  }

  const apiMessages = [{ role: 'system', content: systemParts.join('\n\n') }, ...history];

  if (speechContext?.alternatives?.length) {
    apiMessages.push({
      role: 'system',
      content: `[Speech recognition note — do NOT change the user message text] Exact transcript shown to the learner: "${speechContext.raw || ''}". Other microphone guesses: ${speechContext.alternatives.map((a) => `"${a}"`).join(', ')}. Use guesses only to interpret unclear audio; reply based on what they actually said.`,
    });
  }

  return { apiMessages, history };
}

/** @param {Array<{ role: string, content: string }>} apiMessages */
export function logAssessPrompt(apiMessages) {
  if (process.env.ASSESS_DEBUG !== '1') return;

  const summary = apiMessages.map((msg, index) => ({
    index,
    role: msg.role,
    chars: msg.content.length,
    preview: msg.content.slice(0, 120).replace(/\s+/g, ' '),
  }));

  console.info('[assess] prompt messages:', JSON.stringify(summary, null, 2));
}

/** @param {string} content */
export function parseAssessResponse(content) {
  const trimmed = (content || '').trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { reply: trimmed || 'Good job!', scores: null, level: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply.trim() : 'Good job!',
      scores: parsed.scores ?? null,
      level: parsed.level ?? null,
    };
  } catch {
    return { reply: trimmed || 'Good job!', scores: null, level: null };
  }
}

/** @param {string} previousAssistant @param {string} latestUserMessage */
export function buildRewriteInstruction(previousAssistant, latestUserMessage) {
  const userFocus = latestUserMessage?.trim() || 'their latest message';
  return `[Rewrite required] Your previous reply was too similar to an earlier one: "${previousAssistant.slice(0, 220)}". Write a completely new reply focused on ${userFocus}. Use different vocabulary, sentence openings, and structure. Never repeat prior sentences or questions.`;
}
