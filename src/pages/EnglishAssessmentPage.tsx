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
import { refineChildTranscript } from '@/lib/childSpeech';
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
      const refined = refineChildTranscript(text, meta?.alternatives);
      setInput(refined);
      if (voiceModeRef.current && conversationStarted) {
        pendingSpeechRef.current = {
          text: refined,
          alternatives: meta?.alternatives ?? [],
        };
      }
    },
    [setInput, conversationStarted]
  );

  const onSpeechInterim = useCallback(
    (text: string) => {
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
    const { text, alternatives } = pendingSpeechRef.current;
    pendingSpeechRef.current = null;
    void handleSend(text, { raw: text, alternatives });
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
    <div className="min-h-screen bg-[#F8FAFC] py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 mb-2"
        >
          <AIIcon size="lg" className="h-14 w-14" />
          <h1 className="text-3xl md:text-4xl font-bold text-center md:leading-[1.3] bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] bg-clip-text text-transparent">
            {t.assessmentPage.title[lang]}
          </h1>
        </motion.div>
        <p className="text-center text-muted-foreground mb-8">
          {t.assessmentPage.subtitle[lang]}
        </p>

        <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="rounded-2xl bg-white/90 shadow-lg px-5 py-2.5 border border-[#5BC0FF]/20">
            <span className="text-muted-foreground text-xs">{t.assessmentPage.points[lang]}</span>
            <p className="text-xl font-bold text-[#5BC0FF]">{xp}</p>
          </div>
          <div className="flex-1 w-full max-w-xs">
            <div className="h-2.5 rounded-full bg-white/80 shadow-inner overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7]"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {!conversationStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto mb-8 text-center"
          >
            <button
              type="button"
              onClick={startConversation}
              className="w-full rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] px-8 py-5 text-lg font-bold text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3"
            >
              <Volume2 className="h-6 w-6" />
              {t.assessmentPage.startVoice[lang]}
            </button>
            <p className="mt-3 text-sm text-muted-foreground">{t.assessmentPage.startHint[lang]}</p>
          </motion.div>
        )}

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0 flex flex-col items-center gap-2 lg:block"
          >
            <AIAssistantAvatar state={avatarState} className="w-32 h-32 lg:w-40 lg:h-40" />
            {conversationStarted && voiceMode && (
              <p className="text-xs text-center text-[#5BC0FF] font-medium max-w-[10rem]">
                {t.assessmentPage.chat.voiceMode[lang]}
              </p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 w-full min-w-0"
          >
            <ChatWindow
              messages={messages}
              inputValue={input}
              onInputChange={setInput}
              onSend={() => void handleSend()}
              isListening={isListening}
              onToggleMic={handleToggleMic}
              micSupported={micSupported}
              disabled={isThinking || isSpeaking || !conversationStarted}
              statusText={statusText}
              avatarState={avatarState}
              speakingMessageId={speakingMessageId}
              onReplay={handleReplay}
              labels={chatLabels}
            />
          </motion.div>
        </div>

        <div className="text-center mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          {conversationStarted && (
            <button
              type="button"
              onClick={() => {
                setVoiceMode((v) => !v);
                stopListening();
              }}
              className="text-sm text-muted-foreground hover:text-[#5BC0FF]"
            >
              {voiceMode
                ? t.assessmentPage.chat.typeMode[lang]
                : t.assessmentPage.chat.voiceMode[lang]}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (messages.length >= 2) completeWithCurrent();
              else navigate('/assessment/dashboard');
            }}
            className="text-sm text-muted-foreground hover:text-[#5BC0FF] underline"
          >
            {t.assessmentPage.done[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}
