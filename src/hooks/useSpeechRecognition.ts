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
}: Options = {}) {
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  const bufferRef = useRef('');
  const altsRef = useRef<string[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const lastFinalEmittedRef = useRef('');
  const endpointMs = silenceMs ?? (childMode ? 1800 : 1200);

  useEffect(() => {
    onFinalRef.current = onFinal;
    onInterimRef.current = onInterim;
  }, [onFinal, onInterim]);

  const clearFlushTimer = useCallback(() => {
    if (flushTimerRef.current != null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
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

  const scheduleFlush = useCallback(() => {
    clearFlushTimer();
    // Endpoint detection: wait for silence after final chunks, then emit once
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      flushBuffer();
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
      setIsListening(false);
      clearFlushTimer();
      // Only flush accumulated FINAL chunks after silence / stop
      if (bufferRef.current.trim()) flushBuffer();
    };
    rec.onerror = () => {
      setIsListening(false);
      clearFlushTimer();
      track(ANALYTICS_EVENTS.SPEECH_FAILED);
      // Do not flush on error — avoids sending interrupted partials
      bufferRef.current = '';
      altsRef.current = [];
    };

    recognitionRef.current = rec;
    setSupported(true);

    return () => {
      clearFlushTimer();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, [lang, childMode, scheduleFlush, clearFlushTimer, flushBuffer]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return false;
    bufferRef.current = '';
    altsRef.current = [];
    clearFlushTimer();
    try {
      recognitionRef.current.start();
      setIsListening(true);
      track(ANALYTICS_EVENTS.SPEECH_STARTED);
      return true;
    } catch {
      setIsListening(false);
      track(ANALYTICS_EVENTS.SPEECH_FAILED);
      return false;
    }
  }, [clearFlushTimer]);

  const stop = useCallback(() => {
    clearFlushTimer();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setIsListening(false);
    if (bufferRef.current.trim()) flushBuffer();
  }, [clearFlushTimer, flushBuffer]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { supported, isListening, start, stop, toggle };
}
