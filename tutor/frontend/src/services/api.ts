import type { AvatarPayload, DashboardData, Evaluation, User } from "../types";

const API = "/api/v1";

function headers(): HeadersInit {
  const token = localStorage.getItem("tutor_token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers(), ...options?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "คำขอล้มเหลว");
  }
  return res.json();
}

export const api = {
  register: (email: string, full_name: string, password: string) =>
    request<{ access_token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, full_name, password }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/auth/me"),

  startSession: (topic: string) =>
    request<{ session_id: string; greeting: string; avatar: AvatarPayload }>("/sessions/start", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),

  dashboard: () => request<DashboardData>("/dashboard"),

  getSession: (id: string) =>
    request<{
      id: string;
      topic: string;
      messages: { role: string; content: string; meta?: AvatarPayload }[];
      evaluation: Evaluation | null;
    }>(`/sessions/${id}`),

  stt: async (blob: Blob) => {
    const fd = new FormData();
    fd.append("file", blob, "audio.webm");
    const token = localStorage.getItem("tutor_token");
    const res = await fetch(`${API}/stt`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });
    if (!res.ok) throw new Error("แปลงเสียงเป็นข้อความไม่สำเร็จ");
    return res.json() as Promise<{ text: string }>;
  },
};

export function mediaUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return path;
}

export function wsUrl(sessionId: string): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${proto}://${host}/api/v1/ws/${sessionId}`;
}
