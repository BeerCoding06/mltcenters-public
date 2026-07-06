export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Viseme {
  t: number;
  shape: string;
  duration: number;
}

export interface AvatarPayload {
  engine: "viseme" | "musetalk";
  audio_url: string;
  video_url: string | null;
  visemes: Viseme[];
  expression: "smile" | "neutral";
  portrait_url?: string;
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
  meta?: AvatarPayload;
}

export interface Evaluation {
  overall: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  sentence_structure: number;
  confidence: number;
  communication: number;
  cefr: string;
  grammar_corrections: string[];
  vocabulary_suggestions: string[];
  feedback: string[];
}

export interface SessionSummary {
  id: string;
  topic: string;
  turn_count: number;
  status: string;
  created_at: string;
  cefr: string | null;
}

export interface DashboardData {
  total_sessions: number;
  completed_sessions: number;
  latest_cefr: string | null;
  sessions: SessionSummary[];
}
