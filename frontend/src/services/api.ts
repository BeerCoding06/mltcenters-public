import type { Conversation, DashboardStats, Evaluation, User } from "../types";

const API = "/api/v1";

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
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

  startConversation: (topic: string) =>
    request<Conversation>("/conversations", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),

  sendMessage: (conversationId: string, content: string) =>
    request<{
      conversation_id: string;
      assistant_message: Message;
      turn_count: number;
      evaluation: Evaluation | null;
      conversation_completed: boolean;
    }>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getConversation: (id: string) =>
    request<Conversation>(`/conversations/${id}`),

  listConversations: () =>
    request<Conversation[]>("/conversations"),

  dashboard: () => request<DashboardStats>("/dashboard"),

  adminOverview: () => request<unknown>("/admin/overview"),

  adminExport: () => request<unknown[]>("/admin/export"),
};

type Message = import("../types").Message;
