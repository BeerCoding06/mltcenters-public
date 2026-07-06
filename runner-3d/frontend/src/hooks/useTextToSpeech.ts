import { useCallback, useEffect, useRef, useState } from "react";

const CHILD_SPEECH_RATE = 0.58;
const CHILD_SPEECH_PITCH = 1.06;
const SEQUENCE_GAP_MS = 700;

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => /Google US English|Samantha|Karen|Daniel/i.test(v.name)) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang.startsWith("en"))
  );
}

/** Replace blanks so TTS reads naturally for kids. */
export function speechFriendlyEnglish(text: string): string {
  return String(text || "")
    .replace(/___+/g, " blank ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useTextToSpeech() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const unlockedRef = useRef(false);
  const generationRef = useRef(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!synth) return;
    const load = () => {
      voicesRef.current = synth.getVoices();
    };
    load();
    synth.onvoiceschanged = load;
  }, [synth]);

  const unlockAudio = useCallback(() => {
    if (!synth || unlockedRef.current) return;
    unlockedRef.current = true;
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    u.rate = 10;
    synth.speak(u);
    synth.cancel();
  }, [synth]);

  const stop = useCallback(() => {
    generationRef.current += 1;
    if (!synth) return;
    synth.cancel();
    setIsSpeaking(false);
  }, [synth]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!synth) {
        onEnd?.();
        return;
      }
      const t = speechFriendlyEnglish(text);
      if (!t) {
        onEnd?.();
        return;
      }
      const gen = generationRef.current;
      unlockAudio();
      synth.cancel();
      if (voicesRef.current.length === 0) voicesRef.current = synth.getVoices();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "en-US";
      u.rate = CHILD_SPEECH_RATE;
      u.pitch = CHILD_SPEECH_PITCH;
      u.volume = 1;
      const voice = pickEnglishVoice(voicesRef.current);
      if (voice) u.voice = voice;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => {
        if (gen !== generationRef.current) return;
        setIsSpeaking(false);
        onEnd?.();
      };
      u.onerror = () => {
        if (gen !== generationRef.current) return;
        setIsSpeaking(false);
        onEnd?.();
      };
      synth.speak(u);
    },
    [synth, unlockAudio],
  );

  /** Read items one after another; cancelled when stop() or a new speak/sequence starts. */
  const speakSequence = useCallback(
    (texts: string[], onEnd?: () => void) => {
      const parts = texts.map(speechFriendlyEnglish).filter(Boolean);
      if (!parts.length) {
        onEnd?.();
        return;
      }
      generationRef.current += 1;
      const gen = generationRef.current;
      let index = 0;

      const next = () => {
        if (gen !== generationRef.current) return;
        if (index >= parts.length) {
          setIsSpeaking(false);
          onEnd?.();
          return;
        }
        speak(parts[index], () => {
          if (gen !== generationRef.current) return;
          index += 1;
          window.setTimeout(next, SEQUENCE_GAP_MS);
        });
      };

      next();
    },
    [speak],
  );

  /** Interrupt auto-read and speak a single phrase (replay button). */
  const speakOnce = useCallback(
    (text: string) => {
      generationRef.current += 1;
      speak(text);
    },
    [speak],
  );

  /** Stop auto-read when the player picks an answer. */
  const stopForAnswer = useCallback(() => {
    stop();
  }, [stop]);

  return { speak, speakOnce, speakSequence, stop, stopForAnswer, unlockAudio, isSpeaking };
}
