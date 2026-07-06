import { useCallback, useEffect, useRef, useState } from "react";
import type { AvatarPayload, Viseme } from "../types";
import { mediaUrl } from "../services/api";

type MouthShape = "closed" | "A" | "E" | "I" | "O" | "U" | "smile";

interface Props {
  payload: AvatarPayload | null;
  speaking: boolean;
  expression?: "smile" | "neutral";
  onSpeechEnd?: () => void;
}

const MOUTH_PATHS: Record<MouthShape, string> = {
  closed: "M 42 68 Q 50 70 58 68",
  A: "M 40 66 Q 50 78 60 66 Q 50 72 40 66",
  E: "M 38 68 Q 50 74 62 68",
  I: "M 44 68 L 56 68",
  O: "M 44 66 Q 50 76 56 66 Q 50 70 44 66",
  U: "M 46 67 Q 50 73 54 67",
  smile: "M 38 67 Q 50 76 62 67",
};

function shapeAt(visemes: Viseme[], t: number): MouthShape {
  if (!visemes.length) return "closed";
  let current: MouthShape = "closed";
  for (const v of visemes) {
    if (t >= v.t) {
      const shape = v.shape as MouthShape;
      if (["closed", "A", "E", "I", "O", "U", "smile"].includes(shape)) current = shape;
    }
  }
  return current;
}

export function TutorAvatar({ payload, speaking, expression = "neutral", onSpeechEnd }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const [mouth, setMouth] = useState<MouthShape>("smile");
  const [blink, setBlink] = useState(false);
  const [headTilt, setHeadTilt] = useState(0);

  const portrait = payload?.portrait_url || "/media/portrait";
  const isVideo = payload?.engine === "musetalk" && payload.video_url;

  // Natural blink every 3–5s
  useEffect(() => {
    let timeoutId: number;
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 2000;
      timeoutId = window.setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, []);

  // Subtle head movement while idle
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadTilt((Math.random() - 0.5) * 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const playAudio = useCallback(
    async (p: AvatarPayload) => {
      if (isVideo && videoRef.current) {
        videoRef.current.src = mediaUrl(p.video_url!);
        videoRef.current.play();
        videoRef.current.onended = () => onSpeechEnd?.();
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;
      audio.src = mediaUrl(p.audio_url);
      await audio.play();

      const visemes = p.visemes || [];
      const start = performance.now();

      const loop = () => {
        if (!audio.paused && !audio.ended) {
          const t = (performance.now() - start) / 1000;
          const shape = p.expression === "smile" && t < 0.5 ? "smile" : shapeAt(visemes, t);
          setMouth(shape);
          rafRef.current = requestAnimationFrame(loop);
        }
      };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(loop);

      audio.onended = () => {
        cancelAnimationFrame(rafRef.current);
        setMouth(expression === "smile" ? "smile" : "closed");
        onSpeechEnd?.();
      };
    },
    [expression, isVideo, onSpeechEnd]
  );

  useEffect(() => {
    if (payload) void playAudio(payload);
    return () => cancelAnimationFrame(rafRef.current);
  }, [payload, playAudio]);

  useEffect(() => {
    if (!speaking && !payload) {
      setMouth(expression === "smile" ? "smile" : "closed");
    }
  }, [speaking, payload, expression]);

  const idleMouth = expression === "smile" ? "smile" : "closed";
  const displayMouth = speaking || payload ? mouth : idleMouth;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950">
      <div
        className="animate-breathe relative h-[min(72vh,520px)] w-[min(42vh,320px)] transition-transform duration-[4s] ease-in-out"
        style={{ transform: `rotate(${headTilt}deg)` }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            className="h-full w-full rounded-2xl object-cover shadow-2xl ring-2 ring-sky-500/30"
            playsInline
            muted={false}
          />
        ) : (
          <>
            <img
              src={portrait}
              alt="เอ็มม่า — ครูสอนภาษาอังกฤษ"
              className="h-full w-full rounded-2xl object-cover shadow-2xl ring-2 ring-sky-500/30"
            />
            {/* Lip-sync mouth overlay */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid slice"
            >
              <ellipse
                cx="38"
                cy="42"
                rx="5"
                ry={blink ? 0.3 : 3.5}
                fill="#1a1a1a"
                className="transition-all duration-100"
              />
              <ellipse
                cx="62"
                cy="42"
                rx="5"
                ry={blink ? 0.3 : 3.5}
                fill="#1a1a1a"
                className="transition-all duration-100"
              />
              <path
                d={MOUTH_PATHS[displayMouth]}
                fill="none"
                stroke="rgba(180,80,70,0.85)"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
          </>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
      <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-xs text-sky-200">
        {speaking ? "กำลังพูด…" : "กำลังฟัง"}
      </div>
    </div>
  );
}
