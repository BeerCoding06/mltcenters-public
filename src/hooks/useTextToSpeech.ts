import { useCallback, useEffect, useRef, useState } from 'react';
import { ANALYTICS_EVENTS } from '@/analytics/analytics-context';
import { track } from '@/analytics/track';

/** ความเร็วพูดช้า ชัด (สำหรับเด็ก) */
const CHILD_SPEECH_RATE = 0.72;
const CHILD_SPEECH_PITCH = 1.08;
/** Chrome speechSynthesis sometimes never fires onend — force settle */
const TTS_WATCHDOG_MIN_MS = 8_000;
const TTS_WATCHDOG_MS_PER_CHAR = 90;

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => /Google US English|Samantha|Karen|Daniel/i.test(v.name)) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang.startsWith('en'))
  );
}

export function useTextToSpeech() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const unlockedRef = useRef(false);
  const watchdogRef = useRef<number | null>(null);
  const settledRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current != null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!synth) return;
    const load = () => {
      voicesRef.current = synth.getVoices();
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
    // Safari / older Chrome
    synth.onvoiceschanged = load;
    return () => {
      clearWatchdog();
      try {
        synth.cancel();
      } catch {
        /* ignore */
      }
      synth.onvoiceschanged = null;
      synth.removeEventListener?.('voiceschanged', load);
    };
  }, [synth, clearWatchdog]);

  const unlockAudio = useCallback(() => {
    if (!synth || unlockedRef.current) return;
    unlockedRef.current = true;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0.01;
      u.rate = 2;
      synth.speak(u);
      window.setTimeout(() => {
        try {
          synth.cancel();
        } catch {
          /* ignore */
        }
      }, 80);
    } catch {
      /* ignore */
    }
  }, [synth]);

  const stop = useCallback(() => {
    clearWatchdog();
    settledRef.current = true;
    if (!synth) {
      setIsSpeaking(false);
      return;
    }
    try {
      synth.cancel();
    } catch {
      /* ignore */
    }
    setIsSpeaking(false);
  }, [synth, clearWatchdog]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!synth) {
        onEnd?.();
        return;
      }
      const t = String(text || '').trim();
      if (!t) {
        onEnd?.();
        return;
      }

      clearWatchdog();
      settledRef.current = false;
      try {
        synth.cancel();
      } catch {
        /* ignore */
      }

      if (voicesRef.current.length === 0) voicesRef.current = synth.getVoices();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-US';
      u.rate = CHILD_SPEECH_RATE;
      u.pitch = CHILD_SPEECH_PITCH;
      u.volume = 1;
      const voice = pickEnglishVoice(voicesRef.current);
      if (voice) u.voice = voice;

      const settle = () => {
        if (settledRef.current) return;
        settledRef.current = true;
        clearWatchdog();
        setIsSpeaking(false);
        onEnd?.();
      };

      u.onstart = () => {
        setIsSpeaking(true);
        track(ANALYTICS_EVENTS.TTS_STARTED);
      };
      u.onend = () => {
        track(ANALYTICS_EVENTS.TTS_COMPLETED);
        settle();
      };
      u.onerror = () => {
        settle();
      };

      const watchdogMs = Math.max(
        TTS_WATCHDOG_MIN_MS,
        Math.ceil((t.length * TTS_WATCHDOG_MS_PER_CHAR) / CHILD_SPEECH_RATE)
      );
      watchdogRef.current = window.setTimeout(() => {
        watchdogRef.current = null;
        if (import.meta.env.DEV) {
          console.warn('[tts] watchdog fired — forcing speech end');
        }
        try {
          synth.cancel();
        } catch {
          /* ignore */
        }
        settle();
      }, watchdogMs);

      try {
        synth.speak(u);
        if (synth.paused) synth.resume();
      } catch {
        settle();
      }
    },
    [synth, clearWatchdog]
  );

  return { speak, stop, unlockAudio, isSpeaking };
}
