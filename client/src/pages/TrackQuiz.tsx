/**
 * TrackQuiz — practice exam runner for a single WealthBridge track.
 *
 * Loads the parsed practice questions from tracks_data.json, optionally
 * shuffles them, and walks the user through one at a time with immediate
 * feedback.  Score is reported at the end with per-question review.  This
 * intentionally lives outside the existing global QuizPage so the user can
 * focus on a single exam track without filtering across all 2,000+
 * definitions.
 */

import Navigation from '@/components/Navigation';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Brain,
  Shuffle,
  RotateCcw,
  Check,
  X,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { useTrack } from '@/hooks/useTracks';
import { useMastery } from '@/contexts/MasteryContext';
import BookmarkButton from '@/components/BookmarkButton';
import { TRACK_META, type TrackPracticeQuestion } from '@/data/types';
import NotFound from './NotFound';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface AnswerLog {
  question: TrackPracticeQuestion;
  selected: number;
  correct: boolean;
}

export default function TrackQuiz() {
  const [, params] = useRoute('/track/:key/quiz');
  const trackKey = params?.key;
  const track = useTrack(trackKey);

  const [shuffleMode, setShuffleMode] = useState(true);
  const [started, setStarted] = useState(false);
  const [order, setOrder] = useState<TrackPracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [log, setLog] = useState<AnswerLog[]>([]);

  const { incrementQuiz, incrementStreak, resetStreak, markSeen, setConfidence } = useMastery();

  const questions = useMemo<TrackPracticeQuestion[]>(
    () => track?.practice_questions ?? [],
    [track],
  );

  const start = useCallback(() => {
    const list = shuffleMode ? shuffle(questions) : [...questions];
    setOrder(list);
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setLog([]);
    setStarted(true);
  }, [questions, shuffleMode]);

  const current = order[index];
  const isFinished = started && index >= order.length;

  const submit = useCallback(
    (idx: number) => {
      if (answered || !current || !track) return;
      setSelected(idx);
      setAnswered(true);
      const correct = idx === current.correct;
      const key = `track-${track.key}-q-${current.number}`;
      markSeen(key);
      setConfidence(key, correct ? 4 : 1);
      incrementQuiz(correct);
      if (correct) incrementStreak();
      else resetStreak();
      setLog((prev) => [...prev, { question: current, selected: idx, correct }]);
    },
    [
      answered,
      current,
      incrementQuiz,
      incrementStreak,
      markSeen,
      resetStreak,
      setConfidence,
      track,
    ],
  );

  const next = useCallback(() => {
    setIndex((p) => p + 1);
    setSelected(null);
    setAnswered(false);
  }, []);

  // Keyboard navigation: A/B/C/D to choose, Enter to advance
  useEffect(() => {
    if (!started || isFinished) return;
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const key = e.key.toLowerCase();
      if (!answered && key.length === 1 && 'abcdefghij'.includes(key)) {
        const idx = key.charCodeAt(0) - 97;
        if (current && idx >= 0 && idx < current.options.length) {
          e.preventDefault();
          submit(idx);
        }
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answered, current, isFinished, next, started, submit]);

  if (!track) return <NotFound />;
  const meta = TRACK_META[track.key] ?? {
    color: 'var(--primary)',
    tagline: track.subtitle,
    emoji: '📘',
  };
  const correctCount = log.filter((a) => a.correct).length;

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
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
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <h1
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {track.name} — Practice Exam
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {questions.length} questions sourced from the official manual
              </p>
            </div>
            {started && !isFinished && order.length > 0 && (
              <span className="ml-auto text-xs font-mono text-muted-foreground">
                {index + 1} / {order.length}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8 max-w-2xl mx-auto">
          {!started ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center py-6">
                <Brain className="w-12 h-12 mx-auto text-primary mb-3" />
                <h2
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Ready when you are.
                </h2>
                <p className="text-sm text-muted-foreground">
                  {questions.length} questions · keyboard A/B/C/D supported
                </p>
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleMode}
                  onChange={(e) => setShuffleMode(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <Shuffle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Shuffle question order</p>
                  <p className="text-xs text-muted-foreground">
                    Mix the question order each attempt to avoid memorising sequence
                  </p>
                </div>
              </label>

              <button
                onClick={start}
                disabled={questions.length === 0}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                Start Practice Exam
              </button>
              {questions.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  No practice questions in this track yet — try the flashcards
                  instead.
                </p>
              )}
            </motion.div>
          ) : isFinished ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <Trophy className="w-14 h-14 mx-auto text-primary" />
                <h2
                  className="text-3xl font-bold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Exam Complete
                </h2>
                <div
                  className="text-5xl font-bold font-mono"
                  style={{ color: meta.color }}
                >
                  {correctCount}/{order.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.length > 0
                    ? Math.round((correctCount / order.length) * 100)
                    : 0}
                  % correct
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={start}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  <RotateCcw className="w-4 h-4" /> Retake
                </button>
                <Link href={`/track/${track.key}`}>
                  <span className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
                    <ChevronRight className="w-4 h-4" /> Back to Track
                  </span>
                </Link>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Review
                </h3>
                {log.map((entry, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {entry.correct ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-medium">
                        {entry.question.number}. {entry.question.prompt}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Answer: {entry.question.options[entry.question.correct]}
                    </p>
                    {entry.question.explanation && (
                      <p className="text-xs text-foreground/80 ml-6 mt-1">
                        {entry.question.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : current ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
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

                <div className="p-6 rounded-2xl border border-border bg-card">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    Question {current.number}
                  </p>
                  <p className="text-base leading-relaxed">{current.prompt}</p>
                </div>

                <div className="space-y-2">
                  {current.options.map((opt, idx) => {
                    const isCorrect = idx === current.correct;
                    const isPicked = selected === idx;
                    let cls =
                      'border-border bg-card hover:border-primary/30';
                    if (answered) {
                      if (isCorrect) {
                        cls = 'border-green-500 bg-green-500/10';
                      } else if (isPicked) {
                        cls = 'border-destructive bg-destructive/10';
                      } else {
                        cls = 'border-border bg-card opacity-60';
                      }
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => submit(idx)}
                        disabled={answered}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${cls}`}
                      >
                        <span className="text-[10px] font-mono mt-0.5 px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className="space-y-3">
                    <div
                      className={`p-4 rounded-xl border ${
                        selected === current.correct
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-destructive bg-destructive/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold">
                          {selected === current.correct
                            ? 'Correct.'
                            : `Answer: ${String.fromCharCode(
                                65 + current.correct,
                              )} — ${current.options[current.correct]}`}
                        </p>
                        <BookmarkButton
                          contentType="track_question"
                          contentId={`${track.key}-${current.number}`}
                          contentTitle={`${track.name} Q${current.number}: ${current.prompt.slice(0, 80)}`}
                          discipline={track.name}
                          size="sm"
                        />
                      </div>
                      {current.explanation && (
                        <p className="text-xs text-foreground/85">
                          {current.explanation}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={next}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                    >
                      {index + 1 === order.length
                        ? 'Finish Exam'
                        : 'Next Question'}
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
