"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type QuestionCategory =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "BUSINESS_ENGLISH"
  | "RANDOM";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type Choice = {
  label: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  stem: string;
  explanation: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  active: boolean;
  hint: string | null;
  choices: { id: string; label: string; isCorrect: boolean; sortOrder: number }[];
};

type FormState = {
  id: string | null;
  stem: string;
  explanation: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  hint: string;
  choices: Choice[];
};

const CATEGORIES: QuestionCategory[] = [
  "VOCABULARY",
  "GRAMMAR",
  "READING",
  "LISTENING",
  "BUSINESS_ENGLISH",
  "RANDOM",
];

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

const emptyForm = (): FormState => ({
  id: null,
  stem: "",
  explanation: "",
  category: "VOCABULARY",
  difficulty: "MEDIUM",
  hint: "",
  choices: [
    { label: "", isCorrect: true },
    { label: "", isCorrect: false },
    { label: "", isCorrect: false },
    { label: "", isCorrect: false },
  ],
});

function questionToForm(q: Question): FormState {
  return {
    id: q.id,
    stem: q.stem,
    explanation: q.explanation,
    category: q.category,
    difficulty: q.difficulty,
    hint: q.hint ?? "",
    choices: q.choices
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ label: c.label, isCorrect: c.isCorrect })),
  };
}

export function QuestionsAdminPanel() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/questions?limit=100");
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to load questions");
      }
      const data = (await res.json()) as { questions: Question[]; total: number };
      setQuestions(data.questions);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  function setCorrectChoice(index: number) {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((c, i) => ({
        ...c,
        isCorrect: i === index,
      })),
    }));
  }

  function updateChoiceLabel(index: number, label: string) {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((c, i) => (i === index ? { ...c, label } : c)),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      stem: form.stem.trim(),
      explanation: form.explanation.trim(),
      category: form.category,
      difficulty: form.difficulty,
      hint: form.hint.trim() || undefined,
      choices: form.choices.map((c) => ({
        label: c.label.trim(),
        isCorrect: c.isCorrect,
      })),
    };

    try {
      const res = await fetch("/api/admin/questions", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Save failed");
      }

      setMessage(form.id ? "Question updated." : "Question created.");
      setForm(emptyForm());
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(question: Question) {
    setForm(questionToForm(question));
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setForm(emptyForm());
    setMessage(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--millionaire-gold)]">
            Question Admin
          </h1>
          <p className="text-sm text-[var(--millionaire-silver)]">
            {total} question{total === 1 ? "" : "s"} in database
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-[var(--millionaire-cyan)] hover:underline"
        >
          ← Home
        </Link>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5 rounded-2xl border border-[var(--millionaire-silver)]/50 bg-black p-6 shadow-[0_0_24px_rgb(91_192_255_/_8%)]"
      >
        <h2 className="text-lg font-semibold text-white">
          {form.id ? "Edit question" : "Create question"}
        </h2>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-white">Stem</span>
          <textarea
            required
            rows={3}
            value={form.stem}
            onChange={(e) => setForm((p) => ({ ...p, stem: e.target.value }))}
            className="w-full rounded-xl border border-[var(--millionaire-silver)]/50 bg-[var(--millionaire-bg-deep)] px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">Category</span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  category: e.target.value as QuestionCategory,
                }))
              }
              className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">Difficulty</span>
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  difficulty: e.target.value as Difficulty,
                }))
              }
              className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-white">
            Choices (select the correct answer)
          </legend>
          {form.choices.map((choice, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct"
                checked={choice.isCorrect}
                onChange={() => setCorrectChoice(index)}
                className="accent-[var(--millionaire-gold)]"
                aria-label={`Mark choice ${index + 1} as correct`}
              />
              <input
                required
                value={choice.label}
                onChange={(e) => updateChoiceLabel(index, e.target.value)}
                placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                className="flex-1 rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
              />
            </div>
          ))}
        </fieldset>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-white">Explanation</span>
          <textarea
            required
            rows={2}
            value={form.explanation}
            onChange={(e) =>
              setForm((p) => ({ ...p, explanation: e.target.value }))
            }
            className="w-full rounded-xl border border-[var(--millionaire-silver)]/50 bg-[var(--millionaire-bg-deep)] px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-white">
            Hint <span className="text-[var(--millionaire-silver)]">(optional)</span>
          </span>
          <input
            value={form.hint}
            onChange={(e) => setForm((p) => ({ ...p, hint: e.target.value }))}
            className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
          />
        </label>

        {error ? (
          <p className="text-sm text-[var(--millionaire-wrong)]">{error}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-[var(--millionaire-correct)]">{message}</p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90"
          >
            {saving ? "Saving…" : form.id ? "Update question" : "Create question"}
          </Button>
          {form.id ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              className="rounded-full border-[var(--millionaire-silver)] text-white hover:bg-black/50"
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent questions</h2>

        {loading ? (
          <p className="text-sm text-[var(--millionaire-silver)]">Loading…</p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-[var(--millionaire-silver)]">
            No questions yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--millionaire-silver)]/20 rounded-2xl border border-[var(--millionaire-silver)]/30 bg-black/60">
            {questions.map((q) => (
              <li
                key={q.id}
                className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-white">
                    {q.stem}
                  </p>
                  <p className="text-xs text-[var(--millionaire-silver)]">
                    {q.category.replace("_", " ")} · {q.difficulty}
                    {!q.active ? " · inactive" : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(q)}
                  className="shrink-0 rounded-full border-[var(--millionaire-cyan)]/60 text-[var(--millionaire-cyan)] hover:bg-black/50"
                >
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
