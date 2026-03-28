import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, AIAssessmentResponse, Scores, AssessmentResult } from '@/types/assessment';

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
  content: "Hi! Let's have a quick chat in English—just say hi and talk a bit like we're meeting for the first time. I'll listen and we can see how you're doing! 😊",
};

export function useAssessment(onComplete: (result: AssessmentResult) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [scoresHistory, setScoresHistory] = useState<Scores[]>([]);
  const [xp, setXp] = useState(0);
  const [answerCount, setAnswerCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const maxTurns = 8;
  const abortRef = useRef<AbortController | null>(null);

  const sendToAPI = useCallback(async (userText: string) => {
    const newMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ];
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: userText },
    ]);
    setInput('');
    setIsThinking(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`${API_BASE}/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });
      const data: AIAssessmentResponse = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');

      const reply = data.reply || 'Good job!';
      const scores = data.scores;
      const level = data.level || null;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply,
          scores: scores || undefined,
          level: level || undefined,
        },
      ]);

      const addedXP = scores
        ? Math.round(
            (XP_PER_ANSWER + Math.min(userText.split(/\s/).length * 2, 15)) *
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
      setProgress(Math.min((newMessages.length / 2) / maxTurns, 1));
      const turnsSoFar = newMessages.filter((m) => m.role === 'user').length;
      if (turnsSoFar >= maxTurns || /goodbye|well done|great job|see you/i.test(reply)) {
        const result = buildResult(nextScores, xp + addedXP, nextCount);
        onComplete(result);
      }
      return { reply, scores, level };
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: "Oops, something went wrong. No worries—just try again or type your answer! 😊",
          },
        ]);
      }
      return null;
    } finally {
      setIsThinking(false);
      abortRef.current = null;
    }
  }, [messages, answerCount, scoresHistory, xp, maxTurns, onComplete]);

  const completeWithCurrent = useCallback(() => {
    const result = buildResult(scoresHistory, xp, answerCount);
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
  };
}
