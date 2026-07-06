import { useCallback, useEffect, useRef, useState } from "react";
import { gameApi } from "../services/api";
import { TARGET_QUESTIONS } from "../constants";
import type { AnimState, GamePhase, GameState, PerformanceEvaluation } from "../types";
import type { Obstacle } from "../three/ObstacleTrack";

const OBSTACLE_GAP = 7;
const QUESTION_TIMER_SEC = 9;
const FEEDBACK_MS = 1200;

export function useRunner3D() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [state, setState] = useState<GameState | null>(null);
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [scrollZ, setScrollZ] = useState(0);
  const [playerZ, setPlayerZ] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [evaluation, setEvaluation] = useState<PerformanceEvaluation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const nextObstacleId = useRef(1);
  const lastSpawnZ = useRef(0);
  const hitObstacles = useRef(new Set<number>());
  const fetching = useRef(false);
  const initRef = useRef(false);
  const rafRef = useRef<number>(0);
  const lastTime = useRef(performance.now());
  const scrollRef = useRef(0);
  const speedRef = useRef(8);
  const questionTimer = useRef(0);
  const sessionRef = useRef<string | null>(null);

  const init = useCallback(async () => {
    const res = await gameApi.newGame();
    setState(res.game_state);
    sessionRef.current = res.session_id;
    speedRef.current = res.game_state.speed;
    questionTimer.current = 0;
    setAnimState("run");
    setPhase("running");
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    init().catch(console.error);
  }, [init]);

  const fetchQuestion = useCallback(async (sessionId: string) => {
    if (fetching.current) return;
    fetching.current = true;
    setAnimState("idle");
    questionTimer.current = 0;
    try {
      const res = await gameApi.generateQuestion(sessionId);
      setState(res.game_state);
      speedRef.current = res.game_state.speed;
      setPhase("question");
    } finally {
      fetching.current = false;
    }
  }, []);

  useEffect(() => {
    if (phase !== "running") return;

    const loop = (now: number) => {
      const delta = Math.min((now - lastTime.current) / 1000, 0.05);
      lastTime.current = now;
      const spd = speedRef.current;

      scrollRef.current += spd * delta;
      const z = scrollRef.current;
      setScrollZ(z);
      setPlayerZ((pz) => pz + spd * delta * 0.15);

      questionTimer.current += delta;
      const sid = sessionRef.current;

      if (sid && questionTimer.current >= QUESTION_TIMER_SEC) {
        void fetchQuestion(sid);
      } else if (z - lastSpawnZ.current > OBSTACLE_GAP) {
        lastSpawnZ.current = z;
        const kinds: Obstacle["kind"][] = ["barrel", "cone", "crate"];
        const batch = 1 + (Math.random() > 0.6 ? 1 : 0);
        const newObs: Obstacle[] = [];
        for (let i = 0; i < batch; i++) {
          newObs.push({
            id: nextObstacleId.current++,
            z: z + 14 + i * 6 + Math.random() * 4,
            kind: kinds[Math.floor(Math.random() * kinds.length)],
          });
        }
        setObstacles((prev) => [...prev.filter((o) => o.z > z - 8), ...newObs]);
      }

      setObstacles((obs) => {
        for (const o of obs) {
          if (!hitObstacles.current.has(o.id) && z + 3 >= o.z && sid) {
            hitObstacles.current.add(o.id);
            void fetchQuestion(sid);
            break;
          }
        }
        return obs;
      });

      setState((s) => {
        if (!s) return s;
        const finished = s.questions_answered >= TARGET_QUESTIONS;
        if (finished && !s.game_over) {
          return { ...s, game_over: true, distance: s.distance + spd * delta, speed: spd };
        }
        return { ...s, distance: s.distance + spd * delta, speed: spd };
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTime.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, fetchQuestion]);

  useEffect(() => {
    if (state?.game_over && state.questions_answered >= TARGET_QUESTIONS && phase === "running") {
      setAnimState("win");
      setPhase("gameover");
      gameApi.evaluate(state.session_id).then((r) => setEvaluation(r.evaluation));
    }
  }, [state?.game_over, state?.questions_answered, state?.session_id, phase]);

  const answer = async (index: number) => {
    if (!state?.current_question || submitting) return;
    setSubmitting(true);
    try {
      const res = await gameApi.checkAnswer(
        state.session_id,
        state.current_question.id,
        index
      );
      setState(res.game_state);
      speedRef.current = res.game_state.speed;
      setLastCorrect(res.correct);
      setAnimState(
        res.correct
          ? Math.random() > 0.5
            ? "dodgeLeft"
            : "dodgeRight"
          : "lose"
      );
      setPhase("feedback");

      setTimeout(() => {
        if (res.game_state.game_over) {
          setAnimState(res.game_state.questions_answered >= TARGET_QUESTIONS ? "win" : "lose");
          setPhase("gameover");
          gameApi.evaluate(res.game_state.session_id).then((r) => setEvaluation(r.evaluation));
        } else {
          setAnimState("run");
          setPhase("running");
          setLastCorrect(null);
          questionTimer.current = 0;
          lastTime.current = performance.now();
        }
      }, FEEDBACK_MS);
    } finally {
      setSubmitting(false);
    }
  };

  const restart = async () => {
    if (!state) return;
    const s = await gameApi.reset(state.session_id);
    setState(s);
    speedRef.current = s.speed;
    scrollRef.current = 0;
    setScrollZ(0);
    setPlayerZ(0);
    setObstacles([]);
    hitObstacles.current.clear();
    lastSpawnZ.current = 0;
    questionTimer.current = 0;
    setEvaluation(null);
    setAnimState("run");
    setPhase("running");
    lastTime.current = performance.now();
  };

  return {
    phase,
    state,
    animState,
    scrollZ,
    playerZ,
    obstacles,
    evaluation,
    submitting,
    lastCorrect,
    answer,
    restart,
  };
}
