import { useCallback, useEffect, useRef, useState } from "react";
import { EventBus, GAME_EVENTS } from "../game/EventBus";
import type { RunnerScene } from "../game/RunnerScene";
import { gameApi } from "../services/api";
import type { GamePhase, GameState } from "../types";

export function useGameSession() {
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [state, setState] = useState<GameState | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const sceneRef = useRef<RunnerScene | null>(null);
  const fetchingRef = useRef(false);

  const syncScene = useCallback((s: GameState) => {
    EventBus.emit(GAME_EVENTS.UPDATE_STATS, {
      speed: s.speed,
      hp: s.hp,
      game_over: s.game_over,
    });
  }, []);

  const initGame = useCallback(async () => {
    setPhase("loading");
    const res = await gameApi.newGame();
    setState(res.game_state);
    setPhase("running");
    syncScene(res.game_state);
  }, [syncScene]);

  const fetchQuestion = useCallback(async () => {
    if (!state?.session_id || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await gameApi.generateQuestion(state.session_id);
      setState(res.game_state);
      setPhase("question");
    } finally {
      fetchingRef.current = false;
    }
  }, [state?.session_id]);

  const onSceneReady = useCallback((scene: RunnerScene) => {
    sceneRef.current = scene;
  }, []);

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initGame().catch(console.error);
  }, [initGame]);

  useEffect(() => {
    const onObstacle = () => fetchQuestion();
    const onGameOver = () => setPhase("gameover");

    EventBus.on(GAME_EVENTS.OBSTACLE_HIT, onObstacle);
    EventBus.on(GAME_EVENTS.GAME_OVER, onGameOver);
    return () => {
      EventBus.off(GAME_EVENTS.OBSTACLE_HIT, onObstacle);
      EventBus.off(GAME_EVENTS.GAME_OVER, onGameOver);
    };
  }, [fetchQuestion]);

  useEffect(() => {
    if (state) syncScene(state);
  }, [state, syncScene]);

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
      setLastCorrect(res.correct);
      setPhase("feedback");
      sceneRef.current?.setPaused(true);

      setTimeout(() => {
        if (res.game_state.game_over) {
          setPhase("gameover");
        } else {
          sceneRef.current?.setPaused(false);
          setPhase("running");
          setLastCorrect(null);
        }
      }, 2200);
    } finally {
      setSubmitting(false);
    }
  };

  const restart = async () => {
    if (!state?.session_id) return;
    const newState = await gameApi.reset(state.session_id);
    setState(newState);
    setLastCorrect(null);
    setPhase("running");
    sceneRef.current?.setPaused(false);
    syncScene(newState);
  };

  return {
    phase,
    state,
    lastCorrect,
    submitting,
    onSceneReady,
    answer,
    restart,
  };
}
