/**
 * Hands-Free Study Mode
 * Auto-plays TTS through an entire discipline's content sequentially.
 * Features: audible progress cues between sections, pause/resume/skip,
 * voice/speed settings, section order customization, repeat mode.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTTS } from '@/hooks/useTTS';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { CORE_DISCIPLINES, SPECIALIZATION_DISCIPLINES, DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '@/data/types';
import { useParams, Link } from 'wouter';
import {
  Headphones, Play, Pause, SkipForward, SkipBack, Square,
  Settings, Volume2, Repeat, ChevronRight, ChevronDown,
  BookOpen, Calculator, Briefcase, Shield, Clock, Loader2,
  ArrowLeft, Zap, CheckCircle2
} from 'lucide-react';

type SectionType = 'definitions' | 'formulas' | 'cases' | 'fs_applications';

interface ContentItem {
  type: SectionType;
  label: string;
  text: string;
  key: string;
}

const SECTION_CONFIG: { type: SectionType; label: string; icon: any; color: string }[] = [
  { type: 'definitions', label: 'Definitions', icon: BookOpen, color: '#8B5CF6' },
  { type: 'formulas', label: 'Formulas', icon: Calculator, color: '#10B981' },
  { type: 'cases', label: 'Case Studies', icon: Briefcase, color: '#F59E0B' },
  { type: 'fs_applications', label: 'FS Applications', icon: Shield, color: '#EF4444' },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function unslugify(slug: string): string | undefined {
  const all = [...CORE_DISCIPLINES, ...SPECIALIZATION_DISCIPLINES];
  return all.find(d => slugify(d) === slug);
}

// Generate a short audible "chime" using Web Audio API
function playChime(type: 'section' | 'complete' | 'start') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'section') {
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.setValueAtTime(523, ctx.currentTime + 0.1); // C5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch { /* AudioContext not available */ }
}

export default function HandsFreeStudy() {
  const { slug } = useParams<{ slug?: string }>();
  const tts = useTTS();
  const { markSeen } = useMastery();

  // Settings
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [enabledSections, setEnabledSections] = useState<SectionType[]>(['definitions', 'formulas', 'cases', 'fs_applications']);
  const [repeatMode, setRepeatMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [contentQueue, setContentQueue] = useState<ContentItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<SectionType | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'complete'>('setup');
  const playingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Resolve slug to discipline
  useEffect(() => {
    if (slug) {
      const disc = unslugify(slug);
      if (disc) setSelectedDiscipline(disc);
    }
  }, [slug]);

  const allDisciplines = [...CORE_DISCIPLINES, ...SPECIALIZATION_DISCIPLINES].filter(d =>
    embaData.definitions.some((def: any) => def.discipline === d)
  );

  // Build content queue for selected discipline
  const buildQueue = useCallback((): ContentItem[] => {
    if (!selectedDiscipline) return [];
    const items: ContentItem[] = [];

    if (enabledSections.includes('definitions')) {
      const defs = embaData.definitions.filter((d: any) => d.discipline === selectedDiscipline);
      defs.forEach((d: any) => {
        items.push({
          type: 'definitions',
          label: d.term,
          text: `${d.term}. ${d.definition}`,
          key: `def-${selectedDiscipline}-${d.id}`,
        });
      });
    }

    if (enabledSections.includes('formulas')) {
      const formulas = (embaData.formulas || []).filter((f: any) => f.discipline === selectedDiscipline);
      formulas.forEach((f: any) => {
        const vars = f.variables?.join(', ') || '';
        items.push({
          type: 'formulas',
          label: f.name,
          text: `Formula: ${f.name}. ${f.formula}. Variables: ${vars}`,
          key: `formula-${selectedDiscipline}-${f.id}`,
        });
      });
    }

    if (enabledSections.includes('cases')) {
      const cases = (embaData.cases || []).filter((c: any) => c.discipline === selectedDiscipline);
      cases.forEach((c: any) => {
        items.push({
          type: 'cases',
          label: c.title,
          text: `Case Study: ${c.title}. ${c.content}`,
          key: `case-${selectedDiscipline}-${c.id}`,
        });
      });
    }

    if (enabledSections.includes('fs_applications')) {
      const apps = (embaData.fs_applications || []).filter((a: any) => a.discipline === selectedDiscipline);
      apps.forEach((a: any) => {
        items.push({
          type: 'fs_applications',
          label: a.title,
          text: `Financial Services Application: ${a.title}. ${a.content}`,
          key: `fs-${selectedDiscipline}-${a.id}`,
        });
      });
    }

    return items;
  }, [selectedDiscipline, enabledSections]);

  // Start playback
  const startPlayback = useCallback(async () => {
    const queue = buildQueue();
    if (queue.length === 0) return;

    setContentQueue(queue);
    setCurrentItemIndex(0);
    setPhase('playing');
    setIsPlaying(true);
    playingRef.current = true;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    playChime('start');
    await new Promise(r => setTimeout(r, 500));

    let lastSection: SectionType | null = null;

    const playFrom = async (startIndex: number) => {
      for (let i = startIndex; i < queue.length; i++) {
        if (controller.signal.aborted || !playingRef.current) break;

        const item = queue[i];
        setCurrentItemIndex(i);
        setCurrentSection(item.type);

        // Section transition chime
        if (item.type !== lastSection && lastSection !== null) {
          playChime('section');
          await new Promise(r => setTimeout(r, 600));
          if (controller.signal.aborted) break;

          // Announce new section
          const sectionLabel = SECTION_CONFIG.find(s => s.type === item.type)?.label || item.type;
          try {
            await new Promise<void>((resolve, reject) => {
              tts.speakText(`Now moving to ${sectionLabel}.`, () => resolve());
              controller.signal.addEventListener('abort', () => reject(new Error('Aborted')));
            });
          } catch { if (controller.signal.aborted) break; }
          await new Promise(r => setTimeout(r, 400));
        }
        lastSection = item.type;

        if (controller.signal.aborted) break;

        // Speak the item
        try {
          await new Promise<void>((resolve, reject) => {
            tts.speakText(item.text, () => {
              markSeen(item.key);
              resolve();
            });
            controller.signal.addEventListener('abort', () => reject(new Error('Aborted')));
          });
        } catch { if (controller.signal.aborted) break; }

        // Pause between items
        if (!controller.signal.aborted && i < queue.length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      }

      if (!controller.signal.aborted) {
        if (repeatMode) {
          lastSection = null;
          playChime('section');
          await new Promise(r => setTimeout(r, 1000));
          await playFrom(0);
        } else {
          playChime('complete');
          setPhase('complete');
          setIsPlaying(false);
          playingRef.current = false;
        }
      }
    };

    await playFrom(0);
  }, [buildQueue, tts, markSeen, repeatMode]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    if (tts.isPaused) {
      tts.resume();
      setIsPlaying(true);
    } else {
      tts.pause();
      setIsPlaying(false);
    }
  }, [tts]);

  // Stop
  const stopPlayback = useCallback(() => {
    abortRef.current?.abort();
    tts.stop();
    playingRef.current = false;
    setIsPlaying(false);
    setPhase('setup');
  }, [tts]);

  // Skip forward
  const skipForward = useCallback(() => {
    if (currentItemIndex < contentQueue.length - 1) {
      tts.stop();
      const nextIdx = currentItemIndex + 1;
      setCurrentItemIndex(nextIdx);
      tts.speakText(contentQueue[nextIdx].text, () => {
        markSeen(contentQueue[nextIdx].key);
      });
    }
  }, [currentItemIndex, contentQueue, tts, markSeen]);

  // Skip backward
  const skipBackward = useCallback(() => {
    if (currentItemIndex > 0) {
      tts.stop();
      const prevIdx = currentItemIndex - 1;
      setCurrentItemIndex(prevIdx);
      tts.speakText(contentQueue[prevIdx].text, () => {
        markSeen(contentQueue[prevIdx].key);
      });
    }
  }, [currentItemIndex, contentQueue, tts, markSeen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePause(); }
      if (e.key === 'ArrowRight' || e.key === 'n') skipForward();
      if (e.key === 'ArrowLeft' || e.key === 'p') skipBackward();
      if (e.key === 'Escape' || e.key === 'q') stopPlayback();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, togglePause, skipForward, skipBackward, stopPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      tts.stop();
      playingRef.current = false;
    };
  }, []); // eslint-disable-line

  const toggleSection = (section: SectionType) => {
    setEnabledSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const previewQueue = buildQueue();
  const currentItem = contentQueue[currentItemIndex];
  const progress = contentQueue.length > 0 ? Math.round(((currentItemIndex + 1) / contentQueue.length) * 100) : 0;

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-6 lg:px-10 py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Hands-Free Study
              </h1>
              <p className="text-xs text-muted-foreground">Listen and learn — auto-play through discipline content with audible cues</p>
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
                  <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Select Discipline
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {allDisciplines.map(d => {
                      const defCount = embaData.definitions.filter((def: any) => def.discipline === d).length;
                      return (
                        <button
                          key={d}
                          onClick={() => setSelectedDiscipline(d)}
                          className={`text-left p-3 rounded-lg border text-sm transition-all ${
                            selectedDiscipline === d
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border hover:border-primary/30 text-foreground'
                          }`}
                        >
                          <span className="mr-1.5">{DISCIPLINE_ICONS[d] || '📚'}</span>
                          <span className="text-xs">{d}</span>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">{defCount} items</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Section Selection */}
                {selectedDiscipline && (
                  <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                      Content Sections
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {SECTION_CONFIG.map(sec => {
                        const Icon = sec.icon;
                        const count = sec.type === 'definitions'
                          ? embaData.definitions.filter((d: any) => d.discipline === selectedDiscipline).length
                          : sec.type === 'formulas'
                          ? (embaData.formulas || []).filter((f: any) => f.discipline === selectedDiscipline).length
                          : sec.type === 'cases'
                          ? (embaData.cases || []).filter((c: any) => c.discipline === selectedDiscipline).length
                          : (embaData.fs_applications || []).filter((a: any) => a.discipline === selectedDiscipline).length;

                        if (count === 0) return null;

                        return (
                          <button
                            key={sec.type}
                            onClick={() => toggleSection(sec.type)}
                            className={`text-left p-4 rounded-xl border transition-all ${
                              enabledSections.includes(sec.type)
                                ? 'border-primary bg-primary/5'
                                : 'border-border opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4" style={{ color: sec.color }} />
                              <span className="text-sm font-medium">{sec.label}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto">{count}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {enabledSections.includes(sec.type) ? 'Included' : 'Excluded'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </motion.section>
                )}

                {/* Settings */}
                {selectedDiscipline && (
                  <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="flex items-center gap-2 text-sm font-semibold mb-3"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <Settings className="w-4 h-4 text-primary" />
                      Playback Settings
                      <ChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4"
                        >
                          {/* Voice */}
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Voice</label>
                            <select
                              value={tts.options.voiceId}
                              onChange={e => tts.setOptions({ voiceId: e.target.value })}
                              className="w-full p-2 rounded-lg border border-border bg-background text-sm"
                            >
                              {tts.voices.filter(v => v.locale.startsWith('en')).map(v => (
                                <option key={v.shortName} value={v.shortName}>{v.friendlyName}</option>
                              ))}
                            </select>
                          </div>

                          {/* Speed */}
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Speed</label>
                            <div className="flex gap-2">
                              {[
                                { label: '0.75x', value: '-25%' },
                                { label: '1x', value: '+0%' },
                                { label: '1.25x', value: '+25%' },
                                { label: '1.5x', value: '+50%' },
                                { label: '2x', value: '+100%' },
                              ].map(s => (
                                <button
                                  key={s.value}
                                  onClick={() => tts.setOptions({ rate: s.value })}
                                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                    tts.options.rate === s.value
                                      ? 'border-primary bg-primary/10 text-primary font-medium'
                                      : 'border-border hover:border-primary/30'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Engine */}
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Engine</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => tts.setOptions({ engine: 'edge' })}
                                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                  tts.options.engine === 'edge' ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                                }`}
                              >
                                Edge Neural (recommended)
                              </button>
                              <button
                                onClick={() => tts.setOptions({ engine: 'browser' })}
                                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                  tts.options.engine === 'browser' ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                                }`}
                              >
                                Browser TTS
                              </button>
                            </div>
                          </div>

                          {/* Repeat */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setRepeatMode(!repeatMode)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                repeatMode ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                              }`}
                            >
                              <Repeat className="w-3 h-3" />
                              Repeat Mode {repeatMode ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.section>
                )}

                {/* Preview & Start */}
                {selectedDiscipline && previewQueue.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="p-4 rounded-xl bg-accent/30 border border-border mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Session Preview</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{previewQueue.length} items</span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {SECTION_CONFIG.filter(s => enabledSections.includes(s.type)).map(s => {
                          const count = previewQueue.filter(q => q.type === s.type).length;
                          if (count === 0) return null;
                          return (
                            <span key={s.type} className="text-[10px] px-2 py-0.5 rounded-full border border-border" style={{ color: s.color }}>
                              {s.label}: {count}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Estimated time: ~{Math.ceil(previewQueue.length * 0.5)} minutes at normal speed
                      </p>
                    </div>

                    <button
                      onClick={startPlayback}
                      className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      <Headphones className="w-4 h-4" />
                      Start Hands-Free Session
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── PLAYING PHASE ── */}
            {phase === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto"
              >
                {/* Now Playing Card */}
                <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                  {/* Progress */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{currentItemIndex + 1} / {contentQueue.length}</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Current section badge */}
                  {currentSection && (
                    <div className="flex items-center gap-2 mb-3">
                      {(() => {
                        const sec = SECTION_CONFIG.find(s => s.type === currentSection);
                        const Icon = sec?.icon || BookOpen;
                        return (
                          <>
                            <Icon className="w-4 h-4" style={{ color: sec?.color }} />
                            <span className="text-xs font-mono" style={{ color: sec?.color }}>{sec?.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Current item */}
                  {currentItem && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                        {currentItem.label}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                        {currentItem.text}
                      </p>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {tts.isLoading && (
                    <div className="flex items-center gap-2 text-xs text-primary mb-4">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Synthesizing audio...</span>
                    </div>
                  )}

                  {/* Transport Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={skipBackward}
                      disabled={currentItemIndex === 0}
                      className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                      title="Previous (Left Arrow)"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      onClick={togglePause}
                      className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                      title="Play/Pause (Space)"
                    >
                      {isPlaying && !tts.isPaused ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={skipForward}
                      disabled={currentItemIndex >= contentQueue.length - 1}
                      className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                      title="Next (Right Arrow)"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    <button
                      onClick={stopPlayback}
                      className="w-10 h-10 rounded-full border border-destructive/30 text-destructive flex items-center justify-center hover:bg-destructive/10 transition-colors"
                      title="Stop (Escape)"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Keyboard hints */}
                  <p className="text-center text-[10px] text-muted-foreground mt-4 font-mono">
                    Space: pause/resume · Arrows: skip · Esc: stop
                  </p>

                  {/* Repeat indicator */}
                  {repeatMode && (
                    <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-primary">
                      <Repeat className="w-3 h-3" />
                      Repeat mode active
                    </div>
                  )}
                </div>

                {/* Upcoming items */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-xs font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Coming Up
                  </h3>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {contentQueue.slice(currentItemIndex + 1, currentItemIndex + 8).map((item, i) => {
                      const sec = SECTION_CONFIG.find(s => s.type === item.type);
                      return (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sec?.color }} />
                          <span className="truncate">{item.label}</span>
                        </div>
                      );
                    })}
                    {contentQueue.length - currentItemIndex - 1 > 8 && (
                      <p className="text-[10px] text-muted-foreground text-center py-1">
                        +{contentQueue.length - currentItemIndex - 9} more items
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── COMPLETE PHASE ── */}
            {phase === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto text-center"
              >
                <div className="bg-card border border-border rounded-2xl p-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-500/10"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </motion.div>

                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Session Complete
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    You listened through {contentQueue.length} items in {selectedDiscipline}.
                  </p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { setPhase('setup'); setContentQueue([]); }}
                      className="px-6 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      New Session
                    </button>
                    <button
                      onClick={startPlayback}
                      className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Repeat className="w-4 h-4" />
                      Replay
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
