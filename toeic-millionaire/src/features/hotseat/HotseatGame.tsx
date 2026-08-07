"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGameLang } from "@/features/i18n/GameLangProvider";
import { cn } from "@/lib/utils";
import { LifelinesBar } from "./LifelinesBar";
import { MoneyLadder } from "./MoneyLadder";
import {
  buildHotseatDeck,
  letterForIndex,
  type HotseatChoice,
  type HotseatQuestion,
} from "./question-bank";
import {
  formatPrize,
  guaranteedPrize,
  PRIZE_LADDER,
  TOTAL_QUESTIONS,
} from "./prize-ladder";
import { clearHotseatSession, loadHotseatSession } from "./session";

type Phase = "playing" | "locked" | "revealed" | "won" | "lost" | "walked";

type AudienceBars = { id: string; pct: number }[];

export function HotseatGame() {
  const router = useRouter();
  const { t, isTh } = useGameLang();
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("Player");
  const [deck, setDeck] = useState<HotseatQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [used5050, setUsed5050] = useState(false);
  const [usedAudience, setUsedAudience] = useState(false);
  const [usedPhone, setUsedPhone] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [audience, setAudience] = useState<AudienceBars | null>(null);
  const [phoneTip, setPhoneTip] = useState<string | null>(null);
  const [hintTip, setHintTip] = useState<string | null>(null);

  useEffect(() => {
    const session = loadHotseatSession();
    if (!session) {
      router.replace("/play");
      return;
    }
    setDisplayName(session.displayName);
    setDeck(buildHotseatDeck(session.difficulty));
    setReady(true);
  }, [router]);

  const question = deck[index] ?? null;
  const step = index + 1;
  const answeredCount = phase === "won" ? TOTAL_QUESTIONS : index;
  const prizeNow = PRIZE_LADDER[index]?.amount ?? 0;
  const banked = guaranteedPrize(answeredCount);

  const resetForNext = useCallback(() => {
    setSelectedId(null);
    setHiddenIds(new Set());
    setAudience(null);
    setPhoneTip(null);
    setHintTip(null);
    setPhase("playing");
  }, []);

  function use5050() {
    if (!question || used5050 || phase !== "playing") return;
    const wrong = question.choices.filter((c) => !c.isCorrect);
    const drop = shufflePick(wrong, 2).map((c) => c.id);
    setHiddenIds(new Set(drop));
    setUsed5050(true);
    if (selectedId && drop.includes(selectedId)) setSelectedId(null);
  }

  function useAudience() {
    if (!question || usedAudience || phase !== "playing") return;
    const correct = question.choices.find((c) => c.isCorrect);
    const bars = question.choices
      .filter((c) => !hiddenIds.has(c.id))
      .map((c) => {
        if (c.id === correct?.id) return { id: c.id, pct: 42 + Math.floor(Math.random() * 28) };
        return { id: c.id, pct: 5 + Math.floor(Math.random() * 22) };
      });
    const sum = bars.reduce((a, b) => a + b.pct, 0) || 1;
    setAudience(bars.map((b) => ({ ...b, pct: Math.round((b.pct / sum) * 100) })));
    setUsedAudience(true);
  }

  function usePhone() {
    if (!question || usedPhone || phase !== "playing") return;
    const correctIndex = question.choices.findIndex((c) => c.isCorrect);
    const letter = letterForIndex(correctIndex >= 0 ? correctIndex : 0);
    const tip = isTh
      ? `เพื่อนบอกว่าน่าจะเป็นข้อ ${letter}${question.hint ? ` — ${question.hint}` : ""}`
      : `Your friend leans toward ${letter}${question.hint ? ` — ${question.hint}` : ""}`;
    setPhoneTip(tip);
    setUsedPhone(true);
  }

  function useHint() {
    if (!question || usedHint || phase !== "playing") return;
    const tip =
      question.hint ||
      (isTh
        ? "อ่านบริบทประโยคให้ดี แล้วตัดคำตอบที่ไม่เข้าไวยากรณ์ออกก่อน"
        : "Read the sentence context carefully and eliminate grammar mismatches first.");
    setHintTip(tip);
    setUsedHint(true);
  }

  function lockAnswer() {
    if (!selectedId || phase !== "playing") return;
    setPhase("locked");
    window.setTimeout(() => {
      const choice = question?.choices.find((c) => c.id === selectedId);
      const ok = Boolean(choice?.isCorrect);
      setPhase("revealed");
      window.setTimeout(() => {
        if (ok) {
          if (index + 1 >= TOTAL_QUESTIONS) {
            setPhase("won");
          } else {
            setIndex((i) => i + 1);
            resetForNext();
          }
        } else {
          setPhase("lost");
        }
      }, 1600);
    }, 900);
  }

  function walkAway() {
    if (phase !== "playing" || index === 0) return;
    setPhase("walked");
  }

  function playAgain() {
    clearHotseatSession();
    router.push("/play");
  }

  if (!ready || !question) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--millionaire-silver)]">
        {t.loading}
      </div>
    );
  }

  const ended = phase === "won" || phase === "lost" || phase === "walked";
  const takeHome =
    phase === "won"
      ? PRIZE_LADDER[14].amount
      : phase === "walked"
        ? PRIZE_LADDER[Math.max(index - 1, 0)].amount
        : banked;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[var(--millionaire-gold)]">
            {t.brand}
          </p>
          <h1 className="text-lg font-bold text-white md:text-xl">
            {displayName} · {t.questionOf(step, TOTAL_QUESTIONS)}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="millionaire-pill py-1.5 text-xs">
            {t.playingFor}: <strong className="text-[var(--millionaire-gold)]">{formatPrize(prizeNow)}</strong>
          </span>
          <span className="millionaire-pill py-1.5 text-xs">
            {t.guaranteed}: <strong>{formatPrize(banked)}</strong>
          </span>
          <Link
            href="/play"
            className="text-xs text-[var(--millionaire-silver)] underline-offset-2 hover:underline"
          >
            {t.backToLobby}
          </Link>
        </div>
      </header>

      <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_220px]">
        <section className="flex flex-col gap-4">
          <LifelinesBar
            title={t.lifelinesTitle}
            items={[
              {
                kind: "fifty",
                label: t.lifeline5050,
                desc: t.lifeline5050Desc,
                icon: "½",
                used: used5050,
                disabled: phase !== "playing" || used5050,
                onClick: use5050,
              },
              {
                kind: "audience",
                label: t.lifelineAudience,
                desc: t.lifelineAudienceDesc,
                icon: "◎",
                used: usedAudience,
                disabled: phase !== "playing" || usedAudience,
                onClick: useAudience,
              },
              {
                kind: "phone",
                label: t.lifelinePhone,
                desc: t.lifelinePhoneDesc,
                icon: "☎",
                used: usedPhone,
                disabled: phase !== "playing" || usedPhone,
                onClick: usePhone,
              },
              {
                kind: "hint",
                label: t.lifelineHint,
                desc: t.lifelineHintDesc,
                icon: "?",
                used: usedHint,
                disabled: phase !== "playing" || usedHint,
                onClick: useHint,
              },
            ]}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={phase !== "playing" || index === 0}
              onClick={walkAway}
              className="rounded-full border-[var(--millionaire-silver)]/60 text-white"
            >
              {t.walkAway}
            </Button>
          </div>

          {hintTip ? (
            <p className="rounded-xl border border-[var(--millionaire-gold)]/40 bg-black/60 px-4 py-3 text-sm text-[var(--millionaire-gold)]">
              <span className="font-semibold">{t.lifelineHint}: </span>
              {hintTip}
            </p>
          ) : null}

          {phoneTip ? (
            <p className="rounded-xl border border-[var(--millionaire-cyan)]/40 bg-black/60 px-4 py-3 text-sm text-[var(--millionaire-cyan)]">
              <span className="font-semibold">{t.friendSays}: </span>
              {phoneTip}
            </p>
          ) : null}

          {audience ? (
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--millionaire-silver)]/30 bg-black/50 p-3 sm:grid-cols-4">
              {audience.map((bar) => {
                const choice = question.choices.find((c) => c.id === bar.id);
                return (
                  <div key={bar.id} className="text-center text-xs">
                    <div className="mb-1 text-[var(--millionaire-silver)]">
                      {letterForIndex(question.choices.findIndex((c) => c.id === bar.id))}
                    </div>
                    <div className="mx-auto flex h-20 w-8 items-end rounded bg-black/80">
                      <div
                        className="w-full rounded-t bg-[var(--millionaire-cyan)]"
                        style={{ height: `${Math.max(bar.pct, 4)}%` }}
                      />
                    </div>
                    <div className="mt-1 tabular-nums text-white">{bar.pct}%</div>
                    <div className="truncate text-[var(--millionaire-silver)]">
                      {choice?.label.slice(0, 18)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="hotseat-question relative overflow-hidden px-5 py-6 text-center md:px-10 md:py-8">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--millionaire-gold)]">
              {question.category.replaceAll("_", " ")}
            </p>
            {question.passage ? (
              <p className="mb-4 whitespace-pre-wrap text-left text-sm text-[var(--millionaire-silver)] md:text-base">
                {question.passage}
              </p>
            ) : null}
            <p className="text-lg font-semibold leading-snug text-white md:text-2xl">
              {question.stem}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice, i) => (
              <AnswerButton
                key={choice.id}
                letter={letterForIndex(i)}
                choice={choice}
                hidden={hiddenIds.has(choice.id)}
                selected={selectedId === choice.id}
                phase={phase}
                disabled={phase !== "playing" || hiddenIds.has(choice.id)}
                onSelect={() => setSelectedId(choice.id)}
              />
            ))}
          </div>

          {!ended ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                disabled={!selectedId || phase !== "playing"}
                onClick={lockAnswer}
                className="min-w-[200px] rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90"
              >
                {phase === "locked" || phase === "revealed"
                  ? t.revealing
                  : t.finalAnswer}
              </Button>
            </div>
          ) : null}

          {phase === "revealed" && selectedId ? (
            <p
              className={cn(
                "text-center text-sm font-semibold",
                question.choices.find((c) => c.id === selectedId)?.isCorrect
                  ? "text-[var(--millionaire-correct)]"
                  : "text-[var(--millionaire-wrong)]",
              )}
            >
              {question.choices.find((c) => c.id === selectedId)?.isCorrect
                ? t.correct
                : t.incorrect}
              {question.explanation ? ` — ${question.explanation}` : ""}
            </p>
          ) : null}
        </section>

        <aside className="rounded-2xl border border-[var(--millionaire-silver)]/30 bg-black/70 p-3 lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-[var(--millionaire-gold)]">
            {t.moneyLadder}
          </p>
          <MoneyLadder currentStep={ended ? answeredCount || step : step} answeredCount={answeredCount} />
        </aside>
      </div>

      {ended ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--millionaire-gold)]/50 bg-[#05070f] p-6 text-center shadow-[0_0_40px_rgb(251_191_36_/_20%)]">
            <p className="text-sm text-[var(--millionaire-gold)]">{t.brand}</p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {phase === "won"
                ? t.youWin
                : phase === "walked"
                  ? t.walkedAway
                  : t.gameOver}
            </h2>
            <p className="mt-3 text-[var(--millionaire-silver)]">
              {t.youTakeHome}:{" "}
              <span className="text-xl font-bold text-[var(--millionaire-gold)]">
                {formatPrize(takeHome)}
              </span>
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={playAgain}
                className="rounded-full bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90"
              >
                {t.playAgain}
              </Button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-[var(--millionaire-silver)]/50 px-4 py-2 text-sm text-white"
              >
                {t.home}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnswerButton({
  letter,
  choice,
  hidden,
  selected,
  phase,
  disabled,
  onSelect,
}: {
  letter: string;
  choice: HotseatChoice;
  hidden: boolean;
  selected: boolean;
  phase: Phase;
  disabled: boolean;
  onSelect: () => void;
}) {
  if (hidden) {
    return <div className="hotseat-choice opacity-20" aria-hidden />;
  }

  const revealed = phase === "revealed" || phase === "won" || phase === "lost";
  const showCorrect = revealed && choice.isCorrect;
  const showWrong = revealed && selected && !choice.isCorrect;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "hotseat-choice group text-left",
        selected && !revealed && "millionaire-choice-selected hotseat-choice-selected",
        showCorrect && "hotseat-choice-correct",
        showWrong && "hotseat-choice-wrong",
      )}
    >
      <span className="hotseat-letter">{letter}:</span>
      <span className="flex-1">{choice.label}</span>
    </button>
  );
}

function shufflePick<T>(items: T[], n: number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
