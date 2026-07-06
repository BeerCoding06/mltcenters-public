import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TutorAvatar } from "../components/TutorAvatar";
import { useTutorWebSocket } from "../hooks/useTutorWebSocket";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { api } from "../services/api";
import type { AvatarPayload, Evaluation, TutorMessage } from "../types";

const TOPICS = [
  "สนทนาทั่วไป",
  "ท่องเที่ยว",
  "ธุรกิจ",
  "สัมภาษณ์งาน",
] as const;

export function TutorPage() {
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [avatarPayload, setAvatarPayload] = useState<AvatarPayload | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [input, setInput] = useState("");
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const { connected, sendMessage, interrupt } = useTutorWebSocket(sessionId, {
    onToken: (text) => setStreamingText((prev) => prev + text),
    onComplete: ({ text, avatar, evaluation: ev }) => {
      setMessages((prev) => [...prev, { role: "assistant", content: text, meta: avatar }]);
      setStreamingText("");
      setAvatarPayload(avatar);
      setSpeaking(true);
      if (ev) setEvaluation(ev);
    },
    onInterrupted: stopSpeaking,
  });

  const { recording, start, stop } = useVoiceRecorder(() => {
    interrupt();
    stopSpeaking();
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const existing = searchParams.get("session");
    if (existing) {
      api.getSession(existing).then((s) => {
        setSessionId(s.id);
        setMessages(s.messages as TutorMessage[]);
        if (s.evaluation) setEvaluation(s.evaluation);
      });
      return;
    }
    api.startSession(topic).then((res) => {
      setSessionId(res.session_id);
      setMessages([{ role: "assistant", content: res.greeting, meta: res.avatar }]);
      setAvatarPayload(res.avatar);
      setSpeaking(true);
    });
  }, [searchParams, topic]);

  const submitText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !sessionId) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setStreamingText("");
    sendMessage(trimmed);
    setInput("");
  };

  const toggleMic = async () => {
    if (recording) {
      const blob = await stop();
      if (blob.size > 0) {
        const { text } = await api.stt(blob);
        if (text) submitText(text);
      }
    } else {
      await start();
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
      <div className="sticky top-4 h-[min(80vh,640px)]">
        <TutorAvatar
          payload={avatarPayload}
          speaking={speaking}
          expression="smile"
          onSpeechEnd={() => {
            setSpeaking(false);
            setAvatarPayload(null);
          }}
        />
        <p className="mt-2 text-center text-sm text-slate-400">
          เอ็มม่า · {connected ? "เชื่อมต่อแล้ว" : "กำลังเชื่อมต่อ…"}
        </p>
      </div>

      <div className="flex min-h-[70vh] flex-col rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-4 py-3">
          <label className="text-sm text-slate-400">
            หัวข้อ{" "}
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={!!sessionId}
              className="ml-2 rounded bg-slate-800 px-2 py-1"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-sky-600 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              {m.content}
            </div>
          ))}
          {streamingText && (
            <div className="max-w-[85%] rounded-2xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
              {streamingText}
              <span className="animate-pulse">▌</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {evaluation && (
          <div className="border-t border-slate-800 bg-slate-950/50 p-4 text-sm">
            <h3 className="font-semibold text-sky-400">ระดับ CEFR: {evaluation.cefr}</h3>
            <p className="text-slate-400">คะแนนรวม: {evaluation.overall}/100</p>
            {evaluation.grammar_corrections.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-slate-300">
                {evaluation.grammar_corrections.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            )}
            {evaluation.vocabulary_suggestions.length > 0 && (
              <p className="mt-2 text-emerald-400">
                คำศัพท์แนะนำ: {evaluation.vocabulary_suggestions.join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={toggleMic}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              recording ? "bg-red-600 animate-pulse" : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {recording ? "หยุด" : "🎤 พูด"}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitText(input)}
            placeholder="พิมพ์ข้อความภาษาไทย…"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => submitText(input)}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  );
}
