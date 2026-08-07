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
import {
  appendHotseatHistory,
  clearHotseatSession,
  loadHotseatHistory,
  loadHotseatSession,
  type HotseatReviewItem,
} from "./session";
import { ReviewPanel } from "./ReviewPanel";
import { APP_BASE_PATH } from "@/lib/api-url";

const KRUMAM_HOST = `${APP_BASE_PATH}/assets/img-design-about/krumam.png`;

type Phase =
  | "playing"
  | "locked"
  | "revealed"
  | "explained"
  | "won"
  | "lost"
  | "walked";

type HotseatTranslation = {
  stemTh: string;
  passageTh: string | null;
  choicesTh: { choiceId: string; labelTh: string }[];
};

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
  const [translation, setTranslation] = useState<HotseatTranslation | null>(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [showStemTh, setShowStemTh] = useState(false);
  const [showChoiceTh, setShowChoiceTh] = useState<Set<string>>(() => new Set());
  const [history, setHistory] = useState<HotseatReviewItem[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    selectedLabel: string;
    correctLabel: string;
    explanation: string;
  } | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  useEffect(() => {
    const session = loadHotseatSession();
    if (!session) {
      router.replace("/play");
      return;
    }
    setDisplayName(session.displayName);
    setLobbyDifficulty(session.difficulty);
    setDeck(buildHotseatDeck(session.difficulty));
    setHistory(loadHotseatHistory());
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
    setTranslation(null);
    setShowStemTh(false);
    setShowChoiceTh(new Set());
    setLastResult(null);
    setExplainLoading(false);
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

  async function ensureTranslation(): Promise<HotseatTranslation | null> {
    if (!question) return null;
    if (translation) return translation;
    setTranslateLoading(true);
    try {
      const res = await fetch("/api/toeic-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stem: question.stem,
          passage: question.passage,
          choices: question.choices.map((c) => ({ id: c.id, label: c.label })),
        }),
        signal: AbortSignal.timeout(30_000),
      });
      const payload = (await res.json().catch(() => null)) as HotseatTranslation & {
        error?: string;
      } | null;
      if (!res.ok || !payload?.stemTh) {
        throw new Error(payload?.error || t.translationFailed);
      }
      const next: HotseatTranslation = {
        stemTh: payload.stemTh,
        passageTh: payload.passageTh ?? null,
        choicesTh: payload.choicesTh ?? [],
      };
      setTranslation(next);
      return next;
    } catch {
      setPhoneTip(t.translationFailed);
      return null;
    } finally {
      setTranslateLoading(false);
    }
  }

  async function toggleStemTh() {
    if (showStemTh) {
      setShowStemTh(false);
      return;
    }
    const data = await ensureTranslation();
    if (data) setShowStemTh(true);
  }

  async function toggleChoiceTh(choiceId: string) {
    if (showChoiceTh.has(choiceId)) {
      setShowChoiceTh((prev) => {
        const next = new Set(prev);
        next.delete(choiceId);
        return next;
      });
      return;
    }
    const data = await ensureTranslation();
    if (!data) return;
    setShowChoiceTh((prev) => new Set(prev).add(choiceId));
  }

  function choiceLabelTh(choiceId: string): string | null {
    return translation?.choicesTh.find((c) => c.choiceId === choiceId)?.labelTh ?? null;
  }

  async function translateExplanation(english: string): Promise<string | null> {
    try {
      const res = await fetch("/api/toeic-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "explanation",
          explanation: english,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const payload = (await res.json().catch(() => null)) as {
        explanationTh?: string;
        error?: string;
      } | null;
      if (!res.ok || !payload?.explanationTh?.trim()) return null;
      return payload.explanationTh.trim();
    } catch {
      return null;
    }
  }

  function lockAnswer() {
    if (!selectedId || !question || phase !== "playing") return;
    setPhase("locked");
    window.setTimeout(() => {
      void (async () => {
        const selected = question.choices.find((c) => c.id === selectedId);
        const correct = question.choices.find((c) => c.isCorrect);
        if (!selected || !correct) {
          setPhase("playing");
          return;
        }
        const ok = Boolean(selected.isCorrect);
        const explanationEn =
          question.explanation?.trim() ||
          `The correct answer is “${correct.label}” because it fits the sentence context and grammar.`;
        const explanationFallbackTh = `คำตอบที่ถูกคือ “${correct.label}” เพราะเข้ากับบริบทและไวยากรณ์ของประโยค`;

        let explanationTh =
          question.explanationTh?.trim() ||
          (isTh ? explanationFallbackTh : null);

        if (isTh && !question.explanationTh?.trim() && question.explanation?.trim()) {
          setExplainLoading(true);
          const translated = await translateExplanation(explanationEn);
          setExplainLoading(false);
          if (translated) explanationTh = translated;
        }

        const explanation = isTh
          ? explanationTh || explanationFallbackTh
          : explanationEn;

        const item: HotseatReviewItem = {
          step,
          questionId: question.id,
          stem: question.stem,
          passage: question.passage,
          selectedId: selected.id,
          selectedLabel: selected.label,
          correctId: correct.id,
          correctLabel: correct.label,
          isCorrect: ok,
          explanation: explanationEn,
          explanationTh: explanationTh,
          score: PRIZE_LADDER[index]?.amount ?? 0,
          at: Date.now(),
        };
        setHistory(appendHotseatHistory(item));
        setLastResult({
          isCorrect: ok,
          selectedLabel: selected.label,
          correctLabel: correct.label,
          explanation,
        });
        setPhase("explained");
      })();
    }, 900);
  }

  function continueAfterExplain() {
    if (!lastResult) return;
    if (lastResult.isCorrect) {
      if (index + 1 >= TOTAL_QUESTIONS) {
        setPhase("won");
      } else {
        setIndex((i) => i + 1);
        resetQuestionUi();
      }
    } else {
      setPhase("lost");
    }
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
  const choicesLocked = phase !== "playing";
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
    <div className="relative mx-auto flex min-h-[calc(100dvh-5.5rem)] w-full max-w-7xl flex-1 flex-col gap-2 px-3 pb-3 pt-2 md:px-5">
      <header className="z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="hotseat-status text-[#c9a227]">{t.brand}</span>
          <span className="hotseat-status">
            {displayName} · {t.questionOf(step, TOTAL_QUESTIONS)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hotseat-status">
            {t.playingFor}:{" "}
            <strong className="text-[#fbbf24]">
              {formatPrize(prizeNow)} {t.scorePts}
            </strong>
          </span>
          <span className="hotseat-status">
            {t.guaranteed}:{" "}
            <strong>
              {formatPrize(banked)} {t.scorePts}
            </strong>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReviewOpen(true)}
            className="rounded-full border-[#c9a227]/60 bg-black text-xs text-[#c9a227]"
          >
            {t.reviewAnswers}
            {history.length > 0 ? ` (${history.length})` : ""}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[160px_minmax(0,1fr)_72px]">
        <aside className="hotseat-ladder order-3 max-h-[40vh] overflow-y-auto p-2 lg:order-1 lg:max-h-none lg:self-start">
          <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#c9a227]">
            {t.moneyLadder}
          </p>
          <MoneyLadder
            currentStep={ended ? answeredCount || step : step}
            answeredCount={answeredCount}
          />
        </aside>

        <section className="order-1 relative flex min-h-[58vh] flex-col lg:order-2 lg:min-h-0">
          <div className="absolute right-0 top-0 z-20 lg:hidden">
            <LifelinesBar orientation="horizontal" items={lifelineItems} />
          </div>

          {/* Host (krumam) — fills center like the TV show */}
          <div className="hotseat-host pointer-events-none absolute inset-x-0 top-0 bottom-[11.5rem] z-0 flex items-end justify-end sm:bottom-[12.5rem] md:bottom-[13.5rem]">
            <img
              src={KRUMAM_HOST}
              alt="krumam"
              className="h-full max-h-[min(58vh,520px)] w-auto max-w-[min(92%,420px)] object-contain object-bottom drop-shadow-[0_12px_40px_rgb(0_0_0_/_55%)]"
            />
          </div>

          <div className="relative z-10 mx-auto mt-2 flex w-full max-w-3xl flex-col gap-2 px-1">
            {hintTip ? (
              <p className="rounded-full border border-[#c9a227]/50 bg-black/85 px-5 py-2 text-center text-sm text-[#fbbf24] backdrop-blur-sm">
                <span className="font-semibold">{t.lifelineHint}: </span>
                {hintTip}
              </p>
            ) : null}
            {phoneLoading ? (
              <p className="rounded-full border border-[#e8e8ed]/40 bg-black/85 px-5 py-2 text-center text-sm text-[#93c5fd] backdrop-blur-sm">
                {t.phoneCalling}
              </p>
            ) : null}
            {phoneTip ? (
              <p className="rounded-full border border-[#e8e8ed]/40 bg-black/85 px-5 py-2 text-center text-sm text-[#93c5fd] backdrop-blur-sm">
                <span className="font-semibold">{t.friendSays}: </span>
                {phoneTip}
              </p>
            ) : null}
          </div>

          {/* Question + answers pinned to bottom of stage */}
          <div className="hotseat-stage relative z-10 mt-auto flex flex-col justify-end pb-1 pt-2">
            <div className="hotseat-question relative">
              <div className="absolute right-2 top-2 z-10 sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
                <InlineTranslateBtn
                  active={showStemTh}
                  loading={translateLoading && !showStemTh}
                  label={showStemTh ? t.showEnglish : t.translateTh}
                  onClick={() => void toggleStemTh()}
                />
              </div>
              {question.passage ? (
                <p className="mb-2 whitespace-pre-wrap pr-12 text-left text-xs text-[#d4d4d8] md:text-sm">
                  {showStemTh && translation?.passageTh
                    ? translation.passageTh
                    : question.passage}
                </p>
              ) : null}
              <p className="px-2 text-base font-medium leading-snug text-white md:px-8 md:text-xl">
                {showStemTh && translation?.stemTh
                  ? translation.stemTh
                  : question.stem}
              </p>
            </div>

            <div className="hotseat-answers">
              {question.choices.map((choice, i) => (
                <AnswerButton
                  key={choice.id}
                  letter={`${i + 1}`}
                  choice={choice}
                  labelTh={
                    showChoiceTh.has(choice.id)
                      ? choiceLabelTh(choice.id)
                      : null
                  }
                  hidden={hiddenIds.has(choice.id)}
                  selected={selectedId === choice.id}
                  phase={phase}
                  disabled={choicesLocked || hiddenIds.has(choice.id)}
                  translateActive={showChoiceTh.has(choice.id)}
                  translateLoading={
                    translateLoading && !showChoiceTh.has(choice.id)
                  }
                  onTranslate={() => void toggleChoiceTh(choice.id)}
                  onSelect={() => setSelectedId(choice.id)}
                  translateLabel={
                    showChoiceTh.has(choice.id) ? t.showEnglish : t.translateTh
                  }
                />
              ))}
            </div>

            {phase === "explained" && lastResult ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-[#c9a227]/45 bg-black/85 px-4 py-3 backdrop-blur-sm">
                <p
                  className={cn(
                    "text-center text-sm font-bold",
                    lastResult.isCorrect ? "text-[#34d399]" : "text-[#f87171]",
                  )}
                >
                  {lastResult.isCorrect ? t.correct : t.incorrect}
                </p>
                <p className="text-xs text-[#a1a1aa]">
                  {t.yourAnswer}:{" "}
                  <span
                    className={
                      lastResult.isCorrect ? "text-[#34d399]" : "text-[#f87171]"
                    }
                  >
                    {lastResult.selectedLabel}
                  </span>
                </p>
                <p className="text-xs text-[#a1a1aa]">
                  {t.correctAnswer}:{" "}
                  <span className="text-[#34d399]">{lastResult.correctLabel}</span>
                </p>
                <p className="rounded-xl border border-[#c9a227]/35 bg-[#c9a227]/10 px-3 py-2 text-sm text-[#fbbf24]">
                  <span className="font-semibold">{t.whyCorrect}: </span>
                  {explainLoading ? t.loading : lastResult.explanation}
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <Button
                    size="lg"
                    onClick={continueAfterExplain}
                    className="min-w-[180px] rounded-full border border-[#e8e8ed] bg-[#c9a227] text-black hover:bg-[#dbb42c]"
                  >
                    {lastResult.isCorrect && index + 1 < TOTAL_QUESTIONS
                      ? t.nextQuestion
                      : t.continue}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReviewOpen(true)}
                    className="rounded-full border-[#d4d4d8]/50 bg-black text-white"
                  >
                    {t.reviewAnswers}
                  </Button>
                </div>
              </div>
            ) : null}

            {!ended && phase === "playing" ? (
              <div className="flex justify-center pt-3">
                <Button
                  size="lg"
                  disabled={!selectedId}
                  onClick={lockAnswer}
                  className="min-w-[200px] rounded-full border border-[#e8e8ed] bg-[#c9a227] text-black hover:bg-[#dbb42c]"
                >
                  {t.finalAnswer}
                </Button>
              </div>
            ) : null}

            {phase === "locked" ? (
              <p className="pt-3 text-center text-sm text-[#c9a227]">{t.revealing}</p>
            ) : null}
          </div>
        </section>

        <aside className="order-2 hidden self-start pt-6 lg:order-3 lg:flex">
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
                {formatPrize(takeHome)} {t.scorePts}
              </span>
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={playAgain}
                className="rounded-full bg-[#c9a227] text-black hover:bg-[#dbb42c]"
              >
                {t.playAgain}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewOpen(true)}
                className="rounded-full border-[#c9a227]/50 bg-black text-[#c9a227]"
              >
                {t.reviewAnswers}
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

      <ReviewPanel
        open={reviewOpen}
        items={history}
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}

function InlineTranslateBtn({
  active,
  loading,
  label,
  onClick,
}: {
  active: boolean;
  loading?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={loading}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border bg-black text-[10px] font-bold tracking-wide transition",
        "border-[#c9a227] text-[#c9a227] hover:enabled:bg-[#c9a227]/15",
        "disabled:cursor-wait disabled:opacity-60",
        active && "border-[#5bc0ff] text-[#5bc0ff]",
      )}
    >
      {loading ? "…" : "TH"}
    </button>
  );
}

function AnswerButton({
  letter,
  choice,
  labelTh,
  hidden,
  selected,
  phase,
  disabled,
  translateActive,
  translateLoading,
  translateLabel,
  onTranslate,
  onSelect,
}: {
  letter: string;
  choice: HotseatChoice;
  labelTh: string | null;
  hidden: boolean;
  selected: boolean;
  phase: Phase;
  disabled: boolean;
  translateActive: boolean;
  translateLoading?: boolean;
  translateLabel: string;
  onTranslate: () => void;
  onSelect: () => void;
}) {
  if (hidden) {
    return <div className="hotseat-choice opacity-20" aria-hidden />;
  }

  const revealed =
    phase === "explained" ||
    phase === "won" ||
    phase === "lost" ||
    phase === "locked";
  const showCorrect = (phase === "explained" || phase === "won" || phase === "lost") && choice.isCorrect;
  const showWrong =
    (phase === "explained" || phase === "won" || phase === "lost") &&
    selected &&
    !choice.isCorrect;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          "hotseat-choice group w-full pr-11 text-left",
          selected && !revealed && "millionaire-choice-selected hotseat-choice-selected",
          showCorrect && "hotseat-choice-correct",
          showWrong && "hotseat-choice-wrong",
        )}
      >
        <span className="hotseat-letter">{letter}.</span>
        <span className="flex-1">
          {labelTh ?? choice.label}
        </span>
      </button>
      <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
        <InlineTranslateBtn
          active={translateActive}
          loading={translateLoading}
          label={translateLabel}
          onClick={onTranslate}
        />
      </div>
    </div>
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
