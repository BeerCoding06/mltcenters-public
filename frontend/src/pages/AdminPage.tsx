import { useEffect, useState } from "react";
import { api } from "../services/api";

type AdminOverview = {
  total_users: number;
  total_conversations: number;
  total_evaluations: number;
  average_platform_score: number | null;
  users: {
    id: string;
    email: string;
    full_name: string;
    conversation_count: number;
    average_score: number | null;
    latest_cefr: string | null;
    created_at: string;
  }[];
};

export function AdminPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .adminOverview()
      .then((res) => setData(res as AdminOverview))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"));
  }, []);

  async function exportReport() {
    const rows = await api.adminExport();
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "platform-report.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading admin data...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin</h1>
        <button
          onClick={exportReport}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Export report
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Users" value={data.total_users} />
        <Stat label="Conversations" value={data.total_conversations} />
        <Stat label="Evaluations" value={data.total_evaluations} />
        <Stat
          label="Avg score"
          value={
            data.average_platform_score != null
              ? data.average_platform_score.toFixed(1)
              : "—"
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Conversations</th>
              <th className="px-4 py-3">Avg score</th>
              <th className="px-4 py-3">CEFR</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.conversation_count}</td>
                <td className="px-4 py-3">
                  {u.average_score != null ? u.average_score.toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3">{u.latest_cefr ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
