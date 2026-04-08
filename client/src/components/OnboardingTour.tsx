/**
 * OnboardingTour — AI-guided interactive walkthrough for first-time users.
 * Highlights key modules, explains the learning path, and recommends a starting discipline.
 * Persists "tour completed" state in localStorage + cloud settings.
 * Can be replayed from the sidebar.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  GraduationCap, BookOpen, Calculator, GitBranch, Map, Shield,
  Brain, Sparkles, Headphones, BarChart3, Users, Trophy,
  ChevronRight, ChevronLeft, X, Rocket, Target, Lightbulb,
  CheckCircle2, ArrowRight
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  highlight?: string; // CSS selector or nav path to highlight
  tip?: string;
  action?: { label: string; path: string };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Knowledge Explorer',
    description: 'Your complete mastery companion with 2,000+ definitions, 88 formulas, 12 case studies, and 6 interactive modules. This tour will show you how to get the most out of every feature.',
    icon: Rocket,
    tip: 'You can replay this tour anytime from the sidebar.',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'The dashboard is your home base. It shows your overall progress, mastery percentage, study streak, and quick access to every module. Start here each session to see what needs attention.',
    icon: Target,
    highlight: '/',
    tip: 'Items due for spaced repetition review appear as a highlighted banner.',
  },
  {
    id: 'disciplines',
    title: 'Discipline Pages',
    description: 'Each discipline has its own page with definitions, formulas, and case studies. Click any discipline card on the dashboard to dive in. You can mark items as "seen" and "mastered" to track progress.',
    icon: BookOpen,
    tip: 'The Deep Dive mode offers a structured learning path through each discipline.',
  },
  {
    id: 'exam-simulator',
    title: 'Exam Simulator',
    description: '220 scenario-based questions across all disciplines. Choose timed or practice mode, filter by discipline and difficulty, and review detailed explanations after each question.',
    icon: GraduationCap,
    highlight: '/exam-simulator',
    action: { label: 'Try Exam Simulator', path: '/exam-simulator' },
  },
  {
    id: 'formula-lab',
    title: 'Formula Calculator Lab',
    description: '6 interactive calculators for NPV, WACC, Breakeven, Amortization, Premium Financing, and a Ratio Dashboard. Input your own numbers to see formulas in action.',
    icon: Calculator,
    highlight: '/formula-lab',
    action: { label: 'Open Formula Lab', path: '/formula-lab' },
  },
  {
    id: 'case-simulator',
    title: 'Case Study Simulator',
    description: '8 branching decision scenarios where your choices shape the outcome. Each case includes a framework advisor sidebar and consequence modeling.',
    icon: GitBranch,
    highlight: '/case-simulator',
    action: { label: 'Try Case Simulator', path: '/case-simulator' },
  },
  {
    id: 'connection-map',
    title: 'Connection Map',
    description: 'An interactive concept graph showing how 22 key concepts connect across 9 disciplines. Discover cross-disciplinary relationships and financial services applications.',
    icon: Map,
    highlight: '/connection-map',
  },
  {
    id: 'ai-quiz',
    title: 'AI-Powered Quiz',
    description: 'Generate unlimited practice questions on any topic using AI. Choose your discipline, difficulty, and question type. The AI creates fresh questions each time with detailed explanations.',
    icon: Sparkles,
    highlight: '/ai-quiz',
    action: { label: 'Generate a Quiz', path: '/ai-quiz' },
  },
  {
    id: 'hands-free',
    title: 'Hands-Free Study',
    description: 'Listen to your study content with 322 neural voices. Perfect for commutes or passive review. Auto-plays through definitions, formulas, and cases with audible section cues.',
    icon: Headphones,
    highlight: '/hands-free',
  },
  {
    id: 'study-tools',
    title: 'Study Session and Spaced Repetition',
    description: 'The Study Session uses spaced repetition to schedule reviews at optimal intervals. Rate your confidence (1-5) and the system calculates when you should review each item next.',
    icon: Brain,
    tip: 'Items you rate with low confidence come back sooner. High confidence items space out over days.',
  },
  {
    id: 'social',
    title: 'Study Groups and Analytics',
    description: 'Create or join study groups to share quizzes and compete in timed challenges. The Analytics dashboard tracks your study time, mastery velocity, and retention rates over time.',
    icon: Users,
    highlight: '/groups',
  },
  {
    id: 'recommend',
    title: 'Recommended Starting Path',
    description: 'We recommend starting with the discipline you find most challenging. Begin with the Deep Dive mode to learn definitions, then practice with the Formula Lab and Exam Simulator. Use Spaced Repetition daily to retain what you learn.',
    icon: Lightbulb,
    tip: 'Aim for 15-20 minutes daily. Consistency beats marathon sessions for long-term retention.',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You now know every tool at your disposal. Start exploring, and remember: mastery comes from consistent practice across all modules. Good luck on your learning journey!',
    icon: CheckCircle2,
    action: { label: 'Start Learning', path: '/' },
  },
];

const STORAGE_KEY = 'ke-onboarding-completed';

export function useOnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const startTour = useCallback(() => {
    setIsActive(true);
  }, []);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setHasCompleted(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* quota */ }
  }, []);

  // Auto-start for first-time users
  useEffect(() => {
    if (!hasCompleted) {
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasCompleted]);

  return { isActive, hasCompleted, startTour, completeTour };
}

interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
}

export default function OnboardingTour({ isActive, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, navigate] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const step = TOUR_STEPS[currentStep];

  const next = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') { e.preventDefault(); skip(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, next, prev, skip]);

  // Reset step when tour starts
  useEffect(() => {
    if (isActive) setCurrentStep(0);
  }, [isActive]);

  if (!isActive || !step) return null;

  const Icon = step.icon;
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        role="dialog"
        aria-label="Onboarding tour"
        aria-modal="true"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={skip} />

        {/* Tour Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full rounded-r-full"
              style={{ background: 'var(--primary)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                  Step {currentStep + 1} of {TOUR_STEPS.length}
                </p>
                <h2 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  {step.title}
                </h2>
              </div>
            </div>
            <button
              onClick={skip}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              {step.description}
            </p>

            {step.tip && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary leading-relaxed">{step.tip}</p>
              </div>
            )}

            {step.action && (
              <button
                onClick={() => {
                  onComplete();
                  navigate(step.action!.path);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {step.action.label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-1.5 py-3">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === currentStep
                    ? 'w-6 bg-primary'
                    : i < currentStep
                    ? 'bg-primary/40'
                    : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <button
              onClick={prev}
              disabled={isFirst}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={skip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>

            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isLast ? 'Finish' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
