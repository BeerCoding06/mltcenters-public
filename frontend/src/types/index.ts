export type User = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Evaluation = {
  overall: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  sentence_structure: number;
  confidence: number;
  communication: number;
  cefr: string;
  feedback: string[];
  created_at?: string;
};

export type Conversation = {
  id: string;
  topic: string;
  status: string;
  turn_count: number;
  created_at: string;
  updated_at: string;
  messages: Message[];
  evaluation?: Evaluation | null;
};

export type DashboardStats = {
  total_conversations: number;
  latest_score: number | null;
  average_score: number | null;
  cefr_history: { date: string; cefr: string; overall: number }[];
  progress_chart: { date: string; overall: number }[];
  weak_skills: string[];
  strong_skills: string[];
  recent_conversations: Conversation[];
};

export const TOPICS = [
  "Daily Life",
  "Job Interview",
  "Travel",
  "Restaurant",
  "Business",
  "Technology",
  "Free Talk",
] as const;
