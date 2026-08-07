import { useCallback, useEffect, useRef, useState } from 'react';
import {
  dedupeSpeechTranscript,
  mergeSpeechChunks,
  normalizeTranscript,
  shouldIgnoreTranscript,
} from '@/lib/speechTranscript';
import { ANALYTICS_EVENTS } from '@/analytics/analytics-context';
import { track } from '@/analytics/track';

export interface SpeechResultMeta {
  alternatives: string[];
}

interface Options {
  lang?: string;
  /** Longer continuous listening + silence endpoint before final emit */
  childMode?: boolean;
  /** Silence before treating speech as finished (ms). Default: child 1800 / adult 1200 */
  silenceMs?: number;
  onFinal?: (text: string, meta?: SpeechResultMeta) => void;
  onInterim?: (text: string) => void;
  /** Keep mic alive after Chrome ends the session unexpectedly */
  wantListening?: () => boolean;
}

function collectAlternatives(result: SpeechRecognitionResult): string[] {
  const alts: string[] = [];
  for (let j = 0; j < result.length; j += 1) {
    const t = result[j]?.transcript?.trim();
    if (t) alts.push(t);
  }
  return alts;
}

export function useSpeechRecognition({
  lang = 'en-US',
  childMode = false,
  silenceMs,
  onFinal,
  onInterim,
  wantListening,
}: Options = {}) {
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  const wantListeningRef = useRef(wantListening);
  const bufferRef = useRef('');
  const interimRef = useRef('');
  const altsRef = useRef<string[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const startRetryTimerRef = useRef<number | null>(null);
  const lastFinalEmittedRef = useRef('');
  const intentionalStopRef = useRef(false);
  const listeningRef = useRef(false);
  const endpointMs = silenceMs ?? (childMode ? 1800 : 1200);

  useEffect(() => {
    onFinalRef.current = onFinal;
    onInterimRef.current = onInterim;
    wantListeningRef.current = wantListening;
  }, [onFinal, onInterim, wantListening]);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current != null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
  }, []);

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current != null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const clearStartRetryTimer = useCallback(() => {
    if (startRetryTimerRef.current != null) {
      window.clearTimeout(startRetryTimerRef.current);
      startRetryTimerRef.current = null;
    }
  }, []);

  const flushBuffer = useCallback(() => {
    // Chrome often keeps speech as interim until stop — promote interim if no finals
    const raw = bufferRef.current.trim()
      ? bufferRef.current
      : interimRef.current;
    const text = dedupeSpeechTranscript(raw);
    const alternatives = [
      ...new Set(
        altsRef.current
          .map((alt) => dedupeSpeechTranscript(alt))
          .filter(Boolean)
      ),
    ];
    bufferRef.current = '';
    interimRef.current = '';
    altsRef.current = [];

    if (!text || shouldIgnoreTranscript(text)) {
      if (import.meta.env.DEV && text) {
        console.info('[speech] ignored filler/partial final transcript:', text);
      }
      return;
    }

    if (text.toLowerCase() === lastFinalEmittedRef.current.toLowerCase()) {
      if (import.meta.env.DEV) {
        console.info('[speech] ignored duplicate final transcript:', text);
      }
      return;
    }

    lastFinalEmittedRef.current = text;
    if (import.meta.env.DEV) {
      console.info('[speech] final transcript:', text, { alternatives });
    }
    track(ANALYTICS_EVENTS.SPEECH_COMPLETED, { chars: text.length });
    onFinalRef.current?.(text, { alternatives });
  }, []);

  const tryStartRecognition = useCallback(
    (attempt = 0): boolean => {
      const rec = recognitionRef.current;
      if (!rec) return false;
      intentionalStopRef.current = false;
      try {
        rec.start();
        listeningRef.current = true;
        setIsListening(true);
        track(ANALYTICS_EVENTS.SPEECH_STARTED);
        return true;
      } catch {
        // InvalidStateError right after stop/onend — retry briefly
        if (attempt < 5) {
          clearStartRetryTimer();
          startRetryTimerRef.current = window.setTimeout(() => {
            startRetryTimerRef.current = null;
            if (!wantListeningRef.current || wantListeningRef.current()) {
              tryStartRecognition(attempt + 1);
            }
          }, 200 + attempt * 150);
          return false;
        }
        listeningRef.current = false;
        setIsListening(false);
        track(ANALYTICS_EVENTS.SPEECH_FAILED, { error: 'start_failed' });
        return false;
      }
    },
    [clearStartRetryTimer]
  );

  const scheduleRestart = useCallback(() => {
    clearRestartTimer();
    if (!wantListeningRef.current?.()) return;
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      if (!wantListeningRef.current?.() || listeningRef.current) return;
      tryStartRecognition(0);
    }, 500);
  }, [clearRestartTimer, tryStartRecognition]);

  const scheduleFlush = useCallback(() => {
    clearFlushTimer();
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      flushBuffer();
      intentionalStopRef.current = true;
      listeningRef.current = false;
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {
        intentionalStopRef.current = false;
      }
    }, endpointMs);
  }, [clearFlushTimer, flushBuffer, endpointMs]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const rec = new SpeechRecognitionAPI();
    rec.continuous = childMode;
    rec.interimResults = true;
    rec.lang = lang;
    rec.maxAlternatives = childMode ? 5 : 3;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i];
        const chunk = result[0]?.transcript || '';
        if (result.isFinal) {
          const parts = collectAlternatives(result);
          bufferRef.current = mergeSpeechChunks(bufferRef.current, chunk);
          altsRef.current.push(...parts);
          interimRef.current = '';
          scheduleFlush();
        } else {
          interim += chunk;
        }
      }
      if (interim) interimRef.current = interim;
      const preview = dedupeSpeechTranscript(
        normalizeTranscript(`${bufferRef.current} ${interim || interimRef.current}`)
      );
      if (preview) onInterimRef.current?.(preview);
    };

    rec.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      clearFlushTimer();
      if (bufferRef.current.trim() || interimRef.current.trim()) flushBuffer();
      const wasIntentional = intentionalStopRef.current;
      intentionalStopRef.current = false;
      if (!wasIntentional) scheduleRestart();
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const err = event.error || '';
      if (err === 'aborted' && intentionalStopRef.current) {
        return;
      }

      listeningRef.current = false;
      setIsListening(false);
      clearFlushTimer();

      if (err === 'aborted' || err === 'no-speech') {
        if (bufferRef.current.trim() || interimRef.current.trim()) flushBuffer();
        intentionalStopRef.current = false;
        scheduleRestart();
        return;
      }

      track(ANALYTICS_EVENTS.SPEECH_FAILED, { error: err });
      if (import.meta.env.DEV) {
        console.warn('[speech] recognition error:', err);
      }

      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
        bufferRef.current = '';
        interimRef.current = '';
        altsRef.current = [];
        intentionalStopRef.current = false;
        return;
      }

      if (bufferRef.current.trim() || interimRef.current.trim()) flushBuffer();
      else {
        bufferRef.current = '';
        interimRef.current = '';
        altsRef.current = [];
      }
      intentionalStopRef.current = false;
      scheduleRestart();
    };

    recognitionRef.current = rec;
    setSupported(true);

    return () => {
      clearFlushTimer();
      clearRestartTimer();
      clearStartRetryTimer();
      intentionalStopRef.current = true;
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, [
    lang,
    childMode,
    scheduleFlush,
    clearFlushTimer,
    clearRestartTimer,
    clearStartRetryTimer,
    flushBuffer,
    scheduleRestart,
  ]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return false;
    clearRestartTimer();
    clearStartRetryTimer();
    bufferRef.current = '';
    interimRef.current = '';
    altsRef.current = [];
    clearFlushTimer();
    return tryStartRecognition(0);
  }, [clearFlushTimer, clearRestartTimer, clearStartRetryTimer, tryStartRecognition]);

  const stop = useCallback(() => {
    clearRestartTimer();
    clearStartRetryTimer();
    clearFlushTimer();
    const hadSession = listeningRef.current;
    intentionalStopRef.current = hadSession;
    if (bufferRef.current.trim() || interimRef.current.trim()) flushBuffer();
    try {
      recognitionRef.current?.stop();
    } catch {
      intentionalStopRef.current = false;
    }
    listeningRef.current = false;
    setIsListening(false);
  }, [clearFlushTimer, clearRestartTimer, clearStartRetryTimer, flushBuffer]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { supported, isListening, start, stop, toggle };
}
