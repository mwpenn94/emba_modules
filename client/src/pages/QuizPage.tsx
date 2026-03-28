/**
 * DESIGN: The Atelier — Quiz Arena
 * Flashcard-style quiz with multiple modes, streak tracking, and discipline filtering
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS } from '@/data/types';
import { ArrowLeft, Brain, RotateCcw, Check, X, Flame, Trophy, Shuffle, Eye, EyeOff } from 'lucide-react';

type QuizMode = 'flashcard' | 'multiple-choice' | 'type-answer';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPage() {
  const [mode, setMode] = useState<QuizMode>('flashcard');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [quizItems, setQuizItems] = useState<any[]>([]);

  const { session, incrementQuiz, incrementStreak, resetStreak, markSeen, setConfidence } = useMastery();

  const definitions = embaData.definitions || [];
  const disciplines = useMemo(() =>
    Array.from(new Set(definitions.map((d: any) => d.discipline))).sort(),
    [definitions]
  );

  const startQuiz = useCallback(() => {
    let pool = definitions;
    if (selectedDiscipline !== 'all') {
      pool = pool.filter((d: any) => d.discipline === selectedDiscipline);
    }
    const shuffled = shuffleArray(pool).slice(0, 20);
    setQuizItems(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setSelectedOption(null);
    setUserAnswer('');
    setAnswered(false);
    setStarted(true);
  }, [definitions, selectedDiscipline]);

  const current = quizItems[currentIndex];
  const isFinished = started && currentIndex >= quizItems.length;

  const generateOptions = useCallback((correct: any) => {
    const others = shuffleArray(definitions.filter((d: any) => d.id !== correct.id)).slice(0, 3);
    const options = shuffleArray([correct, ...others]);
    return options;
  }, [definitions]);

  const options = useMemo(() => {
    if (!current || mode !== 'multiple-choice') return [];
    return generateOptions(current);
  }, [current, mode, generateOptions]);

  const handleFlashcardRate = (confident: boolean) => {
    const key = `def-${current.discipline}-${current.id}`;
    markSeen(key);
    if (confident) {
      setConfidence(key, 4);
      incrementQuiz(true);
      incrementStreak();
    } else {
      setConfidence(key, 1);
      incrementQuiz(false);
      resetStreak();
    }
    nextQuestion();
  };

  const handleMCSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    const correct = options[idx].id === current.id;
    const key = `def-${current.discipline}-${current.id}`;
    markSeen(key);
    incrementQuiz(correct);
    if (correct) {
      setConfidence(key, 4);
      incrementStreak();
    } else {
      resetStreak();
    }
  };

  const handleTypeSubmit = () => {
    if (answered) return;
    setAnswered(true);
    const correct = userAnswer.toLowerCase().trim() === current.term.toLowerCase().trim();
    const key = `def-${current.discipline}-${current.id}`;
    markSeen(key);
    incrementQuiz(correct);
    if (correct) {
      setConfidence(key, 4);
      incrementStreak();
    } else {
      resetStreak();
    }
  };

  const nextQuestion = () => {
    setCurrentIndex(prev => prev + 1);
    setShowAnswer(false);
    setSelectedOption(null);
    setUserAnswer('');
    setAnswered(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!started || isFinished) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (mode === 'flashcard') {
        if (!showAnswer && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          setShowAnswer(true);
        } else if (showAnswer) {
          if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'y') {
            e.preventDefault();
            handleFlashcardRate(true);
          } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'n') {
            e.preventDefault();
            handleFlashcardRate(false);
          }
        }
      } else if (mode === 'multiple-choice') {
        if (!answered) {
          const idx = e.key.toLowerCase().charCodeAt(0) - 97;
          if (idx >= 0 && idx < options.length) {
            e.preventDefault();
            handleMCSelect(idx);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          nextQuestion();
        }
      } else if (mode === 'type-answer') {
        if (answered && e.key === 'Enter') {
          e.preventDefault();
          nextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, isFinished, mode, showAnswer, answered, options, handleFlashcardRate, handleMCSelect, nextQuestion]);

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-6 lg:px-10 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <Brain className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Quiz Arena</h1>
              <p className="text-xs text-muted-foreground font-mono">Test your knowledge across all disciplines</p>
            </div>
            {started && !isFinished && (
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <Flame className="w-4 h-4" style={{ color: session.streak > 0 ? 'var(--chart-5)' : 'var(--muted-foreground)' }} />
                  <span className="font-mono">{session.streak}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{currentIndex + 1}/{quizItems.length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8 max-w-2xl mx-auto">
          {!started ? (
            /* Setup Screen */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <Brain className="w-12 h-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Ready to Test?</h2>
                <p className="text-sm text-muted-foreground">Choose your mode and discipline, then begin.</p>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Quiz Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'flashcard', label: 'Flashcard', desc: 'Reveal & rate' },
                    { value: 'multiple-choice', label: 'Multiple Choice', desc: 'Pick the right term' },
                    { value: 'type-answer', label: 'Type Answer', desc: 'Recall the term' },
                  ] as { value: QuizMode; label: string; desc: string }[]).map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        mode === m.value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <span className="text-sm font-semibold block" style={{ fontFamily: 'var(--font-display)' }}>{m.label}</span>
                      <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discipline Selection */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Discipline</label>
                <select
                  value={selectedDiscipline}
                  onChange={e => setSelectedDiscipline(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-input border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Disciplines ({definitions.length} terms)</option>
                  {disciplines.map(d => {
                    const count = definitions.filter((def: any) => def.discipline === d).length;
                    return <option key={d} value={d}>{d} ({count})</option>;
                  })}
                </select>
              </div>

              <button
                onClick={startQuiz}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90"
              >
                Start Quiz (20 Questions)
              </button>
            </motion.div>
          ) : isFinished ? (
            /* Results Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <Trophy className="w-16 h-16 mx-auto text-primary" />
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Quiz Complete!</h2>
              <div className="text-5xl font-bold font-mono" style={{ color: 'var(--primary)' }}>
                {session.quizScore}/{session.quizTotal}
              </div>
              <p className="text-muted-foreground">
                {session.quizTotal > 0 ? Math.round(session.quizScore / session.quizTotal * 100) : 0}% correct
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={startQuiz} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <Link href="/">
                  <span className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
                    Dashboard
                  </span>
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Active Quiz */
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                {/* Progress bar */}
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--primary)' }}
                    animate={{ width: `${((currentIndex + 1) / quizItems.length) * 100}%` }}
                  />
                </div>

                {/* Discipline tag */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                    style={{ background: DISCIPLINE_COLORS[current.discipline] || 'var(--accent)', color: 'var(--primary-foreground)' }}
                  >
                    {current.discipline}
                  </span>
                </div>

                {mode === 'flashcard' && (
                  <div className="space-y-4">
                    <div className="p-8 rounded-2xl border border-border bg-card min-h-[200px] flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {!showAnswer ? (
                          <motion.div key="q" initial={{ rotateY: 0 }} exit={{ rotateY: 90 }} className="text-center">
                            <p className="text-lg text-muted-foreground leading-relaxed">{current.definition}</p>
                            <button
                              onClick={() => setShowAnswer(true)}
                              className="mt-4 flex items-center gap-2 mx-auto text-sm text-primary hover:underline"
                            >
                              <Eye className="w-4 h-4" /> Reveal Term
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="a" initial={{ rotateY: -90 }} animate={{ rotateY: 0 }} className="text-center">
                            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{current.term}</h3>
                            <p className="text-sm text-muted-foreground">{current.definition}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {showAnswer && (
                      <div className="flex gap-3">
                        <button onClick={() => handleFlashcardRate(false)} className="flex-1 py-3 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2">
                          <X className="w-4 h-4" /> Still Learning
                        </button>
                        <button onClick={() => handleFlashcardRate(true)} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-colors flex items-center justify-center gap-2">
                          <Check className="w-4 h-4" /> Got It
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {mode === 'multiple-choice' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl border border-border bg-card">
                      <p className="text-base leading-relaxed">{current.definition}</p>
                    </div>
                    <div className="space-y-2">
                      {options.map((opt: any, idx: number) => {
                        const isCorrect = opt.id === current.id;
                        const isSelected = selectedOption === idx;
                        let borderColor = 'border-border';
                        let bgColor = 'bg-card';
                        if (answered) {
                          if (isCorrect) { borderColor = 'border-green-500'; bgColor = 'bg-green-500/10'; }
                          else if (isSelected && !isCorrect) { borderColor = 'border-destructive'; bgColor = 'bg-destructive/10'; }
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => handleMCSelect(idx)}
                            disabled={answered}
                            className={`w-full text-left p-4 rounded-xl border ${borderColor} ${bgColor} transition-all hover:border-primary/30 disabled:hover:border-border`}
                          >
                            <span className="text-sm font-medium">{opt.term}</span>
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <button onClick={nextQuestion} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                        Next Question
                      </button>
                    )}
                  </div>
                )}

                {mode === 'type-answer' && (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl border border-border bg-card">
                      <p className="text-base leading-relaxed">{current.definition}</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !answered && handleTypeSubmit()}
                        placeholder="Type the term..."
                        disabled={answered}
                        className="flex-1 px-4 py-3 text-sm bg-input border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                      />
                      {!answered ? (
                        <button onClick={handleTypeSubmit} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                          Submit
                        </button>
                      ) : (
                        <button onClick={nextQuestion} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                          Next
                        </button>
                      )}
                    </div>
                    {answered && (
                      <div className={`p-4 rounded-xl border ${userAnswer.toLowerCase().trim() === current.term.toLowerCase().trim() ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}`}>
                        <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                          {userAnswer.toLowerCase().trim() === current.term.toLowerCase().trim() ? 'Correct!' : `Answer: ${current.term}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </Navigation>
  );
}
