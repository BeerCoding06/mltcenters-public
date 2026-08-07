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
  /** Longer continuous listening + 1.5–2s silence endpoint before final emit */
  childMode?: boolean;
  /** Silence before treating speech as finished (ms). Default: child 1800 / adult 1200 */
  silenceMs?: number;
  onFinal?: (text: string, meta?: SpeechResultMeta) => void;
  onInterim?: (text: string) => void;
  /**
   * When true after recognition ends unexpectedly (Chrome timeout / network blip),
   * restart listening after a short backoff.
   */
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
  const altsRef = useRef<string[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const lastFinalEmittedRef = useRef('');
  /** True while we intentionally stop (silence endpoint / user / send) — ignore aborted errors. */
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

  const flushBuffer = useCallback(() => {
    const text = dedupeSpeechTranscript(bufferRef.current);
    const alternatives = [
      ...new Set(
        altsRef.current
          .map((alt) => dedupeSpeechTranscript(alt))
          .filter(Boolean)
      ),
    ];
    bufferRef.current = '';
    altsRef.current = [];

    // Never send interim leftovers or filler-only finals to the LLM pipeline
    if (!text || shouldIgnoreTranscript(text)) {
      if (import.meta.env.DEV && text) {
        console.info('[speech] ignored filler/partial final transcript:', text);
      }
      return;
    }

    // Deduplicate identical consecutive finals (interrupted / double fire)
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

  const scheduleRestart = useCallback(() => {
    clearRestartTimer();
    if (!wantListeningRef.current?.()) return;
    restartTimerRef.current = window.setTimeout(() => {
      restartTimerRef.current = null;
      if (!wantListeningRef.current?.() || listeningRef.current) return;
      const rec = recognitionRef.current;
      if (!rec) return;
      try {
        intentionalStopRef.current = false;
        rec.start();
        listeningRef.current = true;
        setIsListening(true);
        track(ANALYTICS_EVENTS.SPEECH_STARTED);
      } catch {
        /* already started or not allowed */
      }
    }, 450);
  }, [clearRestartTimer]);

  const scheduleFlush = useCallback(() => {
    clearFlushTimer();
    // Endpoint detection: wait for silence after final chunks, then emit once
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      flushBuffer();
      intentionalStopRef.current = true;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    }, endpointMs);
  }, [clearFlushTimer, flushBuffer, endpointMs]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const rec = new SpeechRecognitionAPI();
    rec.continuous = childMode;
    // Keep interim for UI preview only — never flushed as final
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
          scheduleFlush();
        } else {
          // Interim only — never appended to the final buffer
          interim += chunk;
        }
      }
      const preview = dedupeSpeechTranscript(
        normalizeTranscript(`${bufferRef.current} ${interim}`)
      );
      if (preview) onInterimRef.current?.(preview);
    };

    rec.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
      clearFlushTimer();
      // Only flush accumulated FINAL chunks after silence / stop
      if (bufferRef.current.trim()) flushBuffer();
      const wasIntentional = intentionalStopRef.current;
      intentionalStopRef.current = false;
      // Chrome often ends continuous sessions (~60s) or after silence — keep mic alive in voice mode
      if (!wasIntentional) scheduleRestart();
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const err = event.error || '';
      // Intentional stop() often fires "aborted" — keep buffer and let onend flush
      if (err === 'aborted' && intentionalStopRef.current) {
        return;
      }

      listeningRef.current = false;
      setIsListening(false);
      clearFlushTimer();

      // Soft errors: keep any finals we already have, then optionally restart
      if (err === 'aborted' || err === 'no-speech') {
        if (bufferRef.current.trim()) flushBuffer();
        intentionalStopRef.current = false;
        if (err === 'no-speech') scheduleRestart();
        return;
      }

      track(ANALYTICS_EVENTS.SPEECH_FAILED, { error: err });
      if (import.meta.env.DEV) {
        console.warn('[speech] recognition error:', err);
      }

      // Hard errors clear buffer (permission / audio-capture)
      if (err === 'not-allowed' || err === 'service-not-allowed' || err === 'audio-capture') {
        bufferRef.current = '';
        altsRef.current = [];
        intentionalStopRef.current = false;
        return;
      }

      // network / other: flush what we have, then retry listening
      if (bufferRef.current.trim()) flushBuffer();
      else {
        bufferRef.current = '';
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
      intentionalStopRef.current = true;
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, [lang, childMode, scheduleFlush, clearFlushTimer, clearRestartTimer, flushBuffer, scheduleRestart]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return false;
    clearRestartTimer();
    bufferRef.current = '';
    altsRef.current = [];
    clearFlushTimer();
    intentionalStopRef.current = false;
    try {
      recognitionRef.current.start();
      listeningRef.current = true;
      setIsListening(true);
      track(ANALYTICS_EVENTS.SPEECH_STARTED);
      return true;
    } catch {
      // Already started — treat as listening
      listeningRef.current = true;
      setIsListening(true);
      return true;
    }
  }, [clearFlushTimer, clearRestartTimer]);

  const stop = useCallback(() => {
    clearRestartTimer();
    clearFlushTimer();
    intentionalStopRef.current = true;
    // Flush BEFORE stop so aborted races cannot wipe the transcript
    if (bufferRef.current.trim()) flushBuffer();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    listeningRef.current = false;
    setIsListening(false);
  }, [clearFlushTimer, clearRestartTimer, flushBuffer]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { supported, isListening, start, stop, toggle };
}
