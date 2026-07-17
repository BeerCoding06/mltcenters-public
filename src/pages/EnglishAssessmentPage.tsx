import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AIAssistantAvatar } from '@/components/assessment/AIAssistantAvatar';
import { AIIcon } from '@/components/assessment/AIIcon';
import { ChatWindow } from '@/components/assessment/ChatWindow';
import { useAssessment } from '@/hooks/useAssessment';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ASSESSMENT_SCENARIOS } from '@/constants/assessmentScenarios';
import {
  filterSpeechAlternatives,
  shouldIgnoreTranscript,
} from '@/lib/speechTranscript';
import type { AvatarState, AssessmentResult } from '@/types/assessment';

const ASSESSMENT_STORAGE_KEY = 'mlt-assessment-result';
const XP_STORAGE_KEY = 'mlt-assessment-xp';

export default function EnglishAssessmentPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const voiceModeRef = useRef(voiceMode);
  const busyRef = useRef(false);
  const pendingSpeechRef = useRef<{ text: string; alternatives: string[] } | null>(null);

  const { speak, stop, unlockAudio, isSpeaking } = useTextToSpeech();

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  const handleComplete = useCallback(
    (r: AssessmentResult) => {
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
    [navigate, stop]
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

  const speakReply = useCallback(
    (text: string, messageId?: string, thenListen = false) => {
      setAvatarState('speaking');
      if (messageId) setSpeakingMessageId(messageId);
      speak(text, () => {
        setAvatarState('idle');
        setSpeakingMessageId(null);
        if (thenListen && voiceModeRef.current && !busyRef.current) {
          window.setTimeout(() => startListeningRef.current?.(), 950);
        }
      });
    },
    [speak]
  );

  const handleSend = useCallback(
    async (textOverride?: string, speechContext?: { raw: string; alternatives: string[] }) => {
      const text = (textOverride ?? input).trim();
      if (!text || busyRef.current) return;

      busyRef.current = true;
      stopListeningRef.current?.();
      unlockAudio();
      setAvatarState('thinking');
      stop();

      const out = await sendToAPI(text, speechContext);
      busyRef.current = false;

      if (out?.reply) {
        speakReply(out.reply, out.messageId, voiceModeRef.current);
      } else {
        setAvatarState('idle');
        if (voiceModeRef.current) startListeningRef.current?.();
      }
    },
    [input, sendToAPI, speakReply, stop, unlockAudio]
  );

  const onSpeechFinal = useCallback(
    (text: string, meta?: { alternatives: string[] }) => {
      const spoken = text.trim();
      // Interim never reaches here; still hard-block filler finals
      if (!spoken || shouldIgnoreTranscript(spoken)) {
        setInput('');
        pendingSpeechRef.current = null;
        return;
      }
      setInput(spoken);
      if (voiceModeRef.current && conversationStarted) {
        pendingSpeechRef.current = {
          text: spoken,
          alternatives: filterSpeechAlternatives(spoken, meta?.alternatives ?? []),
        };
      }
    },
    [setInput, conversationStarted]
  );

  const onSpeechInterim = useCallback(
    (text: string) => {
      // Preview only — never queued for LLM
      setInput(text);
    },
    [setInput]
  );

  const {
    supported: micSupported,
    isListening,
    start: startListening,
    stop: stopListening,
    toggle: toggleMic,
  } = useSpeechRecognition({
    lang: 'en-US',
    childMode: true,
    silenceMs: 1800,
    onFinal: onSpeechFinal,
    onInterim: onSpeechInterim,
  });

  const startListeningRef = useRef(startListening);
  const stopListeningRef = useRef(stopListening);
  useEffect(() => {
    startListeningRef.current = startListening;
    stopListeningRef.current = stopListening;
  }, [startListening, stopListening]);

  useEffect(() => {
    if (!pendingSpeechRef.current || isListening || isThinking || isSpeaking) return;
    const pending = pendingSpeechRef.current;
    pendingSpeechRef.current = null;
    if (shouldIgnoreTranscript(pending.text)) return;
    void handleSend(pending.text, {
      raw: pending.text,
      alternatives: filterSpeechAlternatives(pending.text, pending.alternatives),
    });
  }, [isListening, isThinking, isSpeaking, handleSend]);

  const startConversation = useCallback(() => {
    unlockAudio();
    setConversationStarted(true);
    setVoiceMode(true);
    const welcome = messages[0];
    if (welcome?.role === 'assistant') {
      speakReply(welcome.content, welcome.id, true);
    } else {
      startListening();
    }
  }, [unlockAudio, messages, speakReply, startListening]);

  const handleReplay = useCallback(
    (text: string) => {
      unlockAudio();
      stopListening();
      speakReply(text);
    },
    [unlockAudio, stopListening, speakReply]
  );

  const handleToggleMic = useCallback(() => {
    unlockAudio();
    if (isListening) stopListening();
    else startListening();
  }, [unlockAudio, isListening, stopListening, startListening]);

  useEffect(() => {
    if (isListening) setAvatarState('listening');
    else if (avatarState === 'listening' && !isSpeaking && !isThinking) {
      setAvatarState('idle');
    }
  }, [isListening, isSpeaking, isThinking, avatarState]);

  useEffect(() => {
    if (isThinking) setAvatarState('thinking');
  }, [isThinking]);

  useEffect(() => {
    if (!conversationStarted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [conversationStarted]);

  const statusText = isThinking
    ? t.assessmentPage.status.thinking[lang]
    : isSpeaking || speakingMessageId
      ? t.assessmentPage.status.speaking[lang]
      : isListening
        ? t.assessmentPage.status.listening[lang]
        : t.assessmentPage.status.idle[lang];

  const chatLabels = {
    placeholder: t.assessmentPage.chat.placeholder[lang],
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
        className={`container mx-auto px-3 sm:px-4 max-w-5xl w-full ${
          conversationStarted ? 'flex flex-1 min-h-0 flex-col' : ''
        }`}
      >
        {!conversationStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-8"
          >
            <div className="flex flex-col items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
              <AIIcon size="lg" className="h-11 w-11 sm:h-14 sm:w-14" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center leading-tight heading-gradient px-2">
                {t.assessmentPage.title[lang]}
              </h1>
              <p className="text-center text-sm text-muted-foreground px-2 max-w-md">
                {t.assessmentPage.subtitle[lang]}
              </p>
            </div>

            <h2 className="text-center text-sm font-semibold text-[#5BC0FF] mb-1">
              {t.assessmentPage.scenarios.title[lang]}
            </h2>
            <p className="text-center text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 px-1">
              {t.assessmentPage.scenarios.hint[lang]}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 sm:mb-6">
              {ASSESSMENT_SCENARIOS.map((scenario) => {
                const selected = scenarioId === scenario.id;
                const label = t.assessmentPage.scenarios[scenario.id][lang];
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => selectScenario(scenario.id)}
                    className={`min-h-[5.25rem] sm:min-h-[5.5rem] rounded-xl sm:rounded-2xl border px-1.5 py-2.5 sm:px-3 sm:py-4 text-center transition-all touch-manipulation flex flex-col items-center justify-center gap-1 ${
                      selected
                        ? 'border-[#5BC0FF] bg-[#5BC0FF]/10 shadow-md ring-2 ring-[#5BC0FF]/30'
                        : 'border-white/80 bg-white/90 shadow-sm hover:border-[#5BC0FF]/40 active:scale-[0.98]'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl leading-none" aria-hidden>
                      {scenario.icon}
                    </span>
                    <span className="text-[11px] sm:text-sm font-medium text-foreground leading-snug line-clamp-2 px-0.5">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-center px-1">
              <button
                type="button"
                onClick={startConversation}
                className="w-full max-w-md mx-auto rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] px-6 py-4 sm:px-8 sm:py-5 text-base sm:text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 sm:gap-3 touch-manipulation"
              >
                <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                {t.assessmentPage.startVoice[lang]}
              </button>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                {t.assessmentPage.startHint[lang]}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-1 min-h-0 flex-col">
            <div className="mb-2 sm:mb-3 shrink-0 flex items-center gap-3 rounded-2xl border border-[#5BC0FF]/15 bg-white/90 px-3 py-2.5 shadow-sm">
              <AIAssistantAvatar state={avatarState} className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {t.assessmentPage.title[lang]}
                </p>
                <p className="text-xs text-[#5BC0FF] font-medium truncate">{statusText}</p>
                {voiceMode && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {t.assessmentPage.chat.voiceMode[lang]}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[10px] text-muted-foreground block">
                  {t.assessmentPage.points[lang]}
                </span>
                <p className="text-lg font-bold text-[#5BC0FF] leading-none">{xp}</p>
              </div>
            </div>

            <div className="mb-2 sm:mb-3 shrink-0 h-2 rounded-full bg-white/80 shadow-inner overflow-hidden">
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
              micSupported={micSupported}
              disabled={isThinking || isSpeaking}
              statusText={statusText}
              avatarState={avatarState}
              speakingMessageId={speakingMessageId}
              onReplay={handleReplay}
              labels={chatLabels}
              compact
            />

            <div className="mt-2 sm:mt-3 shrink-0 flex flex-col items-stretch sm:items-center justify-center gap-1 sm:gap-3 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  setVoiceMode((v) => !v);
                  stopListening();
                }}
                className="text-sm text-muted-foreground hover:text-[#5BC0FF] py-2 touch-manipulation"
              >
                {voiceMode
                  ? t.assessmentPage.chat.typeMode[lang]
                  : t.assessmentPage.chat.voiceMode[lang]}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (messages.length >= 2) completeWithCurrent();
                  else navigate('/assessment/dashboard');
                }}
                className="text-sm text-muted-foreground hover:text-[#5BC0FF] underline py-2 touch-manipulation"
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
