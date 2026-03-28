/**
 * DESIGN: The Atelier — Achievements Gallery
 * Visual trophy case with unlocked/locked states
 * Study calendar heatmap, daily goal tracker
 */

import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useMemo, useState } from 'react';
import { useMastery, ACHIEVEMENTS } from '@/contexts/MasteryContext';
import { ArrowLeft, Trophy, Target, Calendar, Flame, Settings2 } from 'lucide-react';

function HeatmapCell({ value, max, date }: { value: number; max: number; date: string }) {
  const intensity = max > 0 ? Math.min(value / max, 1) : 0;
  const day = new Date(date);
  const isToday = date === new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      title={`${date}: ${value} min`}
      className={`w-3 h-3 rounded-sm ${isToday ? 'ring-1 ring-primary' : ''}`}
      style={{
        background: intensity > 0
          ? `oklch(0.75 0.15 85 / ${0.2 + intensity * 0.8})`
          : 'var(--muted)',
      }}
    />
  );
}

export default function Achievements() {
  const { unlockedAchievements, dailyGoal, setDailyGoal, dailyProgress, studyHistory } = useMastery();
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [goalDraft, setGoalDraft] = useState(dailyGoal);

  // Generate last 90 days for heatmap
  const heatmapDays = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const maxMinutes = useMemo(() => {
    return Math.max(1, ...heatmapDays.map(d => studyHistory[d] || 0));
  }, [heatmapDays, studyHistory]);

  const totalDays = Object.keys(studyHistory).filter(k => studyHistory[k] > 0).length;
  const totalMinutes = Object.values(studyHistory).reduce((a, b) => a + b, 0);

  const defPct = dailyGoal.definitions > 0 ? Math.min(100, Math.round((dailyProgress.definitions / dailyGoal.definitions) * 100)) : 0;
  const quizPct = dailyGoal.quizQuestions > 0 ? Math.min(100, Math.round((dailyProgress.quizQuestions / dailyGoal.quizQuestions) * 100)) : 0;

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="px-6 lg:px-10 py-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </Link>
              <Trophy className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Achievements & Progress
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {unlockedAchievements.length} / {ACHIEVEMENTS.length} unlocked · {totalDays} study days · {Math.round(totalMinutes / 60)}h total
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6 space-y-8">
          {/* Daily Goal Tracker */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Target className="w-4 h-4 text-primary" /> Today's Goals
              </h2>
              <button
                onClick={() => setShowGoalEditor(!showGoalEditor)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>

            {showGoalEditor && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-4 p-4 rounded-xl border border-border bg-card"
              >
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Definitions/day</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={goalDraft.definitions}
                      onChange={e => setGoalDraft(prev => ({ ...prev, definitions: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Formulas/day</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={goalDraft.formulas}
                      onChange={e => setGoalDraft(prev => ({ ...prev, formulas: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Quiz questions/day</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={goalDraft.quizQuestions}
                      onChange={e => setGoalDraft(prev => ({ ...prev, quizQuestions: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 text-sm bg-input border border-border rounded-lg"
                    />
                  </div>
                </div>
                <button
                  onClick={() => { setDailyGoal(goalDraft); setShowGoalEditor(false); }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                >
                  Save Goals
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Definitions</span>
                  <span className="text-xs font-mono" style={{ color: defPct >= 100 ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                    {dailyProgress.definitions}/{dailyGoal.definitions}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: defPct >= 100 ? 'var(--primary)' : 'oklch(0.75 0.15 85)' }}
                    animate={{ width: `${defPct}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Quiz Questions</span>
                  <span className="text-xs font-mono" style={{ color: quizPct >= 100 ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                    {dailyProgress.quizQuestions}/{dailyGoal.quizQuestions}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: quizPct >= 100 ? 'var(--primary)' : 'oklch(0.75 0.15 85)' }}
                    animate={{ width: `${quizPct}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Study Calendar Heatmap */}
          <section>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Calendar className="w-4 h-4 text-primary" /> Study Activity (Last 90 Days)
            </h2>
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex flex-wrap gap-1">
                {heatmapDays.map(day => (
                  <HeatmapCell key={day} value={studyHistory[day] || 0} max={maxMinutes} date={day} />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                <span>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      background: intensity > 0
                        ? `oklch(0.75 0.15 85 / ${0.2 + intensity * 0.8})`
                        : 'var(--muted)',
                    }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </section>

          {/* Achievements Grid */}
          <section>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Flame className="w-4 h-4 text-primary" /> Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ACHIEVEMENTS.map((achievement, i) => {
                const unlocked = unlockedAchievements.includes(achievement.id);
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`p-4 rounded-xl border transition-all ${
                      unlocked
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-card opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {achievement.description}
                        </p>
                        {unlocked && (
                          <span className="inline-block text-[10px] font-mono text-primary mt-1">Unlocked</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Navigation>
  );
}
