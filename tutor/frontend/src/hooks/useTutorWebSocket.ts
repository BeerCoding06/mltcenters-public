import { useCallback, useEffect, useRef, useState } from "react";
import type { AvatarPayload, Evaluation } from "../types";
import { wsUrl } from "../services/api";

interface WsHandlers {
  onToken?: (text: string) => void;
  onComplete?: (payload: {
    text: string;
    avatar: AvatarPayload;
    turn_count: number;
    evaluation: Evaluation | null;
  }) => void;
  onInterrupted?: () => void;
}

export function useTutorWebSocket(sessionId: string | null, handlers: WsHandlers) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!sessionId) return;
    const ws = new WebSocket(wsUrl(sessionId));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type === "token") handlersRef.current.onToken?.(data.text);
      if (data.type === "assistant_complete") handlersRef.current.onComplete?.(data);
      if (data.type === "interrupted") handlersRef.current.onInterrupted?.();
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId]);

  const sendMessage = useCallback((text: string) => {
    wsRef.current?.send(JSON.stringify({ type: "user_message", text }));
  }, []);

  const interrupt = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "interrupt" }));
  }, []);

  return { connected, sendMessage, interrupt };
}
