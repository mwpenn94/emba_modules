/**
 * AI-Powered Quiz Generation
 * Uses LLM to dynamically generate questions from EMBA content.
 * Supports: multiple choice, fill-in-blank, scenario-based, explain-concept
 * Features: discipline/topic selector, difficulty control, feedback loop, question rating
 */
import { useState, useCallback, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { CORE_DISCIPLINES, SPECIALIZATION_DISCIPLINES, DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '@/data/types';
import { getLoginUrl } from '@/const';
import {
  Brain, Sparkles, ChevronRight, ChevronLeft, Check, X, RotateCcw,
  Loader2, Lightbulb, Star, ThumbsUp, ThumbsDown, ArrowRight,
  GraduationCap, Target, Zap, BookOpen, HelpCircle, MessageSquare
} from 'lucide-react';

interface QuizQuestion {
  questionText: string;
  options: { text: string; isCorrect: boolean }[] | null;
  correctAnswer: string;
  explanation: string;
}

type QuestionType = 'multiple_choice' | 'fill_blank' | 'scenario' | 'explain';
type Difficulty = 'easy' | 'medium' | 'hard';

const QUESTION_TYPES: { value: QuestionType; label: string; icon: any; desc: string }[] = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: Target, desc: 'Four options, one correct answer' },
  { value: 'fill_blank', label: 'Fill in the Blank', icon: BookOpen, desc: 'Complete the missing concept' },
  { value: 'scenario', label: 'Scenario-Based', icon: Lightbulb, desc: 'Real-world business situations' },
  { value: 'explain', label: 'Explain Concept', icon: MessageSquare, desc: 'Open-ended explanation' },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string; desc: string }[] = [
  { value: 'easy', label: 'Foundation', color: '#10B981', desc: 'Recall & recognition' },
  { value: 'medium', label: 'Application', color: '#F59E0B', desc: 'Analysis & application' },
  { value: 'hard', label: 'Mastery', color: '#EF4444', desc: 'Synthesis & evaluation' },
];

export default function AIQuiz() {
  const { user, loading: authLoading } = useAuth();
  const { incrementQuiz } = useMastery();

  // Setup state
  const [discipline, setDiscipline] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');
  const [count, setCount] = useState(5);

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'results'>('setup');

  // Get topics for selected discipline
  const disciplineDefinitions = embaData.definitions.filter((d: any) => d.discipline === discipline);
  const topics = Array.from(new Set(disciplineDefinitions.map((d: any) => d.term))).slice(0, 20);
  const allDisciplines = [...CORE_DISCIPLINES, ...SPECIALIZATION_DISCIPLINES].filter(d =>
    embaData.definitions.some((def: any) => def.discipline === d)
  );

  // Build context from discipline content
  const buildContext = useCallback(() => {
    const defs = embaData.definitions.filter((d: any) => d.discipline === discipline).slice(0, 15);
    const formulas = (embaData.formulas || []).filter((f: any) => f.discipline === discipline).slice(0, 5);
    const cases = (embaData.cases || []).filter((c: any) => c.discipline === discipline).slice(0, 3);

    let ctx = '';
    if (defs.length > 0) {
      ctx += 'Key Definitions:\n' + defs.map((d: any) => `- ${d.term}: ${d.definition}`).join('\n') + '\n\n';
    }
    if (formulas.length > 0) {
      ctx += 'Key Formulas:\n' + formulas.map((f: any) => `- ${f.name}: ${f.formula}`).join('\n') + '\n\n';
    }
    if (cases.length > 0) {
      ctx += 'Case Studies:\n' + cases.map((c: any) => `- ${c.title}: ${c.content.slice(0, 200)}...`).join('\n');
    }
    return ctx;
  }, [discipline]);

  // Generate quiz mutation
  const generateMutation = trpc.aiQuiz.generate.useMutation({
    onSuccess: (data) => {
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setPhase('quiz');
        setCurrentIndex(0);
        setScore(0);
        setAnswered(0);
        setQuizComplete(false);
      }
    },
  });

  const handleGenerate = () => {
    if (!discipline) return;
    const context = buildContext();
    generateMutation.mutate({
      discipline,
      topic: topic || undefined,
      difficulty,
      count,
      questionType,
      context: context || undefined,
    });
  };

  // Answer handling
  const handleMCAnswer = (optionIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(optionIndex);
    setShowExplanation(true);
    const isCorrect = questions[currentIndex]?.options?.[optionIndex]?.isCorrect || false;
    if (isCorrect) setScore(s => s + 1);
    setAnswered(a => a + 1);
    incrementQuiz(isCorrect);
  };

  const handleTextAnswer = () => {
    if (!userAnswer.trim()) return;
    setShowExplanation(true);
    setAnswered(a => a + 1);
    // For text answers, we show the explanation and let the user self-assess
  };

  const handleSelfAssess = (correct: boolean) => {
    if (correct) setScore(s => s + 1);
    incrementQuiz(correct);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setQuizComplete(true);
      setPhase('results');
      return;
    }
    setCurrentIndex(i => i + 1);
    setSelectedAnswer(null);
    setUserAnswer('');
    setShowExplanation(false);
  };

  const restartQuiz = () => {
    setPhase('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setAnswered(0);
    setQuizComplete(false);
    setSelectedAnswer(null);
    setUserAnswer('');
    setShowExplanation(false);
  };

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'quiz') return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const q = questions[currentIndex];
      if (!q) return;

      if (questionType === 'multiple_choice' && q.options && !showExplanation) {
        if (e.key === 'a' || e.key === 'A') handleMCAnswer(0);
        if (e.key === 'b' || e.key === 'B') handleMCAnswer(1);
        if (e.key === 'c' || e.key === 'C') handleMCAnswer(2);
        if (e.key === 'd' || e.key === 'D') handleMCAnswer(3);
      }
      if (showExplanation && (e.key === 'Enter' || e.key === 'n' || e.key === 'N')) {
        nextQuestion();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, currentIndex, showExplanation, questionType, questions]); // eslint-disable-line

  // Auth gate
  if (authLoading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Navigation>
    );
  }

  if (!user) {
    return (
      <Navigation>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Brain className="w-12 h-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Sign in to use AI Quiz</h2>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            AI-powered quiz generation requires authentication to track your progress and personalize questions.
          </p>
          <a href={getLoginUrl()} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Sign In
          </a>
        </div>
      </Navigation>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-6 lg:px-10 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                AI Quiz Generator
              </h1>
              <p className="text-xs text-muted-foreground">Dynamic questions powered by AI — tailored to your learning needs</p>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-8">
          <AnimatePresence mode="wait">
            {/* ── SETUP PHASE ── */}
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                {/* Discipline Selection */}
                <section>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Select Discipline
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {allDisciplines.map(d => (
                      <button
                        key={d}
                        onClick={() => { setDiscipline(d); setTopic(''); }}
                        className={`text-left p-3 rounded-lg border text-sm transition-all ${
                          discipline === d
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border hover:border-primary/30 text-foreground'
                        }`}
                      >
                        <span className="mr-1.5">{DISCIPLINE_ICONS[d] || '📚'}</span>
                        <span className="text-xs">{d}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Topic (optional) */}
                {discipline && topics.length > 0 && (
                  <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <BookOpen className="w-4 h-4 text-primary" />
                      Focus Topic <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTopic('')}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                          !topic ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30'
                        }`}
                      >
                        All Topics
                      </button>
                      {topics.map(t => (
                        <button
                          key={t}
                          onClick={() => setTopic(t)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                            topic === t ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/30'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </motion.section>
                )}

                {/* Question Type */}
                <section>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <HelpCircle className="w-4 h-4 text-primary" />
                    Question Type
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {QUESTION_TYPES.map(qt => {
                      const Icon = qt.icon;
                      return (
                        <button
                          key={qt.value}
                          onClick={() => setQuestionType(qt.value)}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            questionType === qt.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{qt.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{qt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Difficulty */}
                <section>
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Zap className="w-4 h-4 text-primary" />
                    Difficulty Level
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          difficulty === d.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: d.color }} />
                        <span className="text-sm font-medium block">{d.label}</span>
                        <span className="text-[10px] text-muted-foreground">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Question Count */}
                <section>
                  <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Number of Questions
                  </h2>
                  <div className="flex gap-2">
                    {[3, 5, 7, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setCount(n)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          count === n ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!discipline || generateMutation.isPending}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate AI Quiz
                    </>
                  )}
                </button>

                {generateMutation.isError && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    Failed to generate questions. Please try again.
                  </div>
                )}
              </motion.div>
            )}

            {/* ── QUIZ PHASE ── */}
            {phase === 'quiz' && currentQ && (
              <motion.div
                key={`quiz-${currentIndex}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="max-w-3xl mx-auto"
              >
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Question {currentIndex + 1} of {questions.length}</span>
                    <span className="font-mono">{score}/{answered} correct</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question card */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                      {QUESTION_TYPES.find(qt => qt.value === questionType)?.label}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{
                      background: `${DIFFICULTIES.find(d => d.value === difficulty)?.color}20`,
                      color: DIFFICULTIES.find(d => d.value === difficulty)?.color,
                    }}>
                      {difficulty}
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold mb-6 leading-relaxed" style={{ fontFamily: 'var(--font-display)' }}>
                    {currentQ.questionText}
                  </h2>

                  {/* Multiple Choice Options */}
                  {questionType === 'multiple_choice' && currentQ.options && (
                    <div className="space-y-3">
                      {currentQ.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isSelected = selectedAnswer === i;
                        const isCorrect = opt.isCorrect;
                        const showResult = showExplanation;

                        let borderColor = 'border-border';
                        let bgColor = '';
                        if (showResult && isCorrect) { borderColor = 'border-green-500'; bgColor = 'bg-green-500/10'; }
                        else if (showResult && isSelected && !isCorrect) { borderColor = 'border-red-500'; bgColor = 'bg-red-500/10'; }
                        else if (isSelected) { borderColor = 'border-primary'; bgColor = 'bg-primary/5'; }

                        return (
                          <button
                            key={i}
                            onClick={() => handleMCAnswer(i)}
                            disabled={showExplanation}
                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${borderColor} ${bgColor} ${
                              !showExplanation ? 'hover:border-primary/50 hover:bg-accent/50' : ''
                            }`}
                          >
                            <span className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                              {showResult && isCorrect ? <Check className="w-4 h-4 text-green-500" /> :
                               showResult && isSelected && !isCorrect ? <X className="w-4 h-4 text-red-500" /> :
                               letter}
                            </span>
                            <span className="text-sm leading-relaxed">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Input for fill_blank, scenario, explain */}
                  {questionType !== 'multiple_choice' && !showExplanation && (
                    <div className="space-y-3">
                      <textarea
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder={
                          questionType === 'fill_blank' ? 'Type the missing term...' :
                          questionType === 'scenario' ? 'Describe your analysis and recommendation...' :
                          'Explain the concept in your own words...'
                        }
                        className="w-full p-4 rounded-xl border border-border bg-background text-sm resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                        rows={questionType === 'fill_blank' ? 2 : 5}
                      />
                      <button
                        onClick={handleTextAnswer}
                        disabled={!userAnswer.trim()}
                        className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        Submit Answer
                      </button>
                    </div>
                  )}

                  {/* Explanation */}
                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 overflow-hidden"
                      >
                        <div className="p-4 rounded-xl bg-accent/50 border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Explanation</span>
                          </div>
                          {questionType !== 'multiple_choice' && (
                            <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <p className="text-xs font-semibold text-primary mb-1">Correct Answer:</p>
                              <p className="text-sm">{currentQ.correctAnswer}</p>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground leading-relaxed">{currentQ.explanation}</p>

                          {/* Self-assessment for non-MC */}
                          {questionType !== 'multiple_choice' && (
                            <div className="mt-4 flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">How did you do?</span>
                              <button
                                onClick={() => handleSelfAssess(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 transition-colors"
                              >
                                <ThumbsUp className="w-3 h-3" /> Got it right
                              </button>
                              <button
                                onClick={() => handleSelfAssess(false)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-medium hover:bg-red-500/20 transition-colors"
                              >
                                <ThumbsDown className="w-3 h-3" /> Need review
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Next button */}
                        <button
                          onClick={nextQuestion}
                          className="mt-4 w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                          {currentIndex + 1 >= questions.length ? 'View Results' : 'Next Question'}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <p className="text-center text-[10px] text-muted-foreground mt-2 font-mono">
                          Press Enter or N for next
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Keyboard hints */}
                {questionType === 'multiple_choice' && !showExplanation && (
                  <p className="text-center text-[10px] text-muted-foreground font-mono">
                    Press A, B, C, or D to select an answer
                  </p>
                )}
              </motion.div>
            )}

            {/* ── RESULTS PHASE ── */}
            {phase === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto text-center"
              >
                <div className="bg-card border border-border rounded-2xl p-8 mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: score / answered >= 0.8 ? '#10B98120' : score / answered >= 0.5 ? '#F59E0B20' : '#EF444420',
                    }}
                  >
                    {score / answered >= 0.8 ? (
                      <Star className="w-10 h-10 text-green-500" />
                    ) : score / answered >= 0.5 ? (
                      <Target className="w-10 h-10 text-yellow-500" />
                    ) : (
                      <RotateCcw className="w-10 h-10 text-red-500" />
                    )}
                  </motion.div>

                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {score / answered >= 0.8 ? 'Excellent!' : score / answered >= 0.5 ? 'Good Progress!' : 'Keep Practicing!'}
                  </h2>

                  <div className="text-4xl font-bold font-mono mb-2">
                    {score}/{answered}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {Math.round((score / answered) * 100)}% correct on {discipline} ({difficulty})
                  </p>

                  {/* Question review */}
                  <div className="text-left space-y-2 mb-6">
                    {questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-accent/30">
                        <span className="text-xs mt-0.5">
                          {questionType === 'multiple_choice' ? (
                            q.options?.some((o, oi) => o.isCorrect) ? '✓' : '—'
                          ) : '—'}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{q.questionText}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={restartQuiz}
                      className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      New Quiz
                    </button>
                    <button
                      onClick={() => {
                        setPhase('quiz');
                        setCurrentIndex(0);
                        setScore(0);
                        setAnswered(0);
                        setSelectedAnswer(null);
                        setUserAnswer('');
                        setShowExplanation(false);
                        setQuizComplete(false);
                      }}
                      className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retry Same Quiz
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Navigation>
  );
}
