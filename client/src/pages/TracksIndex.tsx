/**
 * TracksIndex — landing page for the WealthBridge exam-prep library.
 *
 * Displays all 12 study tracks grouped by category (Securities, Planning,
 * Insurance) with chapter / question / flashcard counts and direct links into
 * each track's reading view, practice quiz, and flashcard deck.
 */

import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Compass,
  Shield,
  BookOpen,
  Brain,
  ListMusic,
  ChevronRight,
  ScrollText,
  FileText,
} from 'lucide-react';
import { useTracks } from '@/hooks/useTracks';
import { useMastery } from '@/contexts/MasteryContext';
import { TRACK_META, type TrackCategory } from '@/data/types';

const CATEGORY_ORDER: TrackCategory[] = ['securities', 'planning', 'insurance'];

const CATEGORY_ICONS: Record<TrackCategory, typeof GraduationCap> = {
  securities: GraduationCap,
  planning: Compass,
  insurance: Shield,
};

export default function TracksIndex() {
  const { tracks, categories, byCategory, stats, dataset } = useTracks();
  const { mastery } = useMastery();
  const [showTax, setShowTax] = useState(false);
  const [showMaster, setShowMaster] = useState(false);

  const trackProgress = (trackKey: string) => {
    const prefix = `track-${trackKey}-`;
    let seen = 0;
    let mastered = 0;
    for (const k in mastery) {
      if (!k.startsWith(prefix)) continue;
      const m = mastery[k];
      if (m?.seen) seen += 1;
      if (m?.mastered || (m?.confidence ?? 0) >= 4) mastered += 1;
    }
    return { seen, mastered };
  };

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-6 lg:px-10 py-6 border-b border-border">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <motion.div
                whileHover={{ x: -2 }}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <BookOpen className="w-5 h-5 text-primary" />
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Exam &amp; Learning Tracks
            </h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {stats.total_tracks} licensed tracks · {stats.total_chapters} chapters ·
            {' '}
            {stats.total_practice_questions.toLocaleString()} practice questions ·
            {' '}
            {stats.total_flashcards.toLocaleString()} flashcards. Sourced from the
            WealthBridge Library and the Master Study Manual.
          </p>
        </div>

        <div className="px-6 lg:px-10 py-8 space-y-12">
          {CATEGORY_ORDER.map((catKey) => {
            const cat = categories[catKey];
            const list = byCategory.get(catKey) ?? [];
            if (list.length === 0) return null;
            const Icon = CATEGORY_ICONS[catKey];

            return (
              <section key={catKey}>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${cat.color}1a`, color: cat.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-semibold tracking-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {cat.label}
                    </h2>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                  </div>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">
                    {list.length} {list.length === 1 ? 'track' : 'tracks'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {list.map((track, i) => {
                    const meta = TRACK_META[track.key] ?? {
                      color: cat.color,
                      tagline: track.subtitle,
                      emoji: '📘',
                    };
                    const totalItems =
                      track.counts.flashcards + track.counts.practice_questions;
                    const prog = trackProgress(track.key);
                    const pct =
                      totalItems > 0
                        ? Math.round((prog.mastered / totalItems) * 100)
                        : 0;
                    return (
                      <motion.div
                        key={track.key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        className="group relative bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all overflow-hidden"
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-[2px]"
                          style={{ background: meta.color }}
                        />

                        <div className="flex items-start justify-between mb-3">
                          <span className="text-2xl" aria-hidden>
                            {meta.emoji}
                          </span>
                          <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">
                            {track.counts.practice_questions} questions
                          </span>
                        </div>

                        <Link href={`/track/${track.key}`}>
                          <h3
                            className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors cursor-pointer"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {track.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {meta.tagline}
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground mb-3">
                          <div className="flex flex-col">
                            <span className="text-foreground font-semibold">
                              {track.counts.chapters}
                            </span>
                            <span>chapters</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-foreground font-semibold">
                              {track.counts.subsections}
                            </span>
                            <span>sections</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-foreground font-semibold">
                              {track.counts.flashcards}
                            </span>
                            <span>cards</span>
                          </div>
                        </div>

                        {totalItems > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                              <span>
                                {prog.mastered}/{totalItems} mastered
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: meta.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6 }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[11px]">
                          <Link href={`/track/${track.key}`}>
                            <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> Study
                            </span>
                          </Link>
                          <Link href={`/track/${track.key}/quiz`}>
                            <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                              <Brain className="w-3 h-3" /> Quiz
                            </span>
                          </Link>
                          <Link href={`/track/${track.key}/flashcards`}>
                            <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1">
                              <ListMusic className="w-3 h-3" /> Cards
                            </span>
                          </Link>
                          <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {tracks.length === 0 && (
            <div className="text-center py-20 text-sm text-muted-foreground">
              No tracks loaded. Run{' '}
              <code className="font-mono px-1.5 py-0.5 rounded bg-muted">
                python3 scripts/build_tracks_data.py
              </code>
              .
            </div>
          )}

          {/* ── Cross-Track Reference ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ScrollText className="w-4 h-4 text-primary" />
              <h2
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Cross-Track Reference
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <button
                onClick={() => setShowTax((v) => !v)}
                className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3
                    className="text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Verified 2026 Tax Reference
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  IRS-published numbers for the 2026 exam year — contribution
                  limits, brackets, exemptions, and OBBBA changes. Used as the
                  source of truth across every track.
                </p>
                <p className="text-[10px] font-mono text-primary mt-2">
                  {showTax ? 'Hide' : 'Show'} reference
                </p>
              </button>

              <button
                onClick={() => setShowMaster((v) => !v)}
                className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3
                    className="text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Master Study Manual
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dataset.master_manual.sections_count} sections ·{' '}
                  {dataset.master_manual.word_count.toLocaleString()} words from
                  the capstone manual — high-level frameworks that map
                  every track back to core fundamentals.
                </p>
                <p className="text-[10px] font-mono text-primary mt-2">
                  {showMaster ? 'Hide' : 'Show'} sections
                </p>
              </button>
            </div>

            {showTax && dataset.reference.tax_reference_markdown && (
              <motion.pre
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-5 rounded-xl border border-border bg-card text-[11px] font-mono whitespace-pre-wrap text-foreground/90 overflow-x-auto"
              >
                {dataset.reference.tax_reference_markdown}
              </motion.pre>
            )}

            {showMaster && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-4"
              >
                {dataset.master_manual.sections.map((sec, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <h4
                      className="text-sm font-semibold mb-2"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {sec.title}
                    </h4>
                    {sec.paragraphs.map((p, pi) => (
                      <p
                        key={pi}
                        className="text-xs text-muted-foreground leading-relaxed mb-2 last:mb-0"
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                ))}
              </motion.div>
            )}
          </section>
        </div>
      </div>
    </Navigation>
  );
}
