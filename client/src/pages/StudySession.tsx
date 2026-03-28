/**
 * DESIGN: The Atelier — Focused Study Session
 * Flashcard-style sequential study with keyboard navigation
 * Spaced repetition integration, confidence rating, progress tracking
 * Keyboard: Space=reveal, 1-5=confidence, →=next, ←=prev, Esc=exit
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link, useLocation } from 'wouter';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '@/data/types';
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Star, Keyboard,
  RotateCcw, Shuffle, Filter, ChevronDown, Zap, Clock
} from 'lucide-react';

type StudyMode = 'all' | 'due' | 'unseen' | 'weak';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function unslugify(slug: string): string {
  const all = Array.from(new Set((embaData.definitions || []).map((d: any) => d.discipline)));
  return all.find((d: string) => slugify(d) === slug) || slug;
}

export default function StudySession() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const discipline = slug ? unslugify(slug) : null;
  const color = discipline ? (DISCIPLINE_COLORS[discipline] || 'var(--primary)') : 'var(--primary)';
  const icon = discipline ? (DISCIPLINE_ICONS[discipline] || '📚') : '📚';

  const { mastery, markSeen, setConfidence, getDueItems, getNextReviewTime } = useMastery();

  const [mode, setMode] = useState<StudyMode>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [sessionStats, setSessionStats] = useState({ studied: 0, rated: 0, startTime: Date.now() });

  const allDefs = useMemo(() =>
    (embaData.definitions || []).filter((d: any) => !discipline || d.discipline === discipline),
    [discipline]
  );

  const dueItemKeys = useMemo(() => getDueItems(), [getDueItems]);

  const items = useMemo(() => {
    let filtered = allDefs;

    if (mode === 'due') {
      const dueSet = new Set(dueItemKeys);
      filtered = filtered.filter((d: any) => {
        const key = `def-${d.discipline}-${d.id}`;
        return dueSet.has(key);
      });
    } else if (mode === 'unseen') {
      filtered = filtered.filter((d: any) => {
        const key = `def-${d.discipline}-${d.id}`;
        return !mastery[key]?.seen;
      });
    } else if (mode === 'weak') {
      filtered = filtered.filter((d: any) => {
        const key = `def-${d.discipline}-${d.id}`;
        return mastery[key]?.seen && (mastery[key]?.confidence || 0) < 3;
      });
    }

    if (shuffled) {
      const copy = [...filtered];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    return filtered;
  }, [allDefs, mode, mastery, dueItemKeys, shuffled]);

  const current = items[currentIndex];
  const currentKey = current ? `def-${current.discipline}-${current.id}` : '';
  const currentState = currentKey ? mastery[currentKey] : undefined;
  const nextReview = currentKey ? getNextReviewTime(currentKey) : null;

  const goNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setRevealed(false);
    }
  }, [currentIndex, items.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setRevealed(false);
    }
  }, [currentIndex]);

  const reveal = useCallback(() => {
    setRevealed(true);
    if (current && !mastery[currentKey]?.seen) {
      markSeen(currentKey);
      setSessionStats(prev => ({ ...prev, studied: prev.studied + 1 }));
    }
  }, [current, currentKey, mastery, markSeen]);

  const rate = useCallback((level: number) => {
    if (current) {
      setConfidence(currentKey, level);
      setSessionStats(prev => ({ ...prev, rated: prev.rated + 1 }));
      // Auto-advance after rating
      setTimeout(() => goNext(), 300);
    }
  }, [current, currentKey, setConfidence, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!revealed) reveal();
          break;
        case 'ArrowRight':
        case 'j':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'k':
          e.preventDefault();
          goPrev();
          break;
        case '1': case '2': case '3': case '4': case '5':
          if (revealed) {
            e.preventDefault();
            rate(parseInt(e.key));
          }
          break;
        case 'Escape':
          e.preventDefault();
          setLocation(discipline ? `/discipline/${slug}` : '/');
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [revealed, reveal, goNext, goPrev, rate, setLocation, discipline, slug]);

  const elapsed = Math.floor((Date.now() - sessionStats.startTime) / 60000);

  return (
    <Navigation>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="px-6 lg:px-10 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={discipline ? `/discipline/${slug}` : '/'}>
                  <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </Link>
                {discipline && <span className="text-lg">{icon}</span>}
                <div>
                  <h1 className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    Study Session {discipline ? `— ${discipline}` : '— All Disciplines'}
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {currentIndex + 1} / {items.length} · {sessionStats.studied} studied · {elapsed}m elapsed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className={`p-2 rounded-lg transition-colors ${showKeyboard ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  <Keyboard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setShuffled(!shuffled); setCurrentIndex(0); setRevealed(false); }}
                  className={`p-2 rounded-lg transition-colors ${shuffled ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex items-center gap-1.5 mt-2">
              {([
                ['all', 'All', null],
                ['due', 'Due for Review', dueItemKeys.length],
                ['unseen', 'New', allDefs.filter((d: any) => !mastery[`def-${d.discipline}-${d.id}`]?.seen).length],
                ['weak', 'Weak (< 3★)', allDefs.filter((d: any) => mastery[`def-${d.discipline}-${d.id}`]?.seen && (mastery[`def-${d.discipline}-${d.id}`]?.confidence || 0) < 3).length],
              ] as [StudyMode, string, number | null][]).map(([key, label, count]) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); setCurrentIndex(0); setRevealed(false); }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                    mode === key ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}{count !== null ? ` (${count})` : ''}
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                animate={{ width: `${items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts help */}
        <AnimatePresence>
          {showKeyboard && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-border bg-accent/50"
            >
              <div className="px-6 lg:px-10 py-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">Space</kbd> Reveal</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">→</kbd> Next</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">←</kbd> Previous</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">1-5</kbd> Rate confidence</span>
                <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono text-[10px]">Esc</kbd> Exit</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main flashcard area */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-10 py-10">
          {items.length === 0 ? (
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {mode === 'due' ? 'No items due for review!' : mode === 'unseen' ? 'All items studied!' : mode === 'weak' ? 'No weak items!' : 'No items found'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {mode === 'due' ? 'Come back later — spaced repetition will surface items when they\'re ready.' : 'Try a different study mode.'}
              </p>
              <Link href={discipline ? `/discipline/${slug}` : '/'}>
                <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                  Back to {discipline || 'Dashboard'}
                </button>
              </Link>
            </div>
          ) : current ? (
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id + '-' + currentIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="relative"
                >
                  {/* Card */}
                  <div
                    className="rounded-2xl border-2 bg-card p-8 lg:p-10 min-h-[320px] flex flex-col cursor-pointer select-none"
                    style={{ borderColor: revealed ? color : 'var(--border)' }}
                    onClick={() => !revealed && reveal()}
                  >
                    {/* Discipline badge */}
                    <div className="flex items-center gap-2 mb-6">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full text-primary-foreground"
                        style={{ background: DISCIPLINE_COLORS[current.discipline] || color }}
                      >
                        {current.discipline}
                      </span>
                      {nextReview && nextReview > Date.now() && (
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Next review: {new Date(nextReview).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Term */}
                    <h2
                      className="text-2xl lg:text-3xl font-bold mb-6 leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {current.term}
                    </h2>

                    {/* Definition (revealed) */}
                    <AnimatePresence>
                      {revealed ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex-1"
                        >
                          <p className="text-base text-muted-foreground leading-relaxed">
                            {current.definition}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div className="flex-1 flex items-center justify-center">
                          <div className="text-center">
                            <EyeOff className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click or press <kbd className="px-1.5 py-0.5 rounded bg-accent border border-border font-mono text-[10px]">Space</kbd> to reveal
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Confidence rating (after reveal) */}
                    {revealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-6 pt-4 border-t border-border"
                      >
                        <p className="text-xs text-muted-foreground mb-2">Rate your confidence:</p>
                        <div className="flex items-center gap-2">
                          {[
                            { level: 1, label: 'No idea', color: '#ef4444' },
                            { level: 2, label: 'Vague', color: '#f97316' },
                            { level: 3, label: 'Okay', color: '#eab308' },
                            { level: 4, label: 'Good', color: '#22c55e' },
                            { level: 5, label: 'Mastered', color: '#10b981' },
                          ].map(({ level, label, color: c }) => (
                            <motion.button
                              key={level}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); rate(level); }}
                              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border-2 ${
                                (currentState?.confidence || 0) >= level
                                  ? 'text-white border-transparent'
                                  : 'bg-card text-muted-foreground border-border hover:border-current'
                              }`}
                              style={(currentState?.confidence || 0) >= level ? { background: c, borderColor: c } : {}}
                            >
                              <span className="block font-mono text-[10px] mb-0.5">{level}</span>
                              {label}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation arrows */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-accent text-foreground hover:bg-accent/80"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>

                <span className="text-xs text-muted-foreground font-mono">
                  {currentIndex + 1} / {items.length}
                </span>

                <button
                  onClick={goNext}
                  disabled={currentIndex >= items.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-primary-foreground"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Navigation>
  );
}
