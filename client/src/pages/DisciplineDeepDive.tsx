/**
 * DisciplineDeepDive — Tabbed learning path with personalized sequencing
 * Tabs: Definitions, Formulas, Cases, FS Applications
 * Learning modes: General sequence (foundation→intermediate) or Personalized (weak-first, SRS-due)
 * Integrated AudioPlayer for TTS narration of content
 */

import Navigation from '@/components/Navigation';
import AudioPlayer from '@/components/AudioPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'wouter';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '@/data/types';
import {
  ArrowLeft, ArrowRight, BookOpen, Calculator, GitBranch, Lightbulb,
  Volume2, Star, Check, Eye, ChevronRight, Shuffle, TrendingUp,
  Brain, Target, Layers, GraduationCap, RotateCcw
} from 'lucide-react';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function unslugify(slug: string): string {
  const all = Array.from(new Set((embaData.definitions || []).map((d: any) => d.discipline)));
  return all.find(d => slugify(d) === slug) || slug;
}

type Tab = 'learn' | 'formulas' | 'cases' | 'fs';
type SequenceMode = 'general' | 'personalized' | 'weak-first' | 'due-review';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'learn', label: 'Definitions', icon: BookOpen },
  { id: 'formulas', label: 'Formulas', icon: Calculator },
  { id: 'cases', label: 'Cases', icon: GitBranch },
  { id: 'fs', label: 'FS Applications', icon: Lightbulb },
];

export default function DisciplineDeepDive() {
  const { slug } = useParams<{ slug: string }>();
  const discipline = unslugify(slug || '');
  const color = DISCIPLINE_COLORS[discipline] || 'var(--primary)';
  const icon = DISCIPLINE_ICONS[discipline] || '📚';

  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [sequenceMode, setSequenceMode] = useState<SequenceMode>('general');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAudio, setShowAudio] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);

  const { mastery, markSeen, setConfidence, getDueItems } = useMastery();

  // Data for this discipline
  const definitions = useMemo(() =>
    (embaData.definitions || []).filter((d: any) => d.discipline === discipline),
    [discipline]
  );

  const formulas = useMemo(() =>
    (embaData.formulas || []).filter((f: any) => f.discipline === discipline),
    [discipline]
  );

  const cases = useMemo(() =>
    (embaData.cases || []).filter((c: any) => c.discipline === discipline),
    [discipline]
  );

  const fsApps = useMemo(() =>
    (embaData.fs_applications || []).filter((a: any) => a.discipline === discipline),
    [discipline]
  );

  // Personalized sequence logic
  const sequencedDefinitions = useMemo(() => {
    const defs = [...definitions];

    switch (sequenceMode) {
      case 'general':
        // Foundation first, then intermediate, alphabetical within each
        return defs.sort((a: any, b: any) => {
          const diffOrder: Record<string, number> = { foundation: 0, intermediate: 1, advanced: 2 };
          const da = diffOrder[a.difficulty] ?? 1;
          const db = diffOrder[b.difficulty] ?? 1;
          if (da !== db) return da - db;
          return a.term.localeCompare(b.term);
        });

      case 'personalized': {
        // Unseen first, then low-confidence, then due for review, then mastered
        return defs.sort((a: any, b: any) => {
          const keyA = `def-${discipline}-${a.id}`;
          const keyB = `def-${discipline}-${b.id}`;
          const stateA = mastery[keyA];
          const stateB = mastery[keyB];

          // Priority: unseen > low confidence > seen > mastered
          const scoreA = !stateA?.seen ? 0 : stateA?.mastered ? 3 : (stateA?.confidence || 0) < 3 ? 1 : 2;
          const scoreB = !stateB?.seen ? 0 : stateB?.mastered ? 3 : (stateB?.confidence || 0) < 3 ? 1 : 2;

          if (scoreA !== scoreB) return scoreA - scoreB;

          // Within same priority, foundation first
          const diffOrder: Record<string, number> = { foundation: 0, intermediate: 1, advanced: 2 };
          return (diffOrder[a.difficulty] ?? 1) - (diffOrder[b.difficulty] ?? 1);
        });
      }

      case 'weak-first': {
        // Only items with confidence < 3, sorted by lowest confidence
        const weak = defs.filter((d: any) => {
          const key = `def-${discipline}-${d.id}`;
          const state = mastery[key];
          return state?.seen && (state?.confidence || 0) < 3;
        });
        return weak.sort((a: any, b: any) => {
          const confA = mastery[`def-${discipline}-${a.id}`]?.confidence || 0;
          const confB = mastery[`def-${discipline}-${b.id}`]?.confidence || 0;
          return confA - confB;
        });
      }

      case 'due-review': {
        // Items due for spaced repetition review
        const dueKeys = new Set(getDueItems());
        const due = defs.filter((d: any) => dueKeys.has(`def-${discipline}-${d.id}`));
        return due;
      }

      default:
        return defs;
    }
  }, [definitions, sequenceMode, mastery, discipline, getDueItems]);

  const currentDef = sequencedDefinitions[currentIndex];
  const currentKey = currentDef ? `def-${discipline}-${currentDef.id}` : '';
  const currentState = currentKey ? mastery[currentKey] : undefined;

  // Navigation
  const goNext = useCallback(() => {
    setShowDefinition(false);
    setCurrentIndex(i => Math.min(i + 1, sequencedDefinitions.length - 1));
  }, [sequencedDefinitions.length]);

  const goPrev = useCallback(() => {
    setShowDefinition(false);
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  const resetSequence = useCallback(() => {
    setCurrentIndex(0);
    setShowDefinition(false);
  }, []);

  // Mark seen when viewing
  const revealDefinition = useCallback(() => {
    setShowDefinition(true);
    if (currentKey && !currentState?.seen) {
      markSeen(currentKey);
    }
  }, [currentKey, currentState, markSeen]);

  // Audio items for current tab
  const audioItems = useMemo(() => {
    switch (activeTab) {
      case 'learn':
        return sequencedDefinitions.map((d: any) => ({
          label: d.term,
          text: d.definition,
        }));
      case 'formulas':
        return formulas.map((f: any) => ({
          label: f.name,
          text: `${f.name}. The formula is ${f.formula}. Variables: ${f.variables.join(', ')}. ${f.example || ''}`,
        }));
      case 'cases':
        return cases.map((c: any) => ({
          label: c.title,
          text: c.scenario || c.description || c.content || '',
        }));
      case 'fs':
        return fsApps.map((a: any) => ({
          label: a.title,
          text: a.content,
        }));
      default:
        return [];
    }
  }, [activeTab, sequencedDefinitions, formulas, cases, fsApps]);

  // Keyboard navigation
  useEffect(() => {
    if (activeTab !== 'learn') return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (!showDefinition) revealDefinition();
          break;
        case 'ArrowRight':
        case 'n':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'p':
          e.preventDefault();
          goPrev();
          break;
        case '1': case '2': case '3': case '4': case '5':
          if (showDefinition && currentKey) {
            e.preventDefault();
            setConfidence(currentKey, parseInt(e.key));
          }
          break;
        case 'r':
          e.preventDefault();
          resetSequence();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, showDefinition, currentKey, revealDefinition, goNext, goPrev, resetSequence, setConfidence]);

  // Stats
  const masteredCount = definitions.filter((d: any) => mastery[`def-${discipline}-${d.id}`]?.mastered).length;
  const seenCount = definitions.filter((d: any) => mastery[`def-${discipline}-${d.id}`]?.seen).length;
  const progress = definitions.length > 0 ? Math.round((masteredCount / definitions.length) * 100) : 0;

  const SEQUENCE_MODES: { id: SequenceMode; label: string; icon: any; desc: string }[] = [
    { id: 'general', label: 'General', icon: Layers, desc: 'Foundation → Intermediate, alphabetical' },
    { id: 'personalized', label: 'Personalized', icon: Target, desc: 'Unseen first, then weak areas' },
    { id: 'weak-first', label: 'Weak Areas', icon: Brain, desc: 'Low confidence items only' },
    { id: 'due-review', label: 'Due Review', icon: RotateCcw, desc: 'Spaced repetition items due now' },
  ];

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="px-6 lg:px-10 py-4">
            <div className="flex items-center gap-3 mb-3">
              <Link href={`/discipline/${slug}`}>
                <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </Link>
              <span className="text-2xl">{icon}</span>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold tracking-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {discipline} — Deep Dive
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {seenCount}/{definitions.length} studied · {masteredCount} mastered · {progress}%
                </p>
              </div>
              <button
                onClick={() => setShowAudio(!showAudio)}
                className={`p-2 rounded-lg transition-colors ${showAudio ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                title="Toggle audio player"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Progress */}
            <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-500" style={{ background: color, width: `${progress}%` }} />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const count = tab.id === 'learn' ? definitions.length : tab.id === 'formulas' ? formulas.length : tab.id === 'cases' ? cases.length : fsApps.length;
                if (count === 0 && tab.id !== 'learn') return null;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setCurrentIndex(0); setShowDefinition(false); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6 space-y-6">
          {/* Audio Player */}
          <AnimatePresence>
            {showAudio && audioItems.length > 0 && (
              <AudioPlayer
                items={audioItems}
                title={`${discipline} — ${TABS.find(t => t.id === activeTab)?.label}`}
                onClose={() => setShowAudio(false)}
              />
            )}
          </AnimatePresence>

          {/* Definitions Tab — Interactive Learning Mode */}
          {activeTab === 'learn' && (
            <>
              {/* Sequence Mode Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEQUENCE_MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => { setSequenceMode(mode.id); setCurrentIndex(0); setShowDefinition(false); }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      sequenceMode === mode.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <mode.icon className={`w-4 h-4 mb-1 ${sequenceMode === mode.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-xs font-semibold">{mode.label}</p>
                    <p className="text-[10px] text-muted-foreground">{mode.desc}</p>
                  </button>
                ))}
              </div>

              {/* Flashcard Area */}
              {sequencedDefinitions.length > 0 ? (
                <div className="space-y-4">
                  {/* Progress indicator */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{currentIndex + 1} / {sequencedDefinitions.length}</span>
                    <span>{currentDef?.difficulty || 'unknown'} level</span>
                  </div>

                  {/* Card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="rounded-2xl border-2 border-border bg-card p-6 min-h-[240px] flex flex-col"
                    >
                      {/* Term */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                            {currentDef?.difficulty || 'foundation'}
                          </span>
                          <h2 className="text-xl font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                            {currentDef?.term}
                          </h2>
                        </div>
                        {currentState?.mastered && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
                            <GraduationCap className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[10px] text-primary font-medium">Mastered</span>
                          </div>
                        )}
                      </div>

                      {/* Definition (reveal on click) */}
                      {!showDefinition ? (
                        <button
                          onClick={revealDefinition}
                          className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="text-center py-8">
                            <Eye className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Click to reveal definition</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Press Space or Enter</p>
                          </div>
                        </button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex-1"
                        >
                          <p className="text-sm text-foreground/90 leading-relaxed mb-4">
                            {currentDef?.definition}
                          </p>

                          {/* Confidence Rating */}
                          <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                            <span className="text-xs text-muted-foreground">Rate your confidence:</span>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(level => (
                                <button
                                  key={level}
                                  onClick={() => setConfidence(currentKey, level)}
                                  className="transition-transform hover:scale-125 p-0.5"
                                  title={`${level}/5`}
                                >
                                  <Star
                                    className="w-5 h-5"
                                    fill={(currentState?.confidence || 0) >= level ? color : 'transparent'}
                                    stroke={(currentState?.confidence || 0) >= level ? color : 'var(--muted-foreground)'}
                                  />
                                </button>
                              ))}
                            </div>
                            {(currentState?.confidence || 0) >= 4 && (
                              <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> Mastered
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goPrev}
                      disabled={currentIndex === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 hover:bg-accent"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <button
                      onClick={resetSequence}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Restart sequence"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={goNext}
                      disabled={currentIndex >= sequencedDefinitions.length - 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 hover:bg-accent"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Keyboard hints */}
                  <p className="text-center text-[10px] text-muted-foreground">
                    Space/Enter to reveal · ← → to navigate · 1-5 to rate confidence
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <GraduationCap className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {sequenceMode === 'weak-first' ? 'No weak areas!' : sequenceMode === 'due-review' ? 'Nothing due for review!' : 'No definitions found'}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {sequenceMode === 'weak-first' ? 'All studied items have confidence 3 or higher. Great work!' : sequenceMode === 'due-review' ? 'All items are up to date. Check back later.' : 'Try a different learning mode.'}
                  </p>
                  {sequenceMode !== 'general' && (
                    <button
                      onClick={() => { setSequenceMode('general'); setCurrentIndex(0); }}
                      className="mt-3 px-4 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors"
                    >
                      Switch to General Mode
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Formulas Tab */}
          {activeTab === 'formulas' && (
            <div className="space-y-4">
              {formulas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Calculator className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>No formulas for this discipline</h3>
                </div>
              ) : (
                formulas.map((f: any, i: number) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{f.name}</h3>
                    <p className="text-sm font-mono px-3 py-2 rounded-lg bg-accent mb-3" style={{ color }}>{f.formula}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {f.variables.map((v: string) => (
                        <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{v}</span>
                      ))}
                    </div>
                    {f.example && <p className="text-xs text-muted-foreground italic">{f.example}</p>}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Cases Tab */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              {cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <GitBranch className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>No case studies for this discipline</h3>
                </div>
              ) : (
                cases.map((c: any, i: number) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{c.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{c.scenario || c.description || c.content}</p>
                    {c.decisions && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Decision Points</p>
                        {c.decisions.map((dec: any, j: number) => (
                          <div key={j} className="pl-3 border-l-2 border-border">
                            <p className="text-xs font-medium">{dec.prompt || dec.question}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* FS Applications Tab */}
          {activeTab === 'fs' && (
            <div className="space-y-4">
              {fsApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Lightbulb className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>No FS applications for this discipline</h3>
                </div>
              ) : (
                fsApps.map((a: any, i: number) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-5"
                  >
                    <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{a.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
