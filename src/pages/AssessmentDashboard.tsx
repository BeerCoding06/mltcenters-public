import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { AssessmentResult } from '@/types/assessment';

const ASSESSMENT_STORAGE_KEY = 'mlt-assessment-result';

function getLevelColor(level: string) {
  if (level === 'Advanced') return 'from-[#6EE7B7] to-[#5BC0FF]';
  if (level === 'Intermediate') return 'from-[#5BC0FF] to-[#FFE66D]';
  return 'from-[#FF8FAB] to-[#FFE66D]';
}

export default function AssessmentDashboard() {
  const location = useLocation();
  const result = (location.state as { result?: AssessmentResult })?.result as AssessmentResult | undefined;

  let data: AssessmentResult | null = result ?? null;
  if (!data) {
    try {
      const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
      if (raw) data = JSON.parse(raw) as AssessmentResult;
    } catch {}
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-white shadow-xl p-8 max-w-md text-center"
        >
          <p className="text-muted-foreground mb-6">You haven't chatted yet—want to try? 😊</p>
          <Link
            to="/assessment"
            className="inline-block rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-6 py-3"
          >
            Start chatting
          </Link>
        </motion.div>
      </div>
    );
  }

  const { scores, level, strengths, weaknesses, tips, totalXP, badges } = data;
  const overall = Math.round(
    (scores.grammar + scores.vocabulary + scores.fluency + scores.coherence) / 4
  );
  const radarData = [
    { subject: 'Grammar', value: scores.grammar, fullMark: 100 },
    { subject: 'Vocabulary', value: scores.vocabulary, fullMark: 100 },
    { subject: 'Fluency', value: scores.fluency, fullMark: 100 },
    { subject: 'Coherence', value: scores.coherence, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-center mb-2 bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] bg-clip-text text-transparent"
        >
          Here's how you did
        </motion.h1>
        <p className="text-center text-muted-foreground mb-10">A quick look at your English — no stress!</p>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white shadow-xl p-6 border border-white/80"
          >
            <p className="text-sm text-muted-foreground mb-1">Your score</p>
            <p className="text-4xl font-bold text-[#5BC0FF]">{overall}/100</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`rounded-2xl bg-gradient-to-r ${getLevelColor(level)} p-6 text-white shadow-xl`}
          >
            <p className="text-sm opacity-90 mb-1">Level</p>
            <p className="text-2xl font-bold">🏆 {level}</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white shadow-xl p-6 mb-8 border border-white/80 h-80"
        >
          <p className="text-sm font-medium text-foreground mb-4">By skill</p>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#5BC0FF" strokeOpacity={0.3} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#5BC0FF"
                fill="#5BC0FF"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Tooltip contentStyle={{ borderRadius: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white shadow-lg p-6 border border-[#6EE7B7]/30"
          >
            <p className="text-sm font-medium text-foreground mb-2">📌 Strengths</p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              {strengths.length ? strengths.map((s) => <li key={s}>{s}</li>) : <li>Keep practicing!</li>}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl bg-white shadow-lg p-6 border border-[#FF8FAB]/30"
          >
            <p className="text-sm font-medium text-foreground mb-2">💡 Ideas to try</p>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              {weaknesses.length ? weaknesses.map((w) => <li key={w}>{w}</li>) : <li>None</li>}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-white shadow-lg p-6 mb-8 border border-[#FFE66D]/40"
        >
          <p className="text-sm font-medium text-foreground mb-2">📚 Simple tips</p>
          <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
            {tips.length ? tips.map((t, i) => <li key={i}>{t}</li>) : <li>Practice regularly.</li>}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl bg-gradient-to-br from-[#5BC0FF]/20 to-[#6EE7B7]/20 p-6 mb-8 border border-[#5BC0FF]/30"
        >
          <p className="text-sm font-medium text-foreground mb-2">Points you earned</p>
          <p className="text-2xl font-bold text-[#5BC0FF]">+{totalXP} XP</p>
          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-xl bg-white/80 px-3 py-1 text-xs font-medium text-foreground shadow"
                >
                  🏅 {b}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/assessment"
            className="inline-block text-center rounded-2xl bg-gradient-to-r from-[#5BC0FF] to-[#6EE7B7] text-white font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all"
          >
            Chat again
          </Link>
          <Link
            to="/"
            className="inline-block text-center rounded-2xl bg-white border border-border text-foreground font-medium px-8 py-4 shadow hover:bg-muted transition-all"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
