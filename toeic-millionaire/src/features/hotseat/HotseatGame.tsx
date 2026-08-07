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
  pickReplacementQuestion,
  type HotseatChoice,
  type HotseatDifficulty,
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

export function HotseatGame() {
  const router = useRouter();
  const { t, isTh } = useGameLang();
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("Player");
  const [lobbyDifficulty, setLobbyDifficulty] =
    useState<HotseatDifficulty>("MEDIUM");
  const [deck, setDeck] = useState<HotseatQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [used5050, setUsed5050] = useState(false);
  const [usedPhone, setUsedPhone] = useState(false);
  const [usedSwap, setUsedSwap] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneTip, setPhoneTip] = useState<string | null>(null);
  const [hintTip, setHintTip] = useState<string | null>(null);

  useEffect(() => {
    const session = loadHotseatSession();
    if (!session) {
      router.replace("/play");
      return;
    }
    setDisplayName(session.displayName);
    setLobbyDifficulty(session.difficulty);
    setDeck(buildHotseatDeck(session.difficulty));
    setReady(true);
  }, [router]);

  const question = deck[index] ?? null;
  const step = index + 1;
  const answeredCount = phase === "won" ? TOTAL_QUESTIONS : index;
  const prizeNow = PRIZE_LADDER[index]?.amount ?? 0;
  const banked = guaranteedPrize(answeredCount);

  const resetQuestionUi = useCallback(() => {
    setSelectedId(null);
    setHiddenIds(new Set());
    setPhoneTip(null);
    setHintTip(null);
    setPhase("playing");
  }, []);

  /** 50:50 — randomly drop 2 wrong answers; leave 1 correct + 1 wrong. */
  function use5050() {
    if (!question || used5050 || phase !== "playing") return;
    const wrong = question.choices.filter((c) => !c.isCorrect);
    const drop = shufflePick(wrong, Math.min(2, wrong.length)).map((c) => c.id);
    setHiddenIds(new Set(drop));
    setUsed5050(true);
    if (selectedId && drop.includes(selectedId)) setSelectedId(null);
  }

  /** Phone a Friend — ask site AI for advice. */
  async function usePhone() {
    if (!question || usedPhone || phoneLoading || phase !== "playing") return;
    setPhoneLoading(true);
    setPhoneTip(null);
    try {
      const visible = question.choices.filter((c) => !hiddenIds.has(c.id));
      const res = await fetch("/api/toeic-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stem: question.stem,
          passage: question.passage,
          choices: visible.map((c) => ({ label: c.label })),
          lang: isTh ? "th" : "en",
        }),
        signal: AbortSignal.timeout(25_000),
      });
      const payload = (await res.json().catch(() => null)) as {
        advice?: string;
        error?: string;
      } | null;
      if (!res.ok || !payload?.advice) {
        throw new Error(payload?.error || t.phoneFailed);
      }
      setPhoneTip(payload.advice);
      setUsedPhone(true);
    } catch {
      setPhoneTip(t.phoneFailed);
      // Do not consume lifeline on failure — player can retry
    } finally {
      setPhoneLoading(false);
    }
  }

  /** Change question — swap current item for another unused TOEIC question. */
  function useSwap() {
    if (!question || usedSwap || phase !== "playing") return;
    const exclude = new Set(deck.map((q) => q.id));
    const next = pickReplacementQuestion(exclude, step, lobbyDifficulty);
    if (!next) {
      setPhoneTip(t.swapFailed);
      return;
    }
    setDeck((prev) => {
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
    setUsedSwap(true);
    resetQuestionUi();
  }

  /** Hint — show teaching hint from the question bank. */
  function useHint() {
    if (!question || usedHint || phase !== "playing") return;
    const tip =
      question.hint ||
      (isTh
        ? "อ่านบริบทประโยคให้ดี แล้วตัดตัวเลือกที่ไม่เข้าไวยากรณ์ออกก่อน"
        : "Read the sentence carefully and eliminate options that do not fit the grammar.");
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
            resetQuestionUi();
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
            {t.playingFor}:{" "}
            <strong className="text-[var(--millionaire-gold)]">
              {formatPrize(prizeNow)}
            </strong>
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
                used: used5050,
                disabled: phase !== "playing" || used5050,
                onClick: use5050,
              },
              {
                kind: "phone",
                label: t.lifelinePhone,
                desc: t.lifelinePhoneDesc,
                used: usedPhone,
                loading: phoneLoading,
                disabled: phase !== "playing" || usedPhone || phoneLoading,
                onClick: () => void usePhone(),
              },
              {
                kind: "swap",
                label: t.lifelineSwap,
                desc: t.lifelineSwapDesc,
                used: usedSwap,
                disabled: phase !== "playing" || usedSwap,
                onClick: useSwap,
              },
              {
                kind: "hint",
                label: t.lifelineHint,
                desc: t.lifelineHintDesc,
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
            <p className="rounded-xl border border-[var(--millionaire-gold)]/45 bg-black/60 px-4 py-3 text-sm text-[var(--millionaire-gold)]">
              <span className="font-semibold">{t.lifelineHint}: </span>
              {hintTip}
            </p>
          ) : null}

          {phoneLoading ? (
            <p className="rounded-xl border border-[var(--millionaire-cyan)]/40 bg-black/60 px-4 py-3 text-sm text-[var(--millionaire-cyan)]">
              {t.phoneCalling}
            </p>
          ) : null}

          {phoneTip ? (
            <p className="rounded-xl border border-[var(--millionaire-cyan)]/40 bg-black/60 px-4 py-3 text-sm text-[var(--millionaire-cyan)]">
              <span className="font-semibold">{t.friendSays}: </span>
              {phoneTip}
            </p>
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
          <MoneyLadder
            currentStep={ended ? answeredCount || step : step}
            answeredCount={answeredCount}
          />
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
