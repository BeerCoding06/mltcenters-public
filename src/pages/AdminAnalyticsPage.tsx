import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Summary = {
  visitorsToday: number;
  visitorsWeek: number;
  visitorsMonth: number;
  activeUsers: number;
  returningUsers: number;
  sessions: number;
  avgSessionDurationMs: number;
  bounceRate: number;
  topPages: Array<{ path: string; views: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
  assessment: Record<string, number>;
  chat: { sessions: number; messages: number };
  runner: Record<string, number>;
  dailyVisitors: Array<{ day: number; visitors: number }>;
};

const TOKEN_KEY = 'mlt-analytics-admin-token';
const USER_KEY = 'mlt-analytics-admin-user';

function formatDuration(ms: number) {
  if (!ms) return '0s';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [adminUser, setAdminUser] = useState(() => sessionStorage.getItem(USER_KEY) || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (authToken: string) => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/summary', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSummary(data.summary);
      sessionStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
    } catch (e) {
      setSummary(null);
      setError(e instanceof Error ? e.message : 'Failed to load');
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      setToken('');
      setAdminUser('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analytics/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const nextToken = String(data.token || '');
      if (!nextToken) throw new Error('No session token returned');
      sessionStorage.setItem(TOKEN_KEY, nextToken);
      sessionStorage.setItem(USER_KEY, data.username || username.trim());
      setAdminUser(data.username || username.trim());
      setPassword('');
      await load(nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(token);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [token, load]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <form className="w-full max-w-md pastel-card p-8 space-y-4" onSubmit={handleLogin}>
          <div className="text-center space-y-1 mb-2">
            <h1 className="text-2xl font-bold heading-gradient">Admin Login</h1>
            <p className="text-sm text-muted-foreground">MLTCENTERS Analytics</p>
          </div>

          <div>
            <label htmlFor="admin-user" className="block text-sm font-medium mb-1.5">
              Username
            </label>
            <input
              id="admin-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-pass" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button type="submit" className="w-full gradient-btn py-3" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  const chartData =
    summary?.dailyVisitors.map((d) => ({
      name: new Date(d.day * 86400000).toLocaleDateString(),
      visitors: d.visitors,
    })) || [];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold heading-gradient">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{adminUser || 'admin'}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="text-sm underline" onClick={() => void load(token)}>
              Refresh
            </button>
            <button
              type="button"
              className="text-sm underline text-muted-foreground"
              onClick={() => {
                sessionStorage.removeItem(TOKEN_KEY);
                sessionStorage.removeItem(USER_KEY);
                setToken('');
                setAdminUser('');
                setSummary(null);
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading && !summary && <p className="text-sm text-muted-foreground">Loading…</p>}

        {summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Visitors today" value={summary.visitorsToday} />
              <StatCard label="Visitors this week" value={summary.visitorsWeek} />
              <StatCard label="Visitors this month" value={summary.visitorsMonth} />
              <StatCard label="Active users (5m)" value={summary.activeUsers} />
              <StatCard label="Returning users" value={summary.returningUsers} />
              <StatCard label="Sessions (month)" value={summary.sessions} />
              <StatCard label="Avg session" value={formatDuration(summary.avgSessionDurationMs)} />
              <StatCard label="Bounce rate" value={`${Math.round(summary.bounceRate * 100)}%`} />
            </div>

            <div className="pastel-card p-4 h-72">
              <h2 className="font-semibold mb-3">Daily visitors (7d)</h2>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="#5BC0FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <ListCard title="Top pages" rows={summary.topPages.map((p) => [p.path, p.views])} />
              <ListCard
                title="Top browsers"
                rows={summary.topBrowsers.map((b) => [b.browser, b.count])}
              />
              <ListCard
                title="Top countries"
                rows={summary.topCountries.map((c) => [c.country, c.count])}
              />
              <ListCard
                title="Top devices"
                rows={summary.topDevices.map((d) => [d.device, d.count])}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <StatCard label="Assessment completed" value={summary.assessment.completed || 0} />
              <StatCard label="Chat sessions" value={summary.chat.sessions} />
              <StatCard label="Runner finished" value={summary.runner.finished || 0} />
              <StatCard label="Assessment started" value={summary.assessment.started || 0} />
              <StatCard label="Chat messages" value={summary.chat.messages} />
              <StatCard label="Runner started" value={summary.runner.started || 0} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ListCard({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <div className="pastel-card p-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      <ul className="space-y-2 text-sm">
        {rows.length === 0 && <li className="text-muted-foreground">No data yet</li>}
        {rows.map(([label, value]) => (
          <li key={label} className="flex justify-between gap-3 border-b border-border/60 pb-1">
            <span className="truncate">{label}</span>
            <span className="font-medium shrink-0">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
