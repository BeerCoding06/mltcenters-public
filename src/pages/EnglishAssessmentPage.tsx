import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { AIAssistantAvatar } from '@/components/assessment/AIAssistantAvatar';
import { ChatWindow } from '@/components/assessment/ChatWindow';
import { useAssessment } from '@/hooks/useAssessment';
import type { AvatarState } from '@/types/assessment';
import type { AssessmentResult } from '@/types/assessment';

const ASSESSMENT_STORAGE_KEY = 'mlt-assessment-result';
const XP_STORAGE_KEY = 'mlt-assessment-xp';

function useSpeechRecognition(onResult: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      onResult(text);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    setSupported(true);
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, [onResult]);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening]);

  return { supported, isListening, toggle };
}

function useTTS() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const unlockedRef = useRef(false);

  useEffect(() => {
    if (!synth) return;
    const load = () => {
      voicesRef.current = synth.getVoices();
    };
    load();
    synth.onvoiceschanged = load;
  }, [synth]);

  /** Call once right after a user click to allow TTS to work after async (browser autoplay policy). */
  const unlockAudio = useCallback(() => {
    if (!synth || unlockedRef.current) return;
    unlockedRef.current = true;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    u.rate = 10;
    synth.speak(u);
    synth.cancel();
  }, [synth]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!synth) return;
      const t = String(text || '').trim();
      if (!t) return;
      synth.cancel();
      if (voicesRef.current.length === 0) voicesRef.current = synth.getVoices();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-US';
      u.rate = 1.05;
      u.volume = 1;
      const en = voicesRef.current.find((v) => v.lang.startsWith('en'));
      if (en) u.voice = en;
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
      synth.speak(u);
    },
    [synth]
  );

  const stop = useCallback(() => {
    synth?.cancel();
  }, [synth]);

  return { speak, stop, unlockAudio };
}

export default function EnglishAssessmentPage() {
  const { lang, t } = useI18n();
  const navigate = useNavigate();
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const { speak, stop, unlockAudio } = useTTS();

  const handleComplete = useCallback(
    (r: AssessmentResult) => {
      setResult(r);
      try {
        localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(r));
        const hist = JSON.parse(localStorage.getItem(XP_STORAGE_KEY) || '[]');
        hist.push({ xp: r.totalXP, at: Date.now() });
        localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(hist.slice(-20)));
      } catch {
        /* ignore storage errors */
      }
      navigate('/assessment/dashboard', { state: { result: r }, replace: true });
    },
    [navigate]
  );

  const {
    messages,
    input,
    setInput,
    sendToAPI,
    isThinking,
    xp,
    answerCount,
    progress,
    completeWithCurrent,
  } = useAssessment(handleComplete);

  const onResult = useCallback(
    (text: string) => {
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    },
    [setInput]
  );
  const { supported: micSupported, isListening, toggle: toggleMic } = useSpeechRecognition(onResult);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    unlockAudio();
    setAvatarState('thinking');
    stop();
    const out = await sendToAPI(text);
    if (out?.reply) {
      setAvatarState('speaking');
      speak(out.reply, () => setAvatarState('idle'));
    } else {
      setAvatarState('idle');
    }
  }, [input, sendToAPI, speak, stop, unlockAudio]);

  useEffect(() => {
    if (isListening) setAvatarState('listening');
    else if (!isListening && avatarState === 'listening') setAvatarState('idle');
  }, [isListening, avatarState]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16">
      <div className="container mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] bg-clip-text text-transparent"
        >
          {t.assessmentPage.title[lang]}
        </motion.h1>
        <p className="text-center text-muted-foreground mb-8">
          {t.assessmentPage.subtitle[lang]}
        </p>

        {/* XP & progress - simple, playful */}
        <div className="max-w-2xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="rounded-2xl bg-white/90 shadow-lg px-5 py-2.5 border border-[#5BC0FF]/20">
            <span className="text-muted-foreground text-xs">Points</span>
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

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0 flex justify-center lg:block"
          >
            <AIAssistantAvatar state={avatarState} className="w-32 h-32 lg:w-40 lg:h-40" />
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
              onSend={handleSend}
              isListening={isListening}
              onToggleMic={toggleMic}
              micSupported={micSupported}
              disabled={isThinking}
            />
          </motion.div>
        </div>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              if (messages.length >= 2) completeWithCurrent();
              else navigate('/assessment/dashboard');
            }}
            className="text-sm text-muted-foreground hover:text-[#5BC0FF] underline"
          >
            I'm done — show my results
          </button>
        </div>
      </div>
    </div>
  );
}
