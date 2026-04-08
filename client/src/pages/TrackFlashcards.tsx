/**
 * TrackFlashcards — flashcard study mode for a single exam track.
 *
 * Term on the front, definition on the back, with reveal / rate keyboard
 * shortcuts (Space to reveal, ← Still Learning / → Got It).  Cards can be
 * filtered by chapter (extracted from the WealthBridge flashcard files).
 */

import Navigation from '@/components/Navigation';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ListMusic,
  Eye,
  Check,
  X,
  RotateCcw,
  Shuffle,
} from 'lucide-react';
import { useTrack } from '@/hooks/useTracks';
import { useMastery } from '@/contexts/MasteryContext';
import { TRACK_META, type TrackFlashcard } from '@/data/types';
import NotFound from './NotFound';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TrackFlashcards() {
  const [, params] = useRoute('/track/:key/flashcards');
  const trackKey = params?.key;
  const track = useTrack(trackKey);

  const [chapter, setChapter] = useState<string>('all');
  const [order, setOrder] = useState<TrackFlashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ known: 0, unknown: 0 });
  const { mastery, markSeen, setConfidence, incrementStreak, resetStreak } =
    useMastery();

  const allCards: TrackFlashcard[] = useMemo(
    () => track?.flashcards ?? [],
    [track],
  );

  const chapterOptions = useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((c) => {
      if (c.chapter) set.add(c.chapter);
    });
    return Array.from(set).sort();
  }, [allCards]);

  const startNewDeck = useCallback(() => {
    let pool = allCards;
    if (chapter !== 'all') {
      pool = pool.filter((c) => c.chapter === chapter);
    }
    setOrder(shuffle(pool));
    setIndex(0);
    setRevealed(false);
    setStats({ known: 0, unknown: 0 });
  }, [allCards, chapter]);

  // Build initial deck whenever the track or chapter filter changes.
  useEffect(() => {
    startNewDeck();
  }, [startNewDeck]);

  const current = order[index];
  const isFinished = order.length > 0 && index >= order.length;

  const rate = useCallback(
    (known: boolean) => {
      if (!current || !track) return;
      const key = `track-${track.key}-card-${current.id}`;
      markSeen(key);
      setConfidence(key, known ? 4 : 1);
      if (known) incrementStreak();
      else resetStreak();
      setStats((s) => ({
        known: s.known + (known ? 1 : 0),
        unknown: s.unknown + (known ? 0 : 1),
      }));
      setIndex((p) => p + 1);
      setRevealed(false);
    },
    [current, incrementStreak, markSeen, resetStreak, setConfidence, track],
  );

  // Per-track mastery tally — used in the header progress chip.
  const trackMasteryStats = useMemo(() => {
    if (!track) return { mastered: 0, seen: 0 };
    let mastered = 0;
    let seen = 0;
    for (const card of allCards) {
      const k = `track-${track.key}-card-${card.id}`;
      const m = mastery[k];
      if (m?.seen) seen += 1;
      if (m?.mastered || (m?.confidence ?? 0) >= 4) mastered += 1;
    }
    return { mastered, seen };
  }, [allCards, mastery, track]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (!current) return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'y') {
          e.preventDefault();
          rate(true);
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          rate(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, rate, revealed]);

  if (!track) return <NotFound />;
  const meta = TRACK_META[track.key] ?? {
    color: 'var(--primary)',
    tagline: track.subtitle,
    emoji: '📘',
  };

  return (
    <Navigation>
      <div className="min-h-screen">
        <div
          className="px-6 lg:px-10 py-5 border-b border-border"
          style={{ background: `linear-gradient(180deg, ${meta.color}14, transparent)` }}
        >
          <div className="flex items-center gap-3">
            <Link href={`/track/${track.key}`}>
              <motion.div
                whileHover={{ x: -2 }}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <ListMusic className="w-5 h-5 text-primary" />
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {track.name} — Flashcards
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {allCards.length} cards from the WealthBridge library
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {trackMasteryStats.seen > 0 && (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-accent text-muted-foreground"
                  title="Cards mastered / cards seen"
                >
                  {trackMasteryStats.mastered}/{trackMasteryStats.seen} mastered
                </span>
              )}
              {order.length > 0 && !isFinished && (
                <span className="text-xs font-mono text-muted-foreground">
                  {index + 1} / {order.length}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8 max-w-2xl mx-auto space-y-6">
          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chapter
            </label>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All chapters ({allCards.length})</option>
              {chapterOptions.map((ch) => {
                const n = allCards.filter((c) => c.chapter === ch).length;
                return (
                  <option key={ch} value={ch}>
                    {ch} ({n})
                  </option>
                );
              })}
            </select>
            <button
              onClick={startNewDeck}
              className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" /> Shuffle
            </button>
          </div>

          {allCards.length === 0 ? (
            <div className="text-center py-20 text-sm text-muted-foreground">
              No flashcards in this track yet.
            </div>
          ) : isFinished ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Deck complete
              </h2>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div>
                  <p className="font-mono text-2xl text-green-500">
                    {stats.known}
                  </p>
                  <p className="text-xs text-muted-foreground">Got It</p>
                </div>
                <div>
                  <p className="font-mono text-2xl text-destructive">
                    {stats.unknown}
                  </p>
                  <p className="text-xs text-muted-foreground">Still Learning</p>
                </div>
              </div>
              <button
                onClick={startNewDeck}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                <RotateCcw className="w-4 h-4" /> New Deck
              </button>
            </motion.div>
          ) : current ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${current.id}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="space-y-5"
              >
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: meta.color }}
                    animate={{
                      width: `${((index + 1) / order.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="p-8 rounded-2xl border border-border bg-card min-h-[240px] flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                    {current.chapter || 'Term'}
                  </p>
                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {current.term}
                  </h3>
                  {revealed ? (
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {current.definition}
                    </p>
                  ) : (
                    <button
                      onClick={() => setRevealed(true)}
                      className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Eye className="w-4 h-4" /> Reveal Definition (Space)
                    </button>
                  )}
                </div>

                {revealed && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => rate(false)}
                      className="flex-1 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Still Learning
                    </button>
                    <button
                      onClick={() => rate(true)}
                      className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Got It
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </Navigation>
  );
}
