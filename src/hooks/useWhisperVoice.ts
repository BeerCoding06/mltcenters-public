import { useCallback, useEffect, useRef, useState } from 'react';
import { ANALYTICS_EVENTS } from '@/analytics/analytics-context';
import { track } from '@/analytics/track';
import { dedupeSpeechTranscript, shouldIgnoreTranscript } from '@/lib/speechTranscript';

export type VoicePhase = 'idle' | 'listening' | 'transcribing';

type Options = {
  onUtterance: (text: string) => void;
  onPreview?: (text: string) => void;
  onNoSpeech?: () => void;
  silenceThreshold?: number;
  silenceMs?: number;
  maxUtteranceMs?: number;
  minSpeechMs?: number;
};

const MAX_UPLOAD_BYTES = 6_000_000;

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

/**
 * MediaRecorder + WebAudio VAD → Whisper (/api/transcribe) as raw audio body.
 */
export function useWhisperVoice({
  onUtterance,
  onPreview,
  onNoSpeech,
  silenceThreshold = 0.018,
  silenceMs = 1200,
  maxUtteranceMs = 15_000,
  minSpeechMs = 450,
}: Options) {
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const onUtteranceRef = useRef(onUtterance);
  const onPreviewRef = useRef(onPreview);
  const onNoSpeechRef = useRef(onNoSpeech);
  const phaseRef = useRef<VoicePhase>('idle');
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const speechStartedAtRef = useRef<number | null>(null);
  const lastLoudAtRef = useRef<number>(0);
  const listeningStartedAtRef = useRef<number>(0);
  const stoppingRef = useRef(false);
  const mutedRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const stopRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    onUtteranceRef.current = onUtterance;
    onPreviewRef.current = onPreview;
    onNoSpeechRef.current = onNoSpeech;
  }, [onUtterance, onPreview, onNoSpeech]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    mountedRef.current = true;
    const ok =
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined' &&
      !!pickMimeType();
    setSupported(ok);
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const cleanupAudioGraph = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const setPhaseSafe = useCallback((next: VoicePhase) => {
    phaseRef.current = next;
    if (mountedRef.current) setPhase(next);
  }, []);

  const transcribeBlob = useCallback(async (blob: Blob): Promise<string> => {
    if (blob.size < 800) return '';
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error('Audio too large — please speak a shorter sentence');
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 40_000);

    try {
      const mime = blob.type || 'audio/webm';
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': mime,
          'X-Speech-Language': 'en',
        },
        body: blob,
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as
        | { text?: string; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error || 'Transcription failed');
      }
      return dedupeSpeechTranscript(data?.text || '');
    } finally {
      window.clearTimeout(timeout);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  const finishUtterance = useCallback(
    async (blob: Blob) => {
      setPhaseSafe('transcribing');
      if (mountedRef.current) setError(null);
      try {
        const text = await transcribeBlob(blob);
        if (!mountedRef.current) return;
        track(ANALYTICS_EVENTS.SPEECH_COMPLETED, { chars: text.length, engine: 'whisper' });
        if (!text || shouldIgnoreTranscript(text)) {
          onPreviewRef.current?.('');
          onNoSpeechRef.current?.();
          return;
        }
        onPreviewRef.current?.(text);
        onUtteranceRef.current(text);
      } catch (e) {
        if (!mountedRef.current) return;
        if ((e as Error).name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : 'Transcription failed';
        setError(msg);
        track(ANALYTICS_EVENTS.SPEECH_FAILED, { error: 'whisper_failed' });
        onNoSpeechRef.current?.();
      } finally {
        if (phaseRef.current === 'transcribing') setPhaseSafe('idle');
      }
    },
    [setPhaseSafe, transcribeBlob]
  );

  const stopRecorder = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cleanupAudioGraph();
      stopTracks();
      recorderRef.current = null;
      return null;
    }
    return new Promise((resolve) => {
      recorder.onstop = () => {
        cleanupAudioGraph();
        stopTracks();
        recorderRef.current = null;
        const mime = recorder.mimeType || pickMimeType() || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        resolve(blob);
      };
      try {
        recorder.stop();
      } catch {
        cleanupAudioGraph();
        stopTracks();
        recorderRef.current = null;
        resolve(null);
      }
    });
  }, [cleanupAudioGraph, stopTracks]);

  const stop = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      const blob = await stopRecorder();
      if (blob && blob.size > 800 && !mutedRef.current) {
        await finishUtterance(blob);
      } else {
        setPhaseSafe('idle');
        if (!mutedRef.current) onNoSpeechRef.current?.();
      }
    } finally {
      stoppingRef.current = false;
    }
  }, [finishUtterance, setPhaseSafe, stopRecorder]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const monitorLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || phaseRef.current !== 'listening') return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const now = performance.now();

    if (rms >= silenceThreshold) {
      lastLoudAtRef.current = now;
      if (speechStartedAtRef.current == null) {
        speechStartedAtRef.current = now;
        onPreviewRef.current?.('…');
      }
    }

    const spokenFor =
      speechStartedAtRef.current != null ? now - speechStartedAtRef.current : 0;
    const silentFor = now - lastLoudAtRef.current;
    const elapsed = now - listeningStartedAtRef.current;

    const shouldCutForSilence =
      speechStartedAtRef.current != null &&
      spokenFor >= minSpeechMs &&
      silentFor >= silenceMs;

    const shouldCutForMax = elapsed >= maxUtteranceMs && speechStartedAtRef.current != null;

    if (shouldCutForSilence || shouldCutForMax) {
      void stopRef.current();
      return;
    }

    if (speechStartedAtRef.current == null && elapsed >= maxUtteranceMs) {
      void stopRecorder().then(() => setPhaseSafe('idle'));
      return;
    }

    rafRef.current = requestAnimationFrame(monitorLevels);
  }, [
    maxUtteranceMs,
    minSpeechMs,
    setPhaseSafe,
    silenceMs,
    silenceThreshold,
    stopRecorder,
  ]);

  const start = useCallback(async () => {
    if (!supported || stoppingRef.current) return false;
    if (phaseRef.current === 'listening' || phaseRef.current === 'transcribing') return false;

    if (mountedRef.current) setError(null);
    mutedRef.current = false;
    speechStartedAtRef.current = null;
    lastLoudAtRef.current = performance.now();
    listeningStartedAtRef.current = performance.now();
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.start(250);

      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') await ctx.resume();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

      setPhaseSafe('listening');
      track(ANALYTICS_EVENTS.SPEECH_STARTED, { engine: 'whisper' });
      rafRef.current = requestAnimationFrame(monitorLevels);
      return true;
    } catch (e) {
      stopTracks();
      cleanupAudioGraph();
      setPhaseSafe('idle');
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Microphone blocked');
      }
      track(ANALYTICS_EVENTS.SPEECH_FAILED, { error: 'mic_blocked' });
      return false;
    }
  }, [cleanupAudioGraph, monitorLevels, setPhaseSafe, stopTracks, supported]);

  const cancel = useCallback(async () => {
    mutedRef.current = true;
    stoppingRef.current = true;
    abortRef.current?.abort();
    try {
      await stopRecorder();
      setPhaseSafe('idle');
    } finally {
      stoppingRef.current = false;
      mutedRef.current = false;
    }
  }, [setPhaseSafe, stopRecorder]);

  useEffect(
    () => () => {
      mutedRef.current = true;
      abortRef.current?.abort();
      void stopRecorder();
    },
    [stopRecorder]
  );

  return {
    supported,
    phase,
    isListening: phase === 'listening',
    isTranscribing: phase === 'transcribing',
    error,
    start,
    stop,
    cancel,
  };
}
