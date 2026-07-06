import { useCallback, useEffect, useRef, useState } from "react";
import { gameApi } from "../services/api";
import {
  TARGET_QUESTIONS,
  QUESTION_ANSWER_SEC,
  COUNTDOWN_SEC,
  QUESTION_TRIGGER_MIN,
  QUESTION_TRIGGER_MAX,
  OBSTACLE_CLEAR_Z,
  HIT_RECOVER_SEC,
  HIT_SLOW_FACTOR,
  CORRECT_SPEED_BOOST,
  WRONG_SPEED_PENALTY,
} from "../game/constants";
import { ObstacleManager } from "../game/managers/ObstacleManager";
import { AutoJumpSystem } from "../game/managers/AutoJumpSystem";
import { audioManager } from "../game/managers/AudioManager";
import type {
  AnimState,
  AnswerFeedback,
  GamePhase,
  GameSnapshot,
  Obstacle,
  VisualFx,
} from "../game/types";
import type { GameState, PerformanceEvaluation } from "../types";

const EMPTY_FX: VisualFx = {
  flash: null,
  shake: 0,
  slowMo: 0,
  speedLines: false,
  landingBurst: false,
};

export function useGameManager() {
  const [snap, setSnap] = useState<GameSnapshot>({
    phase: "loading",
    state: null,
    animState: "idle",
    scrollZ: 0,
    obstacles: [],
    jumpHeight: 0,
    questionTimeLeft: null,
    activeObstacleId: null,
    evaluation: null,
    submitting: false,
    fx: EMPTY_FX,
    answerFeedback: null,
    combo: 0,
  });

  const obstacleMgr = useRef(new ObstacleManager());
  const jumpSys = useRef(new AutoJumpSystem());
  const sessionRef = useRef<string | null>(null);
  const scrollRef = useRef(0);
  const speedRef = useRef(8);
  const rafRef = useRef(0);
  const lastTime = useRef(performance.now());
  const initRef = useRef(false);
  const fetchingQ = useRef(false);
  const hitRecoverT = useRef(0);
  const countdownT = useRef(COUNTDOWN_SEC);
  const questionDeadline = useRef<number | null>(null);
  const activeObstacleRef = useRef<number | null>(null);
  const resolvedObstacles = useRef(new Set<number>());
  const jumpHeightRef = useRef(0);
  const comboRef = useRef(0);
  const slowMoRef = useRef(0);
  const shakeRef = useRef(0);
  const flashRef = useRef<VisualFx["flash"]>(null);
  const speedLinesRef = useRef(false);
  const landingBurstRef = useRef(false);
  const phaseRef = useRef<GamePhase>("loading");
  const animRef = useRef<AnimState>("idle");
  const stateRef = useRef<GameState | null>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const submittingRef = useRef(false);

  const patch = useCallback((partial: Partial<GameSnapshot>) => {
    setSnap((s) => ({ ...s, ...partial }));
  }, []);

  const syncSnap = useCallback(() => {
    setSnap((s) => ({
      ...s,
      phase: phaseRef.current,
      animState: animRef.current,
      scrollZ: scrollRef.current,
      obstacles: obstaclesRef.current,
      jumpHeight: jumpHeightRef.current,
      questionTimeLeft: questionDeadline.current
        ? Math.max(0, questionDeadline.current - performance.now() / 1000)
        : null,
      activeObstacleId: activeObstacleRef.current,
      state: stateRef.current,
      submitting: submittingRef.current,
      combo: comboRef.current,
      fx: {
        flash: flashRef.current,
        shake: shakeRef.current,
        slowMo: slowMoRef.current,
        speedLines: speedLinesRef.current,
        landingBurst: landingBurstRef.current,
      },
    }));
  }, []);

  const init = useCallback(async () => {
    const res = await gameApi.newGame();
    sessionRef.current = res.session_id;
    stateRef.current = res.game_state;
    speedRef.current = res.game_state.speed;
    phaseRef.current = "countdown";
    animRef.current = "countdown";
    countdownT.current = COUNTDOWN_SEC;
    obstacleMgr.current.reset();
    resolvedObstacles.current.clear();
    syncSnap();
  }, [syncSnap]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    init().catch(console.error);
  }, [init]);

  const fetchQuestion = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid || fetchingQ.current || stateRef.current?.current_question) return;
    fetchingQ.current = true;
    try {
      const res = await gameApi.generateQuestion(sid);
      stateRef.current = res.game_state;
      speedRef.current = res.game_state.speed;
      questionDeadline.current = performance.now() / 1000 + QUESTION_ANSWER_SEC;
    } finally {
      fetchingQ.current = false;
      syncSnap();
    }
  }, [syncSnap]);

  const resolveAnswer = useCallback(
    async (selectedIndex: number) => {
      const state = stateRef.current;
      const sid = sessionRef.current;
      const obsId = activeObstacleRef.current;
      if (!state?.current_question || !sid || submittingRef.current) return;

      submittingRef.current = true;
      questionDeadline.current = null;
      syncSnap();

      try {
        const res = await gameApi.checkAnswer(
          state.session_id,
          state.current_question.id,
          selectedIndex
        );
        stateRef.current = res.game_state;
        speedRef.current = res.game_state.speed;
        const correct = res.correct;
        const feedback: AnswerFeedback = { selectedIndex, correct };

        if (correct) {
          comboRef.current += 1;
          speedRef.current *= CORRECT_SPEED_BOOST;
          audioManager.playSuccess();
          audioManager.playJump();
          flashRef.current = "green";
          speedLinesRef.current = true;
          shakeRef.current = 0;
          if (obsId != null) {
            jumpSys.current.start(obsId);
            obstaclesRef.current = obstaclesRef.current.map((o) =>
              o.id === obsId ? { ...o, cleared: true } : o
            );
            resolvedObstacles.current.add(obsId);
          }
          animRef.current = "jump_start";
        } else {
          comboRef.current = 0;
          speedRef.current *= WRONG_SPEED_PENALTY;
          slowMoRef.current = 0.2;
          shakeRef.current = 0.45;
          flashRef.current = "red";
          audioManager.playHit();
          animRef.current = "hit";
          hitRecoverT.current = HIT_RECOVER_SEC;
          if (obsId != null) resolvedObstacles.current.add(obsId);
        }

        activeObstacleRef.current = null;
        patch({ answerFeedback: feedback });

        window.setTimeout(() => {
          patch({ answerFeedback: null });
          flashRef.current = null;
        }, 280);

        if (res.game_state.game_over) {
          if (res.game_state.questions_answered >= TARGET_QUESTIONS) {
            animRef.current = "celebrate";
          } else {
            animRef.current = "gameover";
          }
          phaseRef.current = "gameover";
          gameApi.evaluate(res.game_state.session_id).then((r) => {
            patch({ evaluation: r.evaluation });
          });
        }

        submittingRef.current = false;
        syncSnap();
      } catch {
        submittingRef.current = false;
        syncSnap();
      }
    },
    [patch, syncSnap]
  );

  const timeoutWrong = useCallback(() => {
    if (!stateRef.current?.current_question || submittingRef.current) return;
    void resolveAnswer(-1);
  }, [resolveAnswer]);

  useEffect(() => {
    const loop = (now: number) => {
      let delta = Math.min((now - lastTime.current) / 1000, 0.05);
      lastTime.current = now;

      if (slowMoRef.current > 0) {
        delta *= 0.35;
        slowMoRef.current = Math.max(0, slowMoRef.current - delta);
      }

      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - delta * 8);
      }
      if (speedLinesRef.current && !jumpSys.current.isActive()) {
        speedLinesRef.current = false;
      }
      if (landingBurstRef.current) {
        landingBurstRef.current = false;
      }

      const phase = phaseRef.current;

      if (phase === "countdown") {
        countdownT.current -= delta;
        animRef.current = "countdown";
        if (countdownT.current <= 0) {
          phaseRef.current = "running";
          animRef.current = "run";
          void fetchQuestion();
        }
      }

      if (phase === "running" || phase === "countdown") {
        const spd =
          phase === "running"
            ? speedRef.current * (hitRecoverT.current > 0 ? HIT_SLOW_FACTOR : 1)
            : 0;

        if (phase === "running") {
          scrollRef.current += spd * delta;
          const z = scrollRef.current;

          const spawn = obstacleMgr.current.trySpawn(
            z,
            stateRef.current?.questions_answered ?? 0
          );
          if (spawn) {
            obstaclesRef.current = [...obstaclesRef.current, spawn];
          }
          obstaclesRef.current = obstacleMgr.current.prune(z, obstaclesRef.current);

          const upcoming = obstaclesRef.current
            .filter((o) => !o.cleared && !resolvedObstacles.current.has(o.id))
            .map((o) => ({ o, dist: o.z - z }))
            .filter(({ dist }) => dist > QUESTION_TRIGGER_MIN && dist < QUESTION_TRIGGER_MAX)
            .sort((a, b) => a.dist - b.dist)[0];

          if (
            upcoming &&
            activeObstacleRef.current == null &&
            !stateRef.current?.current_question &&
            !submittingRef.current
          ) {
            activeObstacleRef.current = upcoming.o.id;
            void fetchQuestion();
          }

          if (questionDeadline.current && stateRef.current?.current_question) {
            const left = questionDeadline.current - now / 1000;
            if (left <= 0) timeoutWrong();
          }

          if (
            activeObstacleRef.current != null &&
            !jumpSys.current.isActive() &&
            hitRecoverT.current <= 0 &&
            animRef.current !== "hit"
          ) {
            const obs = obstaclesRef.current.find(
              (o) => o.id === activeObstacleRef.current
            );
            if (obs && z + OBSTACLE_CLEAR_Z >= obs.z && stateRef.current?.current_question) {
              timeoutWrong();
            }
          }
        }

        const jumpFrame = jumpSys.current.update(delta);
        if (jumpFrame) {
          jumpHeightRef.current = jumpFrame.height;
          animRef.current = jumpFrame.anim;
          if (jumpFrame.anim === "jump_land" && jumpFrame.progress > 0.9) {
            landingBurstRef.current = true;
            audioManager.playLand();
          }
          if (!jumpSys.current.isActive() && jumpFrame.anim === "run") {
            animRef.current = "run";
            jumpHeightRef.current = 0;
          }
        } else if (hitRecoverT.current > 0) {
          hitRecoverT.current -= delta;
          if (hitRecoverT.current <= 0) animRef.current = "recover";
          if (hitRecoverT.current <= 0) {
            window.setTimeout(() => {
              if (animRef.current === "recover") animRef.current = "run";
            }, 120);
          }
        } else if (
          !["jump_start", "jump", "jump_land", "hit", "celebrate", "gameover"].includes(
            animRef.current
          )
        ) {
          animRef.current = phase === "running" ? "run" : animRef.current;
        }

        if (stateRef.current) {
          const finished = stateRef.current.questions_answered >= TARGET_QUESTIONS;
          if (finished && !stateRef.current.game_over && phase === "running") {
            stateRef.current = { ...stateRef.current, game_over: true };
            animRef.current = "celebrate";
            phaseRef.current = "gameover";
            gameApi.evaluate(stateRef.current.session_id).then((r) => {
              patch({ evaluation: r.evaluation as PerformanceEvaluation });
            });
          } else if (phase === "running") {
            stateRef.current = {
              ...stateRef.current,
              distance: stateRef.current.distance + spd * delta,
              speed: spd,
            };
          }
        }
      }

      syncSnap();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fetchQuestion, timeoutWrong, syncSnap, patch]);

  const answer = useCallback(
    (index: number) => {
      audioManager.unlock();
      void resolveAnswer(index);
    },
    [resolveAnswer]
  );

  const restart = useCallback(async () => {
    const state = stateRef.current;
    if (!state) return;
    const s = await gameApi.reset(state.session_id);
    stateRef.current = s;
    speedRef.current = s.speed;
    scrollRef.current = 0;
    obstaclesRef.current = [];
    obstacleMgr.current.reset();
    resolvedObstacles.current.clear();
    jumpSys.current.reset();
    activeObstacleRef.current = null;
    questionDeadline.current = null;
    comboRef.current = 0;
    hitRecoverT.current = 0;
    phaseRef.current = "running";
    animRef.current = "run";
    patch({ evaluation: null, answerFeedback: null });
    syncSnap();
  }, [patch, syncSnap]);

  return { ...snap, answer, restart };
}
