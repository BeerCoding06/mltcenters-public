import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechResultMeta {
  alternatives: string[];
}

interface Options {
  lang?: string;
  /** โหมดเด็กเล็ก: ฟังนานขึ้น รวมคำพูด ส่งหลายทางเลือกจากไมค์ */
  childMode?: boolean;
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
    const text = bufferRef.current.trim();
    const alternatives = [...new Set(altsRef.current)];
    bufferRef.current = '';
    altsRef.current = [];
    if (text) onFinalRef.current?.(text, { alternatives });
  }, []);

  const scheduleFlush = useCallback(() => {
    clearFlushTimer();
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      flushBuffer();
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    }, childMode ? 1400 : 600);
  }, [childMode, clearFlushTimer, flushBuffer]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
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
          bufferRef.current = `${bufferRef.current} ${chunk}`.trim();
          altsRef.current.push(...parts);
          scheduleFlush();
        } else {
          interim += chunk;
        }
      }
      const preview = `${bufferRef.current} ${interim}`.trim();
      if (preview) onInterimRef.current?.(preview);
      else if (interim) onInterimRef.current?.(interim);
    };

    rec.onend = () => {
      setIsListening(false);
      clearFlushTimer();
      if (childMode && bufferRef.current.trim()) flushBuffer();
    };
    rec.onerror = () => {
      setIsListening(false);
      clearFlushTimer();
      if (bufferRef.current.trim()) flushBuffer();
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
      return true;
    } catch {
      setIsListening(false);
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
