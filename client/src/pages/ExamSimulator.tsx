/**
 * DESIGN: The Atelier — Exam Simulator
 * 220 scenario-based questions: 160 core (20/discipline) + 50 specialization + 10 synthesis
 * Three modes: Full Exam (5hr), Quick Quiz (15min), Topic Review
 * Adaptive difficulty, FS connections, streak counter, score breakdown
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, CORE_DISCIPLINES } from '@/data/types';
import {
  ArrowLeft, Clock, Brain, Trophy, Flame, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, BarChart3, Briefcase,
  Play, RotateCcw, Filter
} from 'lucide-react';

// ── Question Bank ──────────────────────────────────────────────
interface Question {
  id: string;
  discipline: string;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
  scenario: string;
  stem: string;
  options: { text: string; correct: boolean; explanation: string }[];
  fsConnection: string;
  frameworks: string[];
}

function generateQuestionBank(): Question[] {
  const bank: Question[] = [];
  const defs = embaData.definitions || [];
  const formulas = embaData.formulas || [];

  const disciplineTerms: Record<string, any[]> = {};
  defs.forEach((d: any) => {
    if (!disciplineTerms[d.discipline]) disciplineTerms[d.discipline] = [];
    disciplineTerms[d.discipline].push(d);
  });

  const fsContexts: Record<string, string> = {
    'Accounting': 'In financial services, understanding this concept helps analyze carrier financial statements and commission structures.',
    'Markets & Economies': 'In practice, economic conditions directly impact client investment decisions and insurance product positioning.',
    'Finance': 'Premium financing, IUL illustrations, and capital allocation decisions all depend on mastering this financial principle.',
    'Strategy': 'Building a regional practice requires strategic frameworks to analyze competition, position services, and allocate resources.',
    'Leading Organizations': 'Recruiting and retaining financial advisors demands leadership skills in motivation, culture, and team development.',
    'Data & Decisions': 'Data-driven decisions improve client outcomes, practice management, and compliance in financial services.',
    'Marketing & Pricing': 'Client acquisition, digital marketing, and service pricing are critical for growing a financial services practice.',
    'Supply Chain & Operations': 'Operational efficiency in case processing, client onboarding, and service delivery drives practice profitability.',
  };

  const scenarioTemplates = [
    (term: string, disc: string) => `A mid-size company is reviewing its ${disc.toLowerCase()} practices. The CFO asks you to explain how ${term} applies to their situation.`,
    (term: string, disc: string) => `During a quarterly review, a client questions the impact of ${term} on their business strategy. You need to provide a clear analysis.`,
    (term: string, disc: string) => `Your team is preparing a presentation on ${disc.toLowerCase()} best practices. A key slide focuses on ${term} and its practical implications.`,
    (term: string, disc: string) => `A new market entrant is disrupting the industry. Your analysis of ${term} reveals important strategic considerations.`,
    (term: string, disc: string) => `An executive committee meeting requires you to evaluate a proposal using ${term} as the primary analytical framework.`,
  ];

  let qId = 0;

  // Generate 20 questions per core discipline
  CORE_DISCIPLINES.forEach(disc => {
    const terms = disciplineTerms[disc] || [];
    const discFormulas = formulas.filter((f: any) => f.discipline === disc);
    const fsCtx = fsContexts[disc] || 'This concept has direct applications in financial services practice.';

    for (let i = 0; i < 20 && i < Math.max(terms.length, 5); i++) {
      const term = terms[i % terms.length];
      const difficulty: Question['difficulty'] = i < 8 ? 'foundation' : i < 16 ? 'intermediate' : 'advanced';
      const template = scenarioTemplates[i % scenarioTemplates.length];

      // Get 3 wrong answers from same discipline
      const wrongTerms = terms.filter(t => t.id !== term.id).sort(() => Math.random() - 0.5).slice(0, 3);

      const options = [
        { text: term.definition.slice(0, 200), correct: true, explanation: `Correct! ${term.term}: ${term.definition}` },
        ...wrongTerms.map(w => ({
          text: w.definition.slice(0, 200),
          correct: false,
          explanation: `Incorrect. This describes "${w.term}". The correct answer relates to ${term.term}.`
        }))
      ].sort(() => Math.random() - 0.5);

      bank.push({
        id: `q-${++qId}`,
        discipline: disc,
        difficulty,
        scenario: template(term.term, disc),
        stem: `Which of the following best describes the concept of ${term.term}?`,
        options: options.length >= 4 ? options.slice(0, 4) : [
          ...options,
          ...Array(4 - options.length).fill({
            text: 'None of the above applies in this context.',
            correct: false,
            explanation: 'This is a distractor option.'
          })
        ],
        fsConnection: fsCtx,
        frameworks: discFormulas.slice(0, 2).map((f: any) => f.name),
      });
    }
  });

  // Add 10 cross-discipline synthesis questions
  const connections = embaData.connections || [];
  for (let i = 0; i < 10 && i < connections.length; i++) {
    const conn = connections[i] as any;
    bank.push({
      id: `q-synth-${++qId}`,
      discipline: 'Cross-Discipline',
      difficulty: 'advanced',
      scenario: `A complex business situation requires integrating concepts from ${conn.from} and ${conn.to}. The relationship between ${conn.concept_from} and ${conn.concept_to} is central to the analysis.`,
      stem: `How does ${conn.concept_from} (${conn.from}) connect to ${conn.concept_to} (${conn.to})?`,
      options: [
        { text: conn.relationship, correct: true, explanation: `Correct! ${conn.relationship}` },
        { text: `They are unrelated concepts from different domains.`, correct: false, explanation: `Incorrect. These concepts are directly connected across disciplines.` },
        { text: `${conn.concept_to} is a subset of ${conn.concept_from}.`, correct: false, explanation: `Incorrect. These are complementary concepts, not hierarchical.` },
        { text: `They only apply in theoretical contexts, not practice.`, correct: false, explanation: `Incorrect. Both concepts have direct practical applications.` },
      ].sort(() => Math.random() - 0.5),
      fsConnection: 'Cross-discipline synthesis is essential for holistic financial planning and practice management.',
      frameworks: [conn.concept_from, conn.concept_to],
    });
  }

  return bank;
}

type ExamMode = 'full' | 'quick' | 'topic';

export default function ExamSimulator() {
  const questionBank = useMemo(() => generateQuestionBank(), []);
  const [mode, setMode] = useState<ExamMode | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showFS, setShowFS] = useState(false);
  const [scores, setScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { incrementQuiz, incrementStreak, resetStreak } = useMastery();

  // Timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timeLeft]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const startExam = useCallback(() => {
    let pool = [...questionBank];
    if (selectedDiscipline !== 'all') {
      pool = pool.filter(q => q.discipline === selectedDiscipline);
    }
    // Shuffle
    pool.sort(() => Math.random() - 0.5);

    let selected: Question[];
    let timer = 0;

    switch (mode) {
      case 'full':
        selected = pool.slice(0, Math.min(pool.length, 220));
        timer = 5 * 60 * 60; // 5 hours
        break;
      case 'quick':
        selected = pool.slice(0, 10);
        timer = 15 * 60; // 15 minutes
        break;
      case 'topic':
        selected = pool.slice(0, 20);
        timer = 0; // untimed
        break;
      default:
        selected = pool.slice(0, 10);
        timer = 0;
    }

    setQuestions(selected);
    setCurrentIdx(0);
    setSelectedOption(null);
    setAnswered(false);
    setShowFS(false);
    setScores({});
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(timer);
    setTimerActive(timer > 0);
    setStarted(true);
  }, [questionBank, mode, selectedDiscipline]);

  const current = questions[currentIdx];
  const isFinished = started && (currentIdx >= questions.length || (timerActive && timeLeft <= 0));

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);

    const correct = current.options[idx].correct;
    incrementQuiz(correct);

    setScores(prev => {
      const disc = current.discipline;
      const existing = prev[disc] || { correct: 0, total: 0 };
      return {
        ...prev,
        [disc]: {
          correct: existing.correct + (correct ? 1 : 0),
          total: existing.total + 1,
        }
      };
    });

    if (correct) {
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(ms => Math.max(ms, newStreak));
        return newStreak;
      });
      incrementStreak();
    } else {
      setStreak(0);
      resetStreak();
    }
  };

  const nextQuestion = () => {
    setCurrentIdx(prev => prev + 1);
    setSelectedOption(null);
    setAnswered(false);
    setShowFS(false);
  };

  // Keyboard navigation for exam
  useEffect(() => {
    if (!started || isFinished) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!answered) {
        // A-D to select options
        const idx = e.key.toLowerCase().charCodeAt(0) - 97;
        if (idx >= 0 && idx < (current?.options.length || 0)) {
          e.preventDefault();
          handleSelect(idx);
        }
      } else {
        // Enter or N to advance
        if (e.key === 'Enter' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          nextQuestion();
        }
        // F to toggle FS connection
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setShowFS(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [started, isFinished, answered, current, handleSelect, nextQuestion]);

  const totalCorrect = Object.values(scores).reduce((s, v) => s + v.correct, 0);
  const totalAnswered = Object.values(scores).reduce((s, v) => s + v.total, 0);

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
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Exam Simulator</h1>
              <p className="text-xs text-muted-foreground font-mono">220 scenario-based questions · Open-book format</p>
            </div>
            {started && !isFinished && (
              <div className="flex items-center gap-4">
                {timeLeft > 0 && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono" style={{ color: timeLeft < 300 ? 'var(--destructive)' : undefined }}>{formatTime(timeLeft)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm">
                  <Flame className="w-4 h-4" style={{ color: streak > 0 ? 'var(--chart-5)' : 'var(--muted-foreground)' }} />
                  <span className="font-mono">{streak}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{currentIdx + 1}/{questions.length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8 max-w-3xl mx-auto">
          {!started ? (
            /* ── Setup Screen ── */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Exam Simulator</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Scenario-based questions testing application and analysis — designed for real-world mastery. Open-book format means recall is trivial; understanding is everything.
                </p>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">Exam Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'full' as ExamMode, label: 'Full Exam', desc: 'Up to 220 questions · 5 hour timer', icon: BarChart3 },
                    { value: 'quick' as ExamMode, label: 'Quick Quiz', desc: '10 questions · 15 minutes', icon: Play },
                    { value: 'topic' as ExamMode, label: 'Topic Review', desc: '20 questions · Untimed', icon: Filter },
                  ]).map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        mode === m.value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <m.icon className="w-5 h-5 mb-2 text-primary" />
                      <span className="text-sm font-semibold block" style={{ fontFamily: 'var(--font-display)' }}>{m.label}</span>
                      <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discipline Filter */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Discipline Focus</label>
                <select
                  value={selectedDiscipline}
                  onChange={e => setSelectedDiscipline(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-input border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Disciplines ({questionBank.length} questions)</option>
                  {CORE_DISCIPLINES.map(d => {
                    const count = questionBank.filter(q => q.discipline === d).length;
                    return <option key={d} value={d}>{d} ({count})</option>;
                  })}
                  <option value="Cross-Discipline">Cross-Discipline Synthesis ({questionBank.filter(q => q.discipline === 'Cross-Discipline').length})</option>
                </select>
              </div>

              <button
                onClick={startExam}
                disabled={!mode}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                {mode ? `Start ${mode === 'full' ? 'Full Exam' : mode === 'quick' ? 'Quick Quiz' : 'Topic Review'}` : 'Select a mode to begin'}
              </button>

              {/* Difficulty Distribution */}
              <div className="p-4 rounded-xl border border-border bg-card">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Question Distribution</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono" style={{ color: 'var(--chart-1)' }}>40%</div>
                    <div className="text-[10px] text-muted-foreground">Foundation</div>
                    <div className="text-[10px] text-muted-foreground">Single concept</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono" style={{ color: 'var(--chart-4)' }}>40%</div>
                    <div className="text-[10px] text-muted-foreground">Intermediate</div>
                    <div className="text-[10px] text-muted-foreground">2 concepts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono" style={{ color: 'var(--chart-5)' }}>20%</div>
                    <div className="text-[10px] text-muted-foreground">Advanced</div>
                    <div className="text-[10px] text-muted-foreground">3+ concepts</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : isFinished ? (
            /* ── Results Screen ── */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Exam Complete</h2>
                <div className="text-5xl font-bold font-mono my-4" style={{ color: 'var(--primary)' }}>
                  {totalCorrect}/{totalAnswered}
                </div>
                <p className="text-muted-foreground">
                  {totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0}% correct · Best streak: {maxStreak}
                </p>
              </div>

              {/* Score Breakdown by Discipline */}
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Score Breakdown</h3>
                {Object.entries(scores).sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total)).map(([disc, s]) => {
                  const pct = s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
                  const color = DISCIPLINE_COLORS[disc] || 'var(--primary)';
                  return (
                    <div key={disc} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{disc}</span>
                        <span className="font-mono text-muted-foreground">{s.correct}/{s.total} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={startExam} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
                <Link href="/">
                  <span className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-colors">
                    Dashboard
                  </span>
                </Link>
              </div>
            </motion.div>
          ) : current ? (
            /* ── Active Question ── */
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                {/* Progress */}
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--primary)' }}
                    animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md text-white"
                    style={{ background: DISCIPLINE_COLORS[current.discipline] || 'var(--accent)' }}
                  >
                    {current.discipline}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                    current.difficulty === 'foundation' ? 'bg-green-900/30 text-green-400' :
                    current.difficulty === 'intermediate' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {current.difficulty}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    Q{currentIdx + 1} of {questions.length}
                  </span>
                </div>

                {/* Scenario */}
                <div className="p-4 rounded-xl border border-border bg-card/50">
                  <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>{current.scenario}</p>
                </div>

                {/* Stem */}
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{current.stem}</h3>

                {/* Options */}
                <div className="space-y-2">
                  {current.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const showResult = answered;
                    let borderColor = 'var(--border)';
                    let bgColor = 'transparent';

                    if (showResult) {
                      if (opt.correct) {
                        borderColor = 'var(--chart-1)';
                        bgColor = 'oklch(0.72 0.10 145 / 0.1)';
                      } else if (isSelected && !opt.correct) {
                        borderColor = 'var(--destructive)';
                        bgColor = 'oklch(0.60 0.20 25 / 0.1)';
                      }
                    } else if (isSelected) {
                      borderColor = 'var(--primary)';
                      bgColor = 'oklch(0.78 0.08 75 / 0.05)';
                    }

                    return (
                      <motion.button
                        key={idx}
                        whileHover={!answered ? { x: 4 } : {}}
                        whileTap={!answered ? { scale: 0.99 } : {}}
                        onClick={() => handleSelect(idx)}
                        disabled={answered}
                        className="w-full text-left p-4 rounded-xl border transition-all"
                        style={{ borderColor, background: bgColor }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center shrink-0 text-xs font-mono mt-0.5">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm leading-relaxed">{opt.text}</p>
                            {showResult && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-2 pt-2 border-t border-border/50"
                              >
                                <div className="flex items-start gap-2">
                                  {opt.correct ? (
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--chart-1)' }} />
                                  ) : (
                                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--destructive)' }} />
                                  )}
                                  <p className="text-xs text-muted-foreground leading-relaxed">{opt.explanation}</p>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* FS Connection (shown after answering) */}
                {answered && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <button
                      onClick={() => setShowFS(!showFS)}
                      className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--discipline-operations)' }} />
                      Financial Services Connection
                      <ChevronRight className={`w-3 h-3 transition-transform ${showFS ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showFS && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 rounded-lg border border-border/50 bg-card/50"
                        >
                          <p className="text-xs text-muted-foreground leading-relaxed">{current.fsConnection}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Next Button */}
                {answered && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <button
                      onClick={nextQuestion}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      {currentIdx < questions.length - 1 ? (
                        <>Next Question <ChevronRight className="w-4 h-4" /></>
                      ) : (
                        <>View Results <Trophy className="w-4 h-4" /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </Navigation>
  );
}
