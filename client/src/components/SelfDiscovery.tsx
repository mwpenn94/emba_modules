/**
 * SelfDiscovery — Continuous self-discovery mode that triggers after user inactivity.
 * Uses last studied topic as context for LLM-generated deeper follow-up questions.
 * Slides in as a subtle notification card with links to related study content.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useMastery } from '@/contexts/MasteryContext';
import { useLocation } from 'wouter';
import {
  Lightbulb, X, ChevronRight, Sparkles, BookOpen,
  Loader2, ArrowRight, Brain
} from 'lucide-react';

const DIFFICULTY_COLORS: Record<string, string> = {
  foundational: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
};

type FollowUp = {
  question: string;
  hint: string;
  relatedTopics: { topic: string; discipline: string }[];
  difficulty: string;
};

export default function SelfDiscovery() {
  const { isAuthenticated } = useAuth();
  const { session } = useMastery();
  const [, navigate] = useLocation();

  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem('selfDiscovery_enabled') !== 'false';
    } catch { return true; }
  });
  const [continuous, setContinuous] = useState(() => {
    try {
      return localStorage.getItem('selfDiscovery_continuous') === 'true';
    } catch { return false; }
  });
  const [inactivityTimeout, setInactivityTimeout] = useState(() => {
    try {
      const val = localStorage.getItem('selfDiscovery_timeout');
      return val ? parseInt(val, 10) : 120; // default 2 minutes
    } catch { return 120; }
  });

  const [visible, setVisible] = useState(false);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [occurrenceCount, setOccurrenceCount] = useState(0);
  const maxOccurrences = continuous ? Infinity : 1;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTopicRef = useRef<string | null>(null);
  const lastDisciplineRef = useRef<string | null>(null);

  const generateMut = trpc.selfDiscovery.generateFollowUp.useMutation();

  // Track last studied topic from session
  useEffect(() => {
    if (session.lastStudiedItem) {
      lastTopicRef.current = session.lastStudiedItem;
    }
    if (session.currentDiscipline) {
      lastDisciplineRef.current = session.currentDiscipline;
    }
  }, [session.lastStudiedItem, session.currentDiscipline]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('selfDiscovery_enabled', String(enabled));
      localStorage.setItem('selfDiscovery_continuous', String(continuous));
      localStorage.setItem('selfDiscovery_timeout', String(inactivityTimeout));
    } catch {}
  }, [enabled, continuous, inactivityTimeout]);

  const triggerFollowUp = useCallback(async () => {
    if (!lastTopicRef.current || !isAuthenticated) return;
    if (occurrenceCount >= maxOccurrences) return;

    try {
      const result = await generateMut.mutateAsync({
        lastTopic: lastTopicRef.current,
        discipline: lastDisciplineRef.current || undefined,
      });
      setFollowUp(result);
      setVisible(true);
      setShowHint(false);
      setOccurrenceCount(c => c + 1);
    } catch (err) {
      console.warn('[SelfDiscovery] Failed to generate follow-up:', err);
    }
  }, [isAuthenticated, occurrenceCount, maxOccurrences]);

  // Inactivity timer
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (visible) return; // Don't reset while showing
      timerRef.current = setTimeout(() => {
        triggerFollowUp();
      }, inactivityTimeout * 1000);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, isAuthenticated, inactivityTimeout, visible, triggerFollowUp]);

  // Reset occurrence count when topic changes
  useEffect(() => {
    setOccurrenceCount(0);
  }, [session.lastStudiedItem]);

  const dismiss = () => {
    setVisible(false);
    setFollowUp(null);
  };

  const navigateToTopic = (discipline: string) => {
    dismiss();
    const slug = discipline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    navigate(`/discipline/${slug}`);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
        title="Self-Discovery Settings"
        aria-label="Self-Discovery Settings"
      >
        <Brain className="w-4 h-4 text-primary" />
      </button>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-32 right-4 z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Lightbulb className="w-4 h-4 text-primary" />
                Self-Discovery
              </h4>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded hover:bg-accent">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Enable</span>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </label>

              <label className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Continuous mode</span>
                <button
                  onClick={() => setContinuous(!continuous)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${continuous ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${continuous ? 'left-5' : 'left-0.5'}`} />
                </button>
              </label>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Inactivity timeout</span>
                  <span className="text-xs font-mono text-primary">{inactivityTimeout}s</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={600}
                  step={30}
                  value={inactivityTimeout}
                  onChange={(e) => setInactivityTimeout(Number(e.target.value))}
                  className="w-full h-1 rounded-full appearance-none bg-muted accent-primary"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                  <span>30s</span>
                  <span>10m</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-Up Question Card */}
      <AnimatePresence>
        {visible && followUp && (
          <motion.div
            initial={{ opacity: 0, x: 300, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  Deeper Thinking
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `${DIFFICULTY_COLORS[followUp.difficulty] || '#6B7280'}20`,
                    color: DIFFICULTY_COLORS[followUp.difficulty] || '#6B7280',
                  }}
                >
                  {followUp.difficulty}
                </span>
              </div>
              <button onClick={dismiss} className="p-1 rounded hover:bg-accent transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Question */}
            <div className="px-4 py-4">
              <p className="text-sm leading-relaxed mb-3">{followUp.question}</p>

              {/* Hint toggle */}
              {!showHint ? (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 mb-3"
                >
                  <Lightbulb className="w-3 h-3" /> Show hint
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-muted-foreground bg-accent/30 rounded-lg px-3 py-2 mb-3"
                >
                  <span className="font-semibold text-primary">Hint:</span> {followUp.hint}
                </motion.div>
              )}

              {/* Related Topics */}
              {followUp.relatedTopics.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground mb-2">
                    Explore Next
                  </p>
                  <div className="space-y-1.5">
                    {followUp.relatedTopics.map((rt, i) => (
                      <button
                        key={i}
                        onClick={() => navigateToTopic(rt.discipline)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left group"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                            {rt.topic}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{rt.discipline}</p>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View History Link */}
              <button
                onClick={() => { dismiss(); navigate('/discovery-history'); }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors mt-1"
              >
                <Brain className="w-3 h-3" /> View Discovery Log
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      <AnimatePresence>
        {generateMut.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl shadow-lg"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Generating follow-up...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
