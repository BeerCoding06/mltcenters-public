import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../services/api";
import type { DashboardData } from "../types";

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <p className="text-slate-400">กำลังโหลดแดชบอร์ด…</p>;

  const chartData = data.sessions
    .filter((s) => s.cefr)
    .slice(0, 8)
    .map((s) => ({ topic: s.topic.slice(0, 12), cefr: s.cefr }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">ความก้าวหน้าของคุณ</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="เซสชันทั้งหมด" value={data.total_sessions} />
        <Stat label="เสร็จสิ้นแล้ว" value={data.completed_sessions} />
        <Stat label="CEFR ล่าสุด" value={data.latest_cefr || "—"} />
      </div>

      {chartData.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 font-semibold">ระดับ CEFR ตามเซสชัน</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="topic" stroke="#94a3b8" fontSize={12} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="cefr" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900">
        <h2 className="border-b border-slate-800 px-6 py-4 font-semibold">ประวัติการสนทนา</h2>
        <ul className="divide-y divide-slate-800">
          {data.sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <div>
                <p className="font-medium">{s.topic}</p>
                <p className="text-slate-400">{new Date(s.created_at).toLocaleString("th-TH")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs">
                  {s.status === "completed" ? "เสร็จสิ้น" : s.status === "active" ? "กำลังใช้งาน" : s.status}
                </span>
                {s.cefr && <span className="text-sky-400">{s.cefr}</span>}
                <Link to={`/tutor?session=${s.id}`} className="text-sky-400 hover:underline">
                  ดู
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-sky-400">{value}</p>
    </div>
  );
}
