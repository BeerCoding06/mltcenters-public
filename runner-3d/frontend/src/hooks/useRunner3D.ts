import { useCallback, useEffect, useRef, useState } from "react";
import { gameApi } from "../services/api";
import type { AnimState, GamePhase, GameState, PerformanceEvaluation } from "../types";
import type { Obstacle } from "../three/ObstacleTrack";

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

  const init = useCallback(async () => {
    const res = await gameApi.newGame();
    setState(res.game_state);
    speedRef.current = res.game_state.speed;
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
    try {
      const res = await gameApi.generateQuestion(sessionId);
      setState(res.game_state);
      speedRef.current = res.game_state.speed;
      setPhase("question");
    } finally {
      fetching.current = false;
    }
  }, []);

  // Game loop
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

      if (z - lastSpawnZ.current > 14) {
        lastSpawnZ.current = z;
        const kinds: Obstacle["kind"][] = ["barrel", "cone", "crate"];
        setObstacles((prev) => [
          ...prev.filter((o) => o.z > z - 8),
          {
            id: nextObstacleId.current++,
            z: z + 22 + Math.random() * 8,
            kind: kinds[Math.floor(Math.random() * kinds.length)],
          },
        ]);
      }

      setObstacles((obs) => {
        for (const o of obs) {
          if (!hitObstacles.current.has(o.id) && z + 3 >= o.z) {
            hitObstacles.current.add(o.id);
            const sid = state?.session_id;
            if (sid) void fetchQuestion(sid);
            break;
          }
        }
        return obs;
      });

      setState((s) =>
        s ? { ...s, distance: s.distance + spd * delta, speed: spd } : s
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTime.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, state?.session_id, fetchQuestion]);

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
      setAnimState(res.correct ? "jump" : "lose");
      setPhase("feedback");

      setTimeout(() => {
        if (res.game_state.game_over) {
          setAnimState("lose");
          setPhase("gameover");
          gameApi.evaluate(res.game_state.session_id).then((r) => setEvaluation(r.evaluation));
        } else {
          setAnimState("run");
          setPhase("running");
          setLastCorrect(null);
          lastTime.current = performance.now();
        }
      }, 2000);
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
