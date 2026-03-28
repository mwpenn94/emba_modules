/**
 * Study Analytics Dashboard
 * Visualizes study time trends, mastery velocity, SRS effectiveness, and session history.
 * Uses recharts with the house ChartContainer wrapper for consistent styling.
 */

import Navigation from '@/components/Navigation';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, CORE_DISCIPLINES, SPECIALIZATION_DISCIPLINES } from '@/data/types';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Clock, Target, Brain, Calendar,
  ArrowUp, ArrowDown, Minus, Trophy, Flame, BookOpen
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';

type TimeRange = '7d' | '30d' | '90d' | 'all';

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatCard({ icon: Icon, label, value, sub, trend, delay }: {
  icon: any; label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'flat'; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground font-mono tracking-wider uppercase">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{value}</span>
        {trend && (
          <span className={`text-xs flex items-center gap-0.5 mb-1 ${
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : trend === 'down' ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function Analytics() {
  const { mastery, session, totalStudyTime, getStudiedCount, getMasteredCount, getDueItems, unlockedAchievements } = useMastery();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const definitions = embaData.definitions || [];
  const allDisciplines = [...CORE_DISCIPLINES, ...SPECIALIZATION_DISCIPLINES];

  // ── Compute analytics data ──
  const analytics = useMemo(() => {
    const now = Date.now();
    const msPerDay = 86400000;
    const rangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoff = now - rangeDays * msPerDay;

    // Build daily study activity from mastery data
    const dailyMap = new Map<string, { studied: number; mastered: number; reviews: number; time: number }>();
    
    Object.entries(mastery).forEach(([key, item]) => {
      if (!item || item.lastReviewed < cutoff) return;
      const date = new Date(item.lastReviewed).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { studied: 0, mastered: 0, reviews: 0, time: 0 };
      existing.reviews += item.reviewCount || 0;
      if (item.seen) existing.studied++;
      if (item.mastered) existing.mastered++;
      dailyMap.set(date, existing);
    });

    // Fill in missing days
    const dailyData: Array<{ date: string; studied: number; mastered: number; reviews: number }> = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now - i * msPerDay);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const entry = dailyMap.get(dateStr) || { studied: 0, mastered: 0, reviews: 0 };
      dailyData.push({ date: label, ...entry });
    }

    // Discipline mastery breakdown
    const disciplineData = allDisciplines.map(name => {
      const total = definitions.filter((d: any) => d.discipline === name).length;
      const masteredCount = Object.keys(mastery).filter(
        k => k.startsWith(`def-${name}-`) && mastery[k]?.mastered
      ).length;
      const studiedCount = Object.keys(mastery).filter(
        k => k.startsWith(`def-${name}-`) && mastery[k]?.seen
      ).length;
      const avgConfidence = Object.keys(mastery)
        .filter(k => k.startsWith(`def-${name}-`) && mastery[k]?.seen)
        .reduce((sum, k) => sum + (mastery[k]?.confidence || 0), 0) / Math.max(studiedCount, 1);

      return {
        name: name.length > 12 ? name.slice(0, 12) + '...' : name,
        fullName: name,
        total,
        mastered: masteredCount,
        studied: studiedCount,
        progress: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
        avgConfidence: Math.round(avgConfidence * 10) / 10,
        color: DISCIPLINE_COLORS[name] || 'var(--primary)',
      };
    }).filter(d => d.total > 0);

    // Confidence distribution
    const confidenceDist = [0, 0, 0, 0, 0, 0]; // 0-5
    Object.values(mastery).forEach(item => {
      if (item?.seen) {
        const c = Math.min(5, Math.max(0, Math.round(item.confidence || 0)));
        confidenceDist[c]++;
      }
    });
    const confidenceData = confidenceDist.map((count, level) => ({
      level: `${level}`,
      count,
      label: ['New', 'Low', 'Fair', 'Good', 'Strong', 'Mastered'][level],
    }));

    // Radar data for discipline coverage
    const radarData = disciplineData.slice(0, 9).map(d => ({
      discipline: d.name,
      progress: d.progress,
      confidence: d.avgConfidence * 20, // Scale to 0-100
    }));

    // SRS effectiveness
    const totalReviews = Object.values(mastery).reduce((sum, item) => sum + (item?.reviewCount || 0), 0);
    const masteredItems = Object.values(mastery).filter(item => item?.mastered).length;
    const retentionRate = totalReviews > 0 ? Math.round((masteredItems / Math.max(getStudiedCount(), 1)) * 100) : 0;

    return { dailyData, disciplineData, confidenceData, radarData, totalReviews, retentionRate };
  }, [mastery, timeRange]);

  const studied = getStudiedCount();
  const masteredTotal = getMasteredCount();
  const dueCount = getDueItems().length;
  const overallProgress = definitions.length > 0 ? Math.round((masteredTotal / definitions.length) * 100) : 0;

  const CHART_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#EC4899'];

  return (
    <Navigation>
      <div className="min-h-screen px-6 lg:px-10 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Study Analytics
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Track your learning progress, identify strengths, and optimize your study strategy.</p>
        </motion.div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={BookOpen} label="Items Studied" value={studied.toLocaleString()} sub={`of ${definitions.length.toLocaleString()} total`} delay={0.05} />
          <StatCard icon={Trophy} label="Mastered" value={`${overallProgress}%`} sub={`${masteredTotal} items mastered`} trend={overallProgress > 50 ? 'up' : overallProgress > 0 ? 'flat' : undefined} delay={0.1} />
          <StatCard icon={Clock} label="Study Time" value={formatDuration(totalStudyTime)} sub={`${session.streak} day streak`} delay={0.15} />
          <StatCard icon={Target} label="Due for Review" value={dueCount.toLocaleString()} sub="Spaced repetition items" trend={dueCount > 20 ? 'down' : 'flat'} delay={0.2} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Study Activity Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Study Activity</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studiedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="masteredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="studied" stroke="#8B5CF6" fill="url(#studiedGrad)" strokeWidth={2} name="Studied" />
                  <Area type="monotone" dataKey="mastered" stroke="#10B981" fill="url(#masteredGrad)" strokeWidth={2} name="Mastered" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Confidence Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Confidence Distribution</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.confidenceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Items">
                    {analytics.confidenceData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Discipline Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Discipline Coverage</h3>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analytics.radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="var(--border)" opacity={0.3} />
                  <PolarAngleAxis dataKey="discipline" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: 'var(--muted-foreground)' }} />
                  <Radar name="Progress" dataKey="progress" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Confidence" dataKey="confidence" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* SRS Effectiveness */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>SRS Effectiveness</h3>
            </div>
            <div className="space-y-5 mt-6">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Retention Rate</span>
                  <span className="font-mono">{analytics.retentionRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analytics.retentionRate}%` }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-full rounded-full bg-green-500"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Overall Progress</span>
                  <span className="font-mono">{overallProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="h-full rounded-full bg-violet-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{analytics.totalReviews}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Total Reviews</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{unlockedAchievements.length}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Achievements</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{session.streak}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Day Streak</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{dueCount}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Due Items</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Discipline Progress Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-xl p-5 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Discipline Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-mono tracking-wider uppercase">Discipline</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-mono tracking-wider uppercase">Total</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-mono tracking-wider uppercase">Studied</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-mono tracking-wider uppercase">Mastered</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-mono tracking-wider uppercase">Progress</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-mono tracking-wider uppercase">Avg Conf.</th>
                  <th className="py-2 px-3 text-muted-foreground font-mono tracking-wider uppercase w-32">Bar</th>
                </tr>
              </thead>
              <tbody>
                {analytics.disciplineData
                  .sort((a, b) => b.progress - a.progress)
                  .map((d, i) => (
                    <tr key={d.fullName} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{d.fullName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{d.total}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{d.studied}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-green-500">{d.mastered}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">{d.progress}%</td>
                      <td className="py-2.5 px-3 text-right font-mono">{d.avgConfidence}</td>
                      <td className="py-2.5 px-3">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${d.progress}%`, background: d.color }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </Navigation>
  );
}
