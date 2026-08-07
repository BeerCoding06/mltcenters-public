import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AIAssistantAvatar } from '@/components/assessment/AIAssistantAvatar';
import { AIIcon } from '@/components/assessment/AIIcon';
import { ChatWindow } from '@/components/assessment/ChatWindow';
import { useAssessment } from '@/hooks/useAssessment';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useWhisperVoice } from '@/hooks/useWhisperVoice';
import { ASSESSMENT_SCENARIOS } from '@/constants/assessmentScenarios';
import { shouldIgnoreTranscript } from '@/lib/speechTranscript';
import type { AvatarState, AssessmentResult } from '@/types/assessment';

const ASSESSMENT_STORAGE_KEY = 'mlt-assessment-result';
const XP_STORAGE_KEY = 'mlt-assessment-xp';

export default function EnglishAssessmentPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const [conversationStarted, setConversationStarted] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const voiceModeRef = useRef(voiceMode);
  const busyRef = useRef(false);
  const conversationStartedRef = useRef(false);
  const listenTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const { speak, stop, unlockAudio, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (listenTimerRef.current != null) {
        window.clearTimeout(listenTimerRef.current);
        listenTimerRef.current = null;
      }
      stop();
    };
  }, [stop]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    conversationStartedRef.current = conversationStarted;
  }, [conversationStarted]);

  const clearListenTimer = useCallback(() => {
    if (listenTimerRef.current != null) {
      window.clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(
    (r: AssessmentResult) => {
      clearListenTimer();
      stop();
      try {
        localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(r));
        const hist = JSON.parse(localStorage.getItem(XP_STORAGE_KEY) || '[]');
        hist.push({ xp: r.totalXP, at: Date.now() });
        localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(hist.slice(-20)));
      } catch {
        /* ignore */
      }
      navigate('/assessment/dashboard', { state: { result: r }, replace: true });
    },
    [navigate, stop, clearListenTimer]
  );

  const {
    messages,
    input,
    setInput,
    sendToAPI,
    isThinking,
    xp,
    progress,
    completeWithCurrent,
    scenarioId,
    selectScenario,
  } = useAssessment(handleComplete);

  const startListeningRef = useRef<() => Promise<boolean> | boolean>(() => false);
  const cancelListeningRef = useRef<() => Promise<void>>(async () => undefined);

  const scheduleListen = useCallback(
    (delayMs: number) => {
      clearListenTimer();
      listenTimerRef.current = window.setTimeout(() => {
        listenTimerRef.current = null;
        if (!mountedRef.current) return;
        if (!voiceModeRef.current || !conversationStartedRef.current || busyRef.current) return;
        void startListeningRef.current?.();
      }, delayMs);
    },
    [clearListenTimer]
  );

  const speakReply = useCallback(
    (text: string, messageId?: string, thenListen = false) => {
      busyRef.current = true;
      clearListenTimer();
      if (messageId) setSpeakingMessageId(messageId);
      speak(text, () => {
        setSpeakingMessageId(null);
        busyRef.current = false;
        if (thenListen && voiceModeRef.current && mountedRef.current) {
          scheduleListen(750);
        }
      });
    },
    [speak, clearListenTimer, scheduleListen]
  );

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || busyRef.current) return;

      busyRef.current = true;
      clearListenTimer();
      await cancelListeningRef.current?.();
      unlockAudio();
      stop();

      const out = await sendToAPI(text);
      if (!mountedRef.current) {
        busyRef.current = false;
        return;
      }

      if (out?.reply) {
        speakReply(out.reply, out.messageId, voiceModeRef.current);
      } else {
        busyRef.current = false;
        if (voiceModeRef.current) scheduleListen(400);
      }
    },
    [input, sendToAPI, speakReply, stop, unlockAudio, clearListenTimer, scheduleListen]
  );

  const onUtterance = useCallback(
    (text: string) => {
      if (!conversationStartedRef.current || !voiceModeRef.current) return;
      if (shouldIgnoreTranscript(text) || busyRef.current) return;
      setInput(text);
      void handleSend(text);
    },
    [handleSend, setInput]
  );

  const {
    supported: micSupported,
    isListening,
    isTranscribing,
    error: voiceError,
    start: startListening,
    stop: stopListening,
    cancel: cancelListening,
  } = useWhisperVoice({
    onUtterance,
    onPreview: setInput,
    onNoSpeech: () => {
      if (!voiceModeRef.current || !conversationStartedRef.current || busyRef.current) return;
      scheduleListen(500);
    },
    silenceMs: 1100,
    maxUtteranceMs: 14_000,
    minSpeechMs: 400,
  });

  useEffect(() => {
    startListeningRef.current = startListening;
    cancelListeningRef.current = cancelListening;
  }, [startListening, cancelListening]);

  const avatarState: AvatarState = useMemo(() => {
    if (isTranscribing || isThinking) return 'thinking';
    if (isListening) return 'listening';
    if (isSpeaking || speakingMessageId) return 'speaking';
    return 'idle';
  }, [isTranscribing, isThinking, isListening, isSpeaking, speakingMessageId]);

  const startConversation = useCallback(() => {
    unlockAudio();
    setConversationStarted(true);
    setVoiceMode(true);
    const welcome = messages[0];
    if (welcome?.role === 'assistant') {
      speakReply(welcome.content, welcome.id, true);
    } else {
      void startListening();
    }
  }, [unlockAudio, messages, speakReply, startListening]);

  const handleReplay = useCallback(
    (text: string) => {
      unlockAudio();
      void cancelListening();
      speakReply(text, undefined, false);
    },
    [unlockAudio, cancelListening, speakReply]
  );

  const handleToggleMic = useCallback(() => {
    unlockAudio();
    if (isListening || isTranscribing) void stopListening();
    else void startListening();
  }, [unlockAudio, isListening, isTranscribing, stopListening, startListening]);

  useEffect(() => {
    if (!conversationStarted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [conversationStarted]);

  const statusText =
    isThinking || isTranscribing
      ? isTranscribing
        ? t.assessmentPage.status.transcribing[lang]
        : t.assessmentPage.status.thinking[lang]
      : isSpeaking || speakingMessageId
        ? t.assessmentPage.status.speaking[lang]
        : isListening
          ? t.assessmentPage.status.listening[lang]
          : voiceError
            ? t.assessmentPage.status.micError[lang]
            : t.assessmentPage.status.idle[lang];

  const chatLabels = {
    placeholder: t.assessmentPage.chat.placeholder[lang],
    send: t.assessmentPage.chat.send[lang],
    micOn: t.assessmentPage.chat.micOn[lang],
    micOff: t.assessmentPage.chat.micOff[lang],
    replay: t.assessmentPage.chat.replay[lang],
    you: t.assessmentPage.chat.you[lang],
    ai: t.assessmentPage.chat.ai[lang],
    voiceMode: t.assessmentPage.chat.voiceMode[lang],
  };

  return (
    <div
      className={
        conversationStarted
          ? 'fixed inset-x-0 top-0 z-40 flex h-[100dvh] flex-col overflow-hidden bg-[#F8FAFC] pt-[4.5rem] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pt-20'
          : 'min-h-[100dvh] bg-[#F8FAFC] pt-[4.5rem] pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-20 sm:pb-8'
      }
    >
      <div
        className={`container mx-auto w-full max-w-5xl px-3 sm:px-4 lg:max-w-6xl ${
          conversationStarted ? 'flex min-h-0 flex-1 flex-col' : ''
        }`}
      >
        {!conversationStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-8"
          >
            <div className="mb-3 flex flex-col items-center gap-2 sm:mb-4 sm:gap-3">
              <AIIcon size="lg" className="h-11 w-11 sm:h-14 sm:w-14" />
              <h1 className="heading-gradient px-2 text-center text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
                {t.assessmentPage.title[lang]}
              </h1>
              <p className="max-w-md px-2 text-center text-sm text-muted-foreground">
                {t.assessmentPage.subtitle[lang]}
              </p>
            </div>

            <h2 className="mb-1 text-center text-sm font-semibold text-[#5BC0FF]">
              {t.assessmentPage.scenarios.title[lang]}
            </h2>
            <p className="mb-3 px-1 text-center text-xs text-muted-foreground sm:mb-4 sm:text-sm">
              {t.assessmentPage.scenarios.hint[lang]}
            </p>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:mb-6 sm:grid-cols-3 md:grid-cols-4 sm:gap-3">
              {ASSESSMENT_SCENARIOS.map((scenario) => {
                const selected = scenarioId === scenario.id;
                const label = t.assessmentPage.scenarios[scenario.id][lang];
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectScenario(scenario.id)}
                    className={`flex min-h-[4.75rem] touch-manipulation flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all sm:min-h-[5.5rem] sm:rounded-2xl sm:px-3 sm:py-4 ${
                      selected
                        ? 'border-[#5BC0FF] bg-[#5BC0FF]/10 shadow-md ring-2 ring-[#5BC0FF]/30'
                        : 'border-white/80 bg-white/90 shadow-sm hover:border-[#5BC0FF]/40 active:scale-[0.98]'
                    }`}
                  >
                    <span className="text-xl leading-none sm:text-2xl" aria-hidden>
                      {scenario.icon}
                    </span>
                    <span className="line-clamp-2 px-0.5 text-[11px] font-medium leading-snug text-foreground sm:text-sm">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-1 text-center">
              <button
                type="button"
                onClick={startConversation}
                className="mx-auto flex w-full max-w-md touch-manipulation items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] px-6 py-4 text-base font-bold text-white shadow-xl transition-all hover:shadow-2xl sm:gap-3 sm:px-8 sm:py-5 sm:text-lg"
              >
                <Volume2 className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                {t.assessmentPage.startVoice[lang]}
              </button>
              <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm">
                {t.assessmentPage.startHint[lang]}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-4xl">
            <div className="mb-2 flex shrink-0 items-center gap-3 rounded-2xl border border-[#5BC0FF]/15 bg-white/90 px-3 py-2.5 shadow-sm sm:mb-3">
              <AIAssistantAvatar state={avatarState} className="h-12 w-12 shrink-0 sm:h-16 sm:w-16" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {t.assessmentPage.title[lang]}
                </p>
                <p
                  className="truncate text-xs font-medium text-[#5BC0FF]"
                  role="status"
                  aria-live="polite"
                >
                  {statusText}
                </p>
                {voiceMode && (
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {t.assessmentPage.chat.voiceMode[lang]}
                  </p>
                )}
                {voiceError ? (
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceMode(false);
                      void cancelListening();
                    }}
                    className="mt-1 text-[11px] font-medium text-[#c9184a] underline-offset-2 hover:underline"
                  >
                    {t.assessmentPage.chat.typeMode[lang]}
                  </button>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <span className="block text-[10px] text-muted-foreground">
                  {t.assessmentPage.points[lang]}
                </span>
                <p className="text-lg font-bold leading-none text-[#5BC0FF]">{xp}</p>
              </div>
            </div>

            <div className="mb-2 h-2 shrink-0 overflow-hidden rounded-full bg-white/80 shadow-inner sm:mb-3">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7]"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <ChatWindow
              messages={messages}
              inputValue={input}
              onInputChange={setInput}
              onSend={() => void handleSend()}
              isListening={isListening}
              onToggleMic={handleToggleMic}
              micSupported={micSupported && voiceMode}
              disabled={isThinking || isSpeaking || isTranscribing}
              statusText={statusText}
              avatarState={avatarState}
              speakingMessageId={speakingMessageId}
              onReplay={handleReplay}
              labels={chatLabels}
              compact
            />

            <div className="mt-2 flex shrink-0 flex-col items-stretch justify-center gap-1 sm:mt-3 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  const next = !voiceMode;
                  setVoiceMode(next);
                  clearListenTimer();
                  void cancelListening();
                  if (next && !busyRef.current) scheduleListen(300);
                }}
                className="touch-manipulation py-2 text-sm text-muted-foreground hover:text-[#5BC0FF]"
              >
                {voiceMode
                  ? t.assessmentPage.chat.typeMode[lang]
                  : t.assessmentPage.chat.voiceMode[lang]}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearListenTimer();
                  stop();
                  if (messages.length >= 2) completeWithCurrent();
                  else navigate('/assessment/dashboard');
                }}
                className="touch-manipulation py-2 text-sm text-muted-foreground underline hover:text-[#5BC0FF]"
              >
                {t.assessmentPage.done[lang]}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
