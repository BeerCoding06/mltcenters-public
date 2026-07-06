import { FormEvent, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { Conversation, Evaluation, Message } from "../types";
import { TOPICS } from "../types";

export function ChatPage() {
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startChat() {
    setLoading(true);
    setError("");
    try {
      const conv = await api.startConversation(topic);
      setConversation(conv);
      setMessages(conv.messages);
      setEvaluation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start chat");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!conversation || !input.trim() || loading) return;
    const content = input.trim();
    setInput("");
    setLoading(true);
    setError("");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const res = await api.sendMessage(conversation.id, content);
      setMessages((prev) => [...prev, res.assistant_message]);
      setConversation((prev) =>
        prev ? { ...prev, turn_count: res.turn_count } : prev
      );
      if (res.evaluation) {
        setEvaluation(res.evaluation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Topic</h2>
        <div className="space-y-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                topic === t
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={startChat}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {conversation ? "New conversation" : "Start conversation"}
        </button>
        {conversation && (
          <p className="mt-4 text-sm text-slate-500">
            Turns: {conversation.turn_count} / 10
          </p>
        )}
      </aside>

      <section className="flex min-h-[70vh] flex-col rounded-2xl bg-white shadow">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {!conversation && (
            <p className="text-slate-500">
              Choose a topic and start a natural conversation with your AI tutor.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {m.content}
            </div>
          ))}
          {evaluation && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <h3 className="font-semibold text-green-800">
                Assessment complete — {evaluation.cefr} ({evaluation.overall}/100)
              </h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-green-900">
                {evaluation.feedback.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {error && <p className="px-6 text-sm text-red-600">{error}</p>}
        <form onSubmit={sendMessage} className="flex gap-2 border-t p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={!conversation || !!evaluation || loading}
            className="flex-1 rounded-lg border px-4 py-2"
          />
          <button
            type="submit"
            disabled={!conversation || !!evaluation || loading}
            className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
