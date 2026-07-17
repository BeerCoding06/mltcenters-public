import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, AIAssessmentResponse, Scores, AssessmentResult } from '@/types/assessment';
import {
  type AssessmentScenarioId,
  welcomeForScenario,
} from '@/constants/assessmentScenarios';
import { buildOutgoingMessages, logClientAssessDebug } from '@/lib/assessmentConversation';
import {
  CONTINUE_PROMPT,
  dedupeSpeechTranscript,
  filterSpeechAlternatives,
  looksIncompleteUtterance,
  shouldIgnoreTranscript,
} from '@/lib/speechTranscript';
import { ANALYTICS_EVENTS } from '@/analytics/analytics-context';
import { track } from '@/analytics/track';

const API_BASE = '/api';
const XP_PER_ANSWER = 20;
const COMBO_MULTIPLIER = 1.2;
const BADGES = ['First Response', '5 Answers Completed', 'Advanced Vocabulary Used', 'Confident Speaker'] as const;

function getLevel(avg: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (avg >= 80) return 'Advanced';
  if (avg >= 60) return 'Intermediate';
  return 'Beginner';
}

function buildResult(scoresList: Scores[], totalXP: number, answerCount: number): AssessmentResult {
  const n = scoresList.length;
  const scores: Scores = n
    ? {
        grammar: Math.round(scoresList.reduce((a, s) => a + s.grammar, 0) / n),
        vocabulary: Math.round(scoresList.reduce((a, s) => a + s.vocabulary, 0) / n),
        fluency: Math.round(scoresList.reduce((a, s) => a + s.fluency, 0) / n),
        coherence: Math.round(scoresList.reduce((a, s) => a + s.coherence, 0) / n),
      }
    : { grammar: 0, vocabulary: 0, fluency: 0, coherence: 0 };
  const avg = n ? (scores.grammar + scores.vocabulary + scores.fluency + scores.coherence) / 4 : 0;
  const level = getLevel(avg);
  const badges: string[] = [];
  if (answerCount >= 1) badges.push(BADGES[0]);
  if (answerCount >= 5) badges.push(BADGES[1]);
  if (scores.vocabulary >= 75) badges.push(BADGES[2]);
  if (scores.fluency >= 70) badges.push(BADGES[3]);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  (['grammar', 'vocabulary', 'fluency', 'coherence'] as const).forEach((k) => {
    if (scores[k] >= 75) strengths.push(k);
    else if (scores[k] < 60) weaknesses.push(k);
  });
  return {
    scores,
    level,
    strengths,
    weaknesses,
    tips: weaknesses.map((w) => `Practice ${w} more.`),
    totalXP,
    badges,
  };
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: welcomeForScenario('free_talk'),
};

export function useAssessment(onComplete: (result: AssessmentResult) => void) {
  const [scenarioId, setScenarioId] = useState<AssessmentScenarioId>('free_talk');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [scoresHistory, setScoresHistory] = useState<Scores[]>([]);
  const [xp, setXp] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const maxTurns = 6;
  const abortRef = useRef<AbortController | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const lastUserSentRef = useRef('');
  const lastAssistantReplyRef = useRef('');
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;

  const selectScenario = useCallback((id: AssessmentScenarioId) => {
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightKeyRef.current = null;
    lastUserSentRef.current = '';
    lastAssistantReplyRef.current = '';
    setScenarioId(id);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: welcomeForScenario(id),
      },
    ]);
    setInput('');
    setScoresHistory([]);
    setXp(0);
    setAnswerCount(0);
    setProgress(0);
  }, []);

  const appendLocalAssistant = useCallback((reply: string) => {
    if (lastAssistantReplyRef.current === reply) return null;
    lastAssistantReplyRef.current = reply;
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: reply,
      },
    ]);
    return { reply, scores: null, level: null, messageId: assistantId };
  }, []);

  const sendToAPI = useCallback(async (
    userText: string,
    speechContext?: { raw: string; alternatives: string[] }
  ) => {
    const trimmed = dedupeSpeechTranscript(userText);
    if (!trimmed) return null;

    // Ignore filler-only / isolated conjunctions — never hit the LLM
    if (shouldIgnoreTranscript(trimmed)) {
      logClientAssessDebug('ignored filler transcript', trimmed);
      setInput('');
      return null;
    }

    // Incomplete utterances → local continue prompt (no guessing)
    if (looksIncompleteUtterance(trimmed)) {
      logClientAssessDebug('incomplete transcript → continue prompt', trimmed);
      if (lastUserSentRef.current === trimmed && lastAssistantReplyRef.current === CONTINUE_PROMPT) {
        setInput('');
        return null;
      }
      lastUserSentRef.current = trimmed;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'user' && last.content.trim() === trimmed) return prev;
        return [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }];
      });
      setInput('');
      return appendLocalAssistant(CONTINUE_PROMPT);
    }

    // Prevent duplicate API requests for the same user text while in flight
    const requestKey = trimmed.toLowerCase();
    if (inFlightKeyRef.current === requestKey) {
      logClientAssessDebug('blocked duplicate in-flight request', trimmed);
      return null;
    }
    if (lastUserSentRef.current === trimmed && isThinking) {
      return null;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    inFlightKeyRef.current = requestKey;
    lastUserSentRef.current = trimmed;

    if (answerCount === 0 && !messagesRef.current.some((m) => m.role === 'user')) {
      track(ANALYTICS_EVENTS.ASSESSMENT_STARTED);
      track(ANALYTICS_EVENTS.CHAT_STARTED);
    }
    track(ANALYTICS_EVENTS.CHAT_MESSAGE_SENT);

    const historyForApi = buildOutgoingMessages(messagesRef.current, trimmed);
    const alts = filterSpeechAlternatives(
      speechContext?.raw || trimmed,
      speechContext?.alternatives || []
    );

    logClientAssessDebug('final transcript', trimmed);
    logClientAssessDebug('outgoing history', historyForApi);

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'user' && last.content.trim() === trimmed) return prev;
      return [...prev, { id: crypto.randomUUID(), role: 'user', content: trimmed }];
    });
    setInput('');
    setIsThinking(true);

    try {
      const res = await fetch(`${API_BASE}/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi,
          speech_context: speechContext
            ? { raw: speechContext.raw || trimmed, alternatives: alts }
            : undefined,
          scenario: scenarioId,
          greeting_already_spoken: welcomeForScenario(scenarioId),
        }),
        signal: controller.signal,
      });
      const data: AIAssessmentResponse = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');

      let reply = data.reply || CONTINUE_PROMPT;
      if (lastAssistantReplyRef.current && reply === lastAssistantReplyRef.current) {
        reply = CONTINUE_PROMPT;
      }
      lastAssistantReplyRef.current = reply;

      const scores = data.scores;
      const level = data.level || null;

      logClientAssessDebug('final response', reply);
      track(ANALYTICS_EVENTS.CHAT_RESPONSE_RECEIVED);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === reply) return prev;
        return [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: reply,
            scores: scores || undefined,
            level: level || undefined,
          },
        ];
      });

      const addedXP = scores
        ? Math.round(
            (XP_PER_ANSWER + Math.min(trimmed.split(/\s/).length * 2, 15)) *
              (answerCount >= 2 ? COMBO_MULTIPLIER : 1)
          )
        : 0;
      if (scores) {
        setScoresHistory((h) => [...h, scores]);
        setAnswerCount((c) => c + 1);
        setXp((prev) => prev + addedXP);
      }
      const nextScores = scores ? [...scoresHistory, scores] : scoresHistory;
      const nextCount = scores ? answerCount + 1 : answerCount;
      setProgress(Math.min((historyForApi.length / 2) / maxTurns, 1));
      const turnsSoFar = historyForApi.filter((m) => m.role === 'user').length;
      if (turnsSoFar >= maxTurns || /goodbye|well done|great job|see you/i.test(reply)) {
        const result = buildResult(nextScores, xp + addedXP, nextCount);
        track(ANALYTICS_EVENTS.ASSESSMENT_COMPLETED, {
          level: result.level,
          score_avg: Math.round(
            (result.scores.grammar +
              result.scores.vocabulary +
              result.scores.fluency +
              result.scores.coherence) /
              4
          ),
        });
        onComplete(result);
      }
      return { reply, scores, level, messageId: assistantId };
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        track(ANALYTICS_EVENTS.ASSESSMENT_FAILED);
        return appendLocalAssistant(
          "Oops, something went wrong. No worries—just try again or type your answer!"
        );
      }
      return null;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      if (inFlightKeyRef.current === requestKey) inFlightKeyRef.current = null;
      setIsThinking(false);
    }
  }, [answerCount, scoresHistory, xp, maxTurns, onComplete, scenarioId, isThinking, appendLocalAssistant]);

  const completeWithCurrent = useCallback(() => {
    const result = buildResult(scoresHistory, xp, answerCount);
    track(ANALYTICS_EVENTS.ASSESSMENT_COMPLETED, {
      level: result.level,
      score_avg: Math.round(
        (result.scores.grammar +
          result.scores.vocabulary +
          result.scores.fluency +
          result.scores.coherence) /
          4
      ),
    });
    onComplete(result);
  }, [scoresHistory, xp, answerCount, onComplete]);

  return {
    messages,
    input,
    setInput,
    sendToAPI,
    isThinking,
    xp,
    answerCount,
    progress,
    completeWithCurrent,
    scoresHistory,
    scenarioId,
    selectScenario,
  };
}
