import { useCallback, useEffect, useRef, useState } from "react";
import { gameApi } from "../services/api";
import {
  TARGET_QUESTIONS,
  QUESTION_TRIGGER_MIN,
  QUESTION_TRIGGER_MAX,
  OBSTACLE_STOP_DIST,
  JUMP_SCROLL_BOOST,
  HIT_PASS_OFFSET,
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

const SYNC_MS = 90;

export function useGameManager() {
  const [snap, setSnap] = useState<GameSnapshot>({
    phase: "loading",
    state: null,
    animState: "idle",
    scrollZ: 0,
    obstacles: [],
    jumpHeight: 0,
    activeObstacleId: null,
    stoppedAtObstacle: false,
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
  const lastSyncMs = useRef(0);
  const initRef = useRef(false);
  const fetchingQ = useRef(false);
  const lastFetchMs = useRef(0);
  const hitRecoverT = useRef(0);
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
  const gameOverRef = useRef(false);
  const bumpTargetRef = useRef<number | null>(null);
  const stoppedAtObstacleRef = useRef(false);
  const stoppedLatchRef = useRef(false);

  const patch = useCallback((partial: Partial<GameSnapshot>) => {
    setSnap((s) => ({ ...s, ...partial }));
  }, []);

  const syncSnap = useCallback(
    (force = false) => {
      const now = performance.now();
      if (!force && now - lastSyncMs.current < SYNC_MS) return;
      lastSyncMs.current = now;
      setSnap((s) => ({
        ...s,
        phase: phaseRef.current,
        animState: animRef.current,
        scrollZ: scrollRef.current,
        obstacles: obstaclesRef.current,
        jumpHeight: jumpHeightRef.current,
        activeObstacleId: activeObstacleRef.current,
        stoppedAtObstacle: stoppedLatchRef.current,
        state: stateRef.current ? { ...stateRef.current } : null,
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
    },
    []
  );

  const init = useCallback(async () => {
    const res = await gameApi.newGame();
    sessionRef.current = res.session_id;
    stateRef.current = res.game_state;
    speedRef.current = res.game_state.speed;
    phaseRef.current = "running";
    animRef.current = "run";
    gameOverRef.current = false;
    obstacleMgr.current.reset();
    resolvedObstacles.current.clear();
    activeObstacleRef.current = null;
    stoppedAtObstacleRef.current = false;
    stoppedLatchRef.current = false;
    syncSnap(true);
  }, [syncSnap]);

  const fetchQuestion = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid || fetchingQ.current || stateRef.current?.current_question) return;
    const now = performance.now();
    if (now - lastFetchMs.current < 500) return;
    lastFetchMs.current = now;
    fetchingQ.current = true;
    try {
      const res = await gameApi.generateQuestion(sid);
      stateRef.current = res.game_state;
      speedRef.current = res.game_state.speed;
    } catch (err) {
      console.error("generate-question failed:", err);
    } finally {
      fetchingQ.current = false;
      syncSnap(true);
    }
  }, [syncSnap]);

  const prefetchQuestion = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid || fetchingQ.current || stateRef.current?.current_question) return;
    await fetchQuestion();
  }, [fetchQuestion]);

  const boot = useCallback(async () => {
    await init();
    void prefetchQuestion();
  }, [init, prefetchQuestion]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    boot().catch(console.error);
  }, [boot]);

  const resolveAnswer = useCallback(
    async (selectedIndex: number) => {
      const state = stateRef.current;
      const sid = sessionRef.current;
      const obsId = activeObstacleRef.current;
      if (!state?.current_question || !sid || submittingRef.current) return;

      submittingRef.current = true;
      syncSnap(true);

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
          if (obsId != null) {
            const obs = obstaclesRef.current.find((o) => o.id === obsId);
            if (obs) bumpTargetRef.current = obs.z + HIT_PASS_OFFSET;
            obstaclesRef.current = obstaclesRef.current.map((o) =>
              o.id === obsId ? { ...o, cleared: true } : o
            );
            resolvedObstacles.current.add(obsId);
          }
        }

        activeObstacleRef.current = null;
        stoppedLatchRef.current = false;
        patch({ answerFeedback: feedback });

        window.setTimeout(() => {
          patch({ answerFeedback: null });
          flashRef.current = null;
        }, 320);

        if (res.game_state.game_over && !gameOverRef.current) {
          gameOverRef.current = true;
          animRef.current =
            res.game_state.questions_answered >= TARGET_QUESTIONS
              ? "celebrate"
              : "gameover";
          phaseRef.current = "gameover";
          gameApi.evaluate(res.game_state.session_id).then((r) => {
            patch({ evaluation: r.evaluation });
          });
        }

        void prefetchQuestion();
      } catch (err) {
        console.error("check-answer failed:", err);
      } finally {
        submittingRef.current = false;
        syncSnap(true);
      }
    },
    [patch, syncSnap]
  );

  const resolveAnswerRef = useRef(resolveAnswer);
  useEffect(() => {
    resolveAnswerRef.current = resolveAnswer;
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

      if (phase === "running") {
        const hasQuestion = Boolean(stateRef.current?.current_question);
        const isJumping = jumpSys.current.isActive();
        const isHitting =
          hitRecoverT.current > 0 ||
          animRef.current === "hit" ||
          animRef.current === "recover";
        let spd = speedRef.current * (isHitting ? HIT_SLOW_FACTOR : 1);

        let z = scrollRef.current;

        const spawn = obstacleMgr.current.trySpawn(
          z,
          stateRef.current?.questions_answered ?? 0
        );
        if (spawn) {
          obstaclesRef.current = [...obstaclesRef.current, spawn];
        }
        obstaclesRef.current = obstacleMgr.current.prune(z, obstaclesRef.current);

        const findNextObstacle = (atZ: number) =>
          obstaclesRef.current
            .filter((o) => !o.cleared && !resolvedObstacles.current.has(o.id))
            .map((o) => ({ o, dist: o.z - atZ }))
            .filter(({ dist }) => dist > 0.4 && dist < QUESTION_TRIGGER_MAX)
            .sort((a, b) => a.dist - b.dist)[0];

        const nextObstacle = findNextObstacle(z);
        const nearStop =
          nextObstacle != null &&
          nextObstacle.dist <= OBSTACLE_STOP_DIST + 2;

        const activeObs =
          activeObstacleRef.current != null
            ? obstaclesRef.current.find((o) => o.id === activeObstacleRef.current)
            : nextObstacle?.o;

        let newZ = z;
        const prevZ = newZ;

        if (isJumping) {
          newZ += spd * JUMP_SCROLL_BOOST * delta;
        } else if (
          (activeObs || nearStop) &&
          (hasQuestion || submittingRef.current || nearStop) &&
          !isHitting &&
          !isJumping
        ) {
          const obs = activeObs ?? nextObstacle?.o;
          if (obs) {
            const stopZ = obs.z - OBSTACLE_STOP_DIST;
            if (newZ < stopZ) newZ += nearStop && !hasQuestion ? spd * 0.15 * delta : spd * delta;
            newZ = Math.min(newZ, stopZ);
            if (newZ >= stopZ - 0.05) animRef.current = "idle";
            if (!activeObstacleRef.current) activeObstacleRef.current = obs.id;
          }
        } else if (activeObs && !hasQuestion && !isHitting && !isJumping) {
          const stopZ = activeObs.z - OBSTACLE_STOP_DIST;
          const dist = activeObs.z - newZ;
          if (dist <= OBSTACLE_STOP_DIST + 1) {
            newZ = Math.min(newZ, stopZ);
            animRef.current = "idle";
          } else if (dist < OBSTACLE_STOP_DIST + 12) {
            newZ += spd * 0.22 * delta;
          } else {
            newZ += spd * delta;
          }
        } else if (bumpTargetRef.current != null && newZ < bumpTargetRef.current) {
          newZ += spd * 0.65 * delta;
          if (newZ >= bumpTargetRef.current) {
            newZ = bumpTargetRef.current;
            bumpTargetRef.current = null;
          }
        } else if (!isHitting) {
          newZ += spd * delta;
        } else if (bumpTargetRef.current != null) {
          newZ += spd * delta;
          if (newZ >= bumpTargetRef.current) {
            newZ = bumpTargetRef.current;
            bumpTargetRef.current = null;
          }
        }

        scrollRef.current = newZ;
        z = scrollRef.current;

        const stopObs =
          activeObstacleRef.current != null
            ? obstaclesRef.current.find((o) => o.id === activeObstacleRef.current)
            : null;
        if (
          stopObs &&
          !jumpSys.current.isActive() &&
          hitRecoverT.current <= 0 &&
          animRef.current !== "hit" &&
          animRef.current !== "recover"
        ) {
          const stopZ = stopObs.z - OBSTACLE_STOP_DIST;
          const dist = stopObs.z - z;
          stoppedAtObstacleRef.current =
            dist <= OBSTACLE_STOP_DIST + 0.35 && z >= stopZ - 0.15;
        } else {
          stoppedAtObstacleRef.current = false;
        }

        if (activeObstacleRef.current && stoppedAtObstacleRef.current) {
          stoppedLatchRef.current = true;
        }
        if (!activeObstacleRef.current) {
          stoppedLatchRef.current = false;
        }

        if (
          nextObstacle &&
          activeObstacleRef.current == null &&
          !submittingRef.current &&
          !jumpSys.current.isActive() &&
          (nextObstacle.dist > QUESTION_TRIGGER_MIN || nearStop)
        ) {
          activeObstacleRef.current = nextObstacle.o.id;
        }

        if (
          activeObstacleRef.current != null &&
          !stateRef.current?.current_question &&
          !submittingRef.current &&
          !fetchingQ.current &&
          nearStop
        ) {
          void fetchQuestion();
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
          if (hitRecoverT.current <= 0) {
            animRef.current = "recover";
            window.setTimeout(() => {
              if (animRef.current === "recover") animRef.current = "run";
            }, 100);
          }
        } else if (
          !["jump_start", "jump", "jump_land", "hit", "recover", "idle", "celebrate", "gameover"].includes(
            animRef.current
          )
        ) {
          animRef.current = "run";
        }

        if (stateRef.current && !gameOverRef.current) {
          const finished = stateRef.current.questions_answered >= TARGET_QUESTIONS;
          const moved = newZ - prevZ;
          if (finished && !stateRef.current.game_over) {
            stateRef.current = { ...stateRef.current, game_over: true };
            gameOverRef.current = true;
            animRef.current = "celebrate";
            phaseRef.current = "gameover";
            gameApi.evaluate(stateRef.current.session_id).then((r) => {
              patch({ evaluation: r.evaluation as PerformanceEvaluation });
            });
          } else {
            stateRef.current = {
              ...stateRef.current,
              distance: stateRef.current.distance + moved,
              speed: moved > 0.001 ? moved / delta : 0,
            };
          }
        }
      }

      syncSnap();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fetchQuestion, syncSnap, patch]);

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
    stoppedAtObstacleRef.current = false;
    stoppedLatchRef.current = false;
    comboRef.current = 0;
    bumpTargetRef.current = null;
    hitRecoverT.current = 0;
    fetchingQ.current = false;
    submittingRef.current = false;
    gameOverRef.current = false;
    phaseRef.current = "running";
    animRef.current = "run";
    patch({ evaluation: null, answerFeedback: null });
    syncSnap(true);
    void prefetchQuestion();
  }, [patch, syncSnap, prefetchQuestion]);

  return { ...snap, answer, restart };
}
