import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../services/api";
import type { DashboardStats } from "../types";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .dashboard()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p>Loading dashboard...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Conversations" value={String(stats.total_conversations)} />
        <StatCard
          label="Latest score"
          value={stats.latest_score != null ? `${stats.latest_score}` : "—"}
        />
        <StatCard
          label="Average score"
          value={
            stats.average_score != null
              ? stats.average_score.toFixed(1)
              : "—"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.progress_chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="overall" stroke="#0284c7" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Skills</h2>
          <div className="mb-4">
            <p className="text-sm font-medium text-green-700">Strong</p>
            <p className="text-slate-700">
              {stats.strong_skills.join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-700">Needs work</p>
            <p className="text-slate-700">
              {stats.weak_skills.join(", ") || "—"}
            </p>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-600">CEFR history</p>
            <ul className="mt-2 space-y-1 text-sm">
              {stats.cefr_history.map((item, i) => (
                <li key={i}>
                  {item.cefr} — {item.overall} ({new Date(item.date).toLocaleDateString()})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold">Recent conversations</h2>
        <div className="space-y-2">
          {stats.recent_conversations.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"
            >
              <span>
                {c.topic} — {c.status}
              </span>
              <span className="text-slate-500">
                {c.evaluation
                  ? `${c.evaluation.cefr} (${c.evaluation.overall})`
                  : `${c.turn_count} turns`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-700">{value}</p>
    </div>
  );
}
