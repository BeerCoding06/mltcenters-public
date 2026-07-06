import { useCallback, useEffect, useRef, useState } from 'react';

/** ความเร็วพูดช้า ชัด (สำหรับเด็ก) */
const CHILD_SPEECH_RATE = 0.72;
const CHILD_SPEECH_PITCH = 1.08;

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
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    u.rate = 10;
    synth.speak(u);
    synth.cancel();
  }, [synth]);

  const stop = useCallback(() => {
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
      const t = String(text || '').trim();
      if (!t) {
        onEnd?.();
        return;
      }
      synth.cancel();
      if (voicesRef.current.length === 0) voicesRef.current = synth.getVoices();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'en-US';
      u.rate = CHILD_SPEECH_RATE;
      u.pitch = CHILD_SPEECH_PITCH;
      u.volume = 1;
      const voice = pickEnglishVoice(voicesRef.current);
      if (voice) u.voice = voice;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      u.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      synth.speak(u);
    },
    [synth]
  );

  return { speak, stop, unlockAudio, isSpeaking };
}
