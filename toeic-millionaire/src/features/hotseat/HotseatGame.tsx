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

  const lifelineItems = [
    {
      kind: "fifty" as const,
      label: t.lifeline5050,
      desc: t.lifeline5050Desc,
      used: used5050,
      disabled: phase !== "playing" || used5050,
      onClick: use5050,
    },
    {
      kind: "phone" as const,
      label: t.lifelinePhone,
      desc: t.lifelinePhoneDesc,
      used: usedPhone,
      loading: phoneLoading,
      disabled: phase !== "playing" || usedPhone || phoneLoading,
      onClick: () => void usePhone(),
    },
    {
      kind: "swap" as const,
      label: t.lifelineSwap,
      desc: t.lifelineSwapDesc,
      used: usedSwap,
      disabled: phase !== "playing" || usedSwap,
      onClick: useSwap,
    },
    {
      kind: "hint" as const,
      label: t.lifelineHint,
      desc: t.lifelineHintDesc,
      used: usedHint,
      disabled: phase !== "playing" || usedHint,
      onClick: useHint,
    },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-3 md:px-5 md:py-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="hotseat-status text-[#c9a227]">{t.brand}</span>
          <span className="hotseat-status">
            {displayName} · {t.questionOf(step, TOTAL_QUESTIONS)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hotseat-status">
            {t.playingFor}:{" "}
            <strong className="text-[#fbbf24]">{formatPrize(prizeNow)}</strong>
          </span>
          <span className="hotseat-status">
            {t.guaranteed}: <strong>{formatPrize(banked)}</strong>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={phase !== "playing" || index === 0}
            onClick={walkAway}
            className="rounded-full border-[#d4d4d8]/50 bg-black text-xs text-white"
          >
            {t.walkAway}
          </Button>
          <Link
            href="/play"
            className="text-xs text-[#a1a1aa] underline-offset-2 hover:underline"
          >
            {t.backToLobby}
          </Link>
        </div>
      </header>

      <div className="grid flex-1 items-start gap-3 lg:grid-cols-[180px_minmax(0,1fr)_72px]">
        <aside className="hotseat-ladder order-3 p-2 lg:order-1 lg:sticky lg:top-3">
          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#c9a227]">
            {t.moneyLadder}
          </p>
          <MoneyLadder
            currentStep={ended ? answeredCount || step : step}
            answeredCount={answeredCount}
          />
        </aside>

        <section className="order-1 flex flex-col gap-3 lg:order-2">
          <div className="lg:hidden">
            <LifelinesBar
              title={t.lifelinesTitle}
              orientation="horizontal"
              items={lifelineItems}
            />
          </div>

          {hintTip ? (
            <p className="rounded-full border border-[#c9a227]/50 bg-black px-5 py-2.5 text-center text-sm text-[#fbbf24]">
              <span className="font-semibold">{t.lifelineHint}: </span>
              {hintTip}
            </p>
          ) : null}

          {phoneLoading ? (
            <p className="rounded-full border border-[#e8e8ed]/40 bg-black px-5 py-2.5 text-center text-sm text-[#93c5fd]">
              {t.phoneCalling}
            </p>
          ) : null}

          {phoneTip ? (
            <p className="rounded-full border border-[#e8e8ed]/40 bg-black px-5 py-2.5 text-center text-sm text-[#93c5fd]">
              <span className="font-semibold">{t.friendSays}: </span>
              {phoneTip}
            </p>
          ) : null}

          <div className="hotseat-stage flex flex-1 flex-col justify-end pb-2 pt-6 md:pt-10">
            <div className="hotseat-question">
              {question.passage ? (
                <p className="mb-2 whitespace-pre-wrap text-left text-xs text-[#d4d4d8] md:text-sm">
                  {question.passage}
                </p>
              ) : null}
              <p className="text-base font-medium leading-snug text-white md:text-xl">
                {question.stem}
              </p>
            </div>

            <div className="hotseat-answers">
              {question.choices.map((choice, i) => (
                <AnswerButton
                  key={choice.id}
                  letter={`${i + 1}`}
                  choice={choice}
                  hidden={hiddenIds.has(choice.id)}
                  selected={selectedId === choice.id}
                  phase={phase}
                  disabled={phase !== "playing" || hiddenIds.has(choice.id)}
                  onSelect={() => setSelectedId(choice.id)}
                />
              ))}
            </div>
          </div>

          {!ended ? (
            <div className="flex justify-center pt-1">
              <Button
                size="lg"
                disabled={!selectedId || phase !== "playing"}
                onClick={lockAnswer}
                className="min-w-[200px] rounded-full border border-[#e8e8ed] bg-[#c9a227] text-black hover:bg-[#dbb42c]"
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
                  ? "text-[#34d399]"
                  : "text-[#f87171]",
              )}
            >
              {question.choices.find((c) => c.id === selectedId)?.isCorrect
                ? t.correct
                : t.incorrect}
              {question.explanation ? ` — ${question.explanation}` : ""}
            </p>
          ) : null}
        </section>

        <aside className="order-2 hidden justify-self-center pt-8 lg:order-3 lg:flex lg:sticky lg:top-8">
          <LifelinesBar orientation="vertical" items={lifelineItems} />
        </aside>
      </div>

      {ended ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#c9a227]/50 bg-[#020617] p-6 text-center shadow-[0_0_40px_rgb(201_162_39_/_20%)]">
            <p className="text-sm text-[#c9a227]">{t.brand}</p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {phase === "won"
                ? t.youWin
                : phase === "walked"
                  ? t.walkedAway
                  : t.gameOver}
            </h2>
            <p className="mt-3 text-[#a1a1aa]">
              {t.youTakeHome}:{" "}
              <span className="text-xl font-bold text-[#fbbf24]">
                {formatPrize(takeHome)}
              </span>
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={playAgain}
                className="rounded-full bg-[#c9a227] text-black hover:bg-[#dbb42c]"
              >
                {t.playAgain}
              </Button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-[#d4d4d8]/50 px-4 py-2 text-sm text-white"
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
      <span className="hotseat-letter">{letter}.</span>
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
