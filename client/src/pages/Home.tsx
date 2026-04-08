/**
 * DESIGN: The Atelier — Dashboard
 * Warm charcoal base, editorial card layout, discipline grid
 * Hero with generated image, staggered entry animations
 * Now includes all 6 interactive mastery modules
 */

import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, DISCIPLINE_ICONS, CORE_DISCIPLINES, SPECIALIZATION_DISCIPLINES, TRACK_META } from '@/data/types';
import { useTracks } from '@/hooks/useTracks';
import {
  BookOpen, FlaskConical, Brain, Network, Briefcase, ArrowRight,
  Sparkles, GraduationCap, Calculator, GitBranch, Map, Shield,
  Search, Trophy, Target, Zap, PlayCircle, Clock, Download, Headphones,
  Users, BarChart3, Bookmark, Library
} from 'lucide-react';

const HERO_IMG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663357378777/ZA65jNeda6DFiE5Ah4cq4b/hero-atelier-Km2x6YRTYjX2VzD9gFdG5C.webp';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function DisciplineCard({ name, count, index }: { name: string; count: number; index: number }) {
  const color = DISCIPLINE_COLORS[name] || 'var(--primary)';
  const icon = DISCIPLINE_ICONS[name] || '📚';
  const { mastery } = useMastery();
  const masteredCount = Object.keys(mastery).filter(k => k.startsWith(`def-${name}-`) && mastery[k]?.mastered).length;
  const progress = count > 0 ? Math.round((masteredCount / count) * 100) : 0;

  return (
    <Link href={`/discipline/${slugify(name)}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: color }} />
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">{count} terms</span>
        </div>
        <h3 className="text-sm font-semibold mb-2 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>{name}</h3>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: index * 0.04 + 0.3, duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 font-mono">{progress}% mastered</p>
      </motion.div>
    </Link>
  );
}

function ModuleCard({ href, icon: Icon, label, desc, accent, delay, badge }: {
  href: string; icon: any; label: string; desc: string; accent: string; delay: number; badge?: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 200, damping: 20 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: accent }} />
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${accent}20` }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          {badge && (
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-border text-muted-foreground">{badge}</span>
          )}
        </div>
        <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>{label}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Launch</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </motion.div>
    </Link>
  );
}

function QuickAction({ href, icon: Icon, label, desc, delay }: { href: string; icon: any; label: string; desc: string; delay: number }) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, type: 'spring', stiffness: 200 }}
        whileHover={{ x: 4 }}
        className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-accent">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{label}</h4>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const definitions = embaData.definitions || [];
  const formulas = embaData.formulas || [];
  const cases = embaData.cases || [];
  const { getStudiedCount, getMasteredCount, getDueItems, unlockedAchievements } = useMastery();
  const { tracks, stats: trackStats } = useTracks();
  const dueCount = getDueItems().length;

  const disciplineCounts: Record<string, number> = {};
  definitions.forEach((d: any) => {
    disciplineCounts[d.discipline] = (disciplineCounts[d.discipline] || 0) + 1;
  });

  const totalStudied = getStudiedCount();
  const totalMastered = getMasteredCount();
  const overallProgress = definitions.length > 0 ? Math.round((totalMastered / definitions.length) * 100) : 0;

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[320px] lg:h-[360px] overflow-hidden">
          <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end px-6 lg:px-10 pb-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono tracking-widest uppercase text-primary">EMBA Knowledge Explorer</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Knowledge Explorer
              </h1>
              <p className="text-base text-muted-foreground max-w-xl" style={{ fontFamily: 'var(--font-body)' }}>
                {definitions.length.toLocaleString()} definitions · {formulas.length} formulas · {cases.length} case studies — your complete EMBA mastery companion.
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-5 max-w-md">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{totalStudied} studied · {totalMastered} mastered</span>
                <span className="font-mono">{overallProgress}%</span>
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'var(--primary)' }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8 space-y-10">

          {/* ── Interactive Mastery Modules ── */}
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Mastery Modules</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Six self-contained interactive modules for deep learning, practice, and application.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ModuleCard
                href="/exam-simulator"
                icon={GraduationCap}
                label="Exam Simulator"
                desc="220 scenario-based questions with timed modes, adaptive difficulty, and performance analytics."
                accent="#8B5CF6"
                delay={0.05}
                badge="220 Qs"
              />
              <ModuleCard
                href="/formula-lab"
                icon={Calculator}
                label="Formula Calculator Lab"
                desc="Interactive calculators for NPV, WACC, Breakeven, Amortization, Premium Financing, and Ratio Dashboard."
                accent="#10B981"
                delay={0.1}
                badge="6 Calcs"
              />
              <ModuleCard
                href="/case-simulator"
                icon={GitBranch}
                label="Case Study Simulator"
                desc="8 branching decision scenarios with framework advisor sidebar and consequence modeling."
                accent="#F59E0B"
                delay={0.15}
                badge="8 Cases"
              />
              <ModuleCard
                href="/connection-map"
                icon={Map}
                label="Connection Map"
                desc="Interactive concept graph showing how 22 key concepts connect across 9 disciplines with FS applications."
                accent="#3B82F6"
                delay={0.2}
                badge="22 Nodes"
              />
              <ModuleCard
                href="/fs-toolkit"
                icon={Shield}
                label="FS Practice Toolkit"
                desc="Client Discovery, Case Design, Compliance, Recruiting ROI, Practice Dashboard, and Meeting Prep."
                accent="#EF4444"
                delay={0.25}
                badge="6 Tools"
              />
              <ModuleCard
                href="/search"
                icon={Search}
                label="Universal Search"
                desc="Full-text search across all definitions, formulas, case studies, and financial services applications."
                accent="#6366F1"
                delay={0.3}
              />
            </div>
          </section>

          {/* ── Exam & Learning Tracks ── */}
          <section>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Exam &amp; Learning Tracks</h2>
              </div>
              <Link href="/tracks">
                <span className="text-xs font-mono text-primary hover:underline flex items-center gap-1">
                  Browse all <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {trackStats.total_tracks} licensed tracks · {trackStats.total_chapters} chapters · {trackStats.total_practice_questions.toLocaleString()} practice questions · {trackStats.total_flashcards.toLocaleString()} flashcards
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tracks.slice(0, 6).map((track, i) => {
                const meta = TRACK_META[track.key] ?? { color: 'var(--primary)', tagline: track.subtitle, emoji: '📘' };
                return (
                  <Link key={track.key} href={`/track/${track.key}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ y: -2 }}
                      className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: meta.color }} />
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xl" aria-hidden>{meta.emoji}</span>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                          {track.counts.practice_questions} qs
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1" style={{ fontFamily: 'var(--font-display)' }}>
                        {track.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{meta.tagline}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {track.counts.chapters} ch · {track.counts.subsections} sec · {track.counts.flashcards} cards
                      </p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── Spaced Repetition & Study ── */}
          {dueCount > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Link href="/study">
                <div className="relative p-5 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        {dueCount} items due for review
                      </h3>
                      <p className="text-xs text-muted-foreground">Spaced repetition keeps knowledge fresh. Start a review session now.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Link>
            </motion.section>
          )}

          {/* ── Quick Study Actions ── */}
          <section>
            <h2 className="text-lg font-semibold mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Quick Study</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <QuickAction href="/study" icon={PlayCircle} label="Study Session" desc="Flashcard study with spaced repetition" delay={0.05} />
              <QuickAction href="/formulas" icon={FlaskConical} label="Formula Reference" desc={`${formulas.length} formulas with worked examples`} delay={0.1} />
              <QuickAction href="/quiz" icon={Brain} label="Quick Quiz" desc="Flashcard-style review mode" delay={0.15} />
              <QuickAction href="/connections" icon={Network} label="Concept Links" desc="Cross-discipline connections" delay={0.2} />
              <QuickAction href="/cases" icon={Briefcase} label="Case Library" desc={`${cases.length} real-world scenarios`} delay={0.25} />
              <QuickAction href="/ai-quiz" icon={Sparkles} label="AI Quiz" desc="Dynamic questions generated by AI" delay={0.3} />
              <QuickAction href="/hands-free" icon={Headphones} label="Hands-Free" desc="Auto-play TTS through discipline content" delay={0.35} />
              <QuickAction href="/achievements" icon={Trophy} label="Achievements" desc={`${unlockedAchievements.length} unlocked — track your progress`} delay={0.4} />
              <QuickAction href="/progress" icon={Download} label="Progress Export" desc="Download CSV or formatted report of your study data" delay={0.45} />
              <QuickAction href="/analytics" icon={BarChart3} label="Analytics" desc="Study time trends, mastery velocity, and SRS effectiveness" delay={0.5} />
              <QuickAction href="/groups" icon={Users} label="Study Groups" desc="Collaborate, share quizzes, and challenge peers" delay={0.55} />
              <QuickAction href="/bookmarks" icon={Bookmark} label="Bookmarks" desc="Saved definitions, formulas, and cases with personal notes" delay={0.6} />
            </div>
          </section>

          {/* ── Core Concentrations ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Core Concentrations</h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{CORE_DISCIPLINES.length} disciplines</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CORE_DISCIPLINES.map((name, i) => (
                <DisciplineCard key={name} name={name} count={disciplineCounts[name] || 0} index={i} />
              ))}
            </div>
          </section>

          {/* ── Specializations ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Specializations</h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{SPECIALIZATION_DISCIPLINES.length} electives</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {SPECIALIZATION_DISCIPLINES.filter(name => disciplineCounts[name]).map((name, i) => (
                <DisciplineCard key={name} name={name} count={disciplineCounts[name] || 0} index={i + CORE_DISCIPLINES.length} />
              ))}
            </div>
          </section>

          {/* ── Financial Services Track ── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--discipline-finance)' }}>
                <BookOpen className="w-4 h-4" style={{ color: 'var(--primary-foreground)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Financial Services Track</h2>
                <p className="text-xs text-muted-foreground">Applied practice scenarios across financial services disciplines</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(embaData.fs_applications || []).slice(0, 6).map((app: any, i: number) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-accent text-accent-foreground">{app.discipline}</span>
                  </div>
                  <h4 className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{app.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3">{app.content}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Navigation>
  );
}
