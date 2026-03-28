/**
 * DESIGN: The Atelier — Discipline Deep Dive
 * Card-based editorial flow, staggered layouts, confidence rating
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, Link } from 'wouter';
import { useState, useMemo } from 'react';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '@/data/types';
import { ArrowLeft, Check, Eye, Star, Filter, Search, ChevronDown, ChevronUp, Lightbulb, PlayCircle, BookOpen, Layers } from 'lucide-react';

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function unslugify(slug: string): string {
  const all = Array.from(new Set((embaData.definitions || []).map((d: any) => d.discipline)));
  return all.find(d => slugify(d) === slug) || slug;
}

type FilterMode = 'all' | 'unseen' | 'seen' | 'mastered';

export default function DisciplinePage() {
  const { slug } = useParams<{ slug: string }>();
  const discipline = unslugify(slug || '');
  const color = DISCIPLINE_COLORS[discipline] || 'var(--primary)';
  const icon = DISCIPLINE_ICONS[discipline] || '📚';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { mastery, markSeen, setConfidence } = useMastery();

  const definitions = useMemo(() =>
    (embaData.definitions || []).filter((d: any) => d.discipline === discipline),
    [discipline]
  );

  const formulas = useMemo(() =>
    (embaData.formulas || []).filter((f: any) => f.discipline === discipline),
    [discipline]
  );

  const fsApps = useMemo(() =>
    (embaData.fs_applications || []).filter((a: any) => a.discipline === discipline),
    [discipline]
  );

  const filtered = useMemo(() => {
    let items = definitions;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((d: any) => d.term.toLowerCase().includes(q) || d.definition.toLowerCase().includes(q));
    }
    if (filter !== 'all') {
      items = items.filter((d: any) => {
        const key = `def-${discipline}-${d.id}`;
        const state = mastery[key];
        if (filter === 'unseen') return !state?.seen;
        if (filter === 'seen') return state?.seen && !state?.mastered;
        if (filter === 'mastered') return state?.mastered;
        return true;
      });
    }
    return items;
  }, [definitions, search, filter, mastery, discipline]);

  const masteredCount = definitions.filter((d: any) => mastery[`def-${discipline}-${d.id}`]?.mastered).length;
  const seenCount = definitions.filter((d: any) => mastery[`def-${discipline}-${d.id}`]?.seen).length;
  const progress = definitions.length > 0 ? Math.round((masteredCount / definitions.length) * 100) : 0;

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="px-6 lg:px-10 py-4">
            <div className="flex items-center gap-3 mb-3">
              <Link href="/">
                <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </Link>
              <span className="text-2xl">{icon}</span>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{discipline}</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {definitions.length} definitions · {formulas.length} formulas · {seenCount} studied · {masteredCount} mastered
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-500" style={{ background: color, width: `${progress}%` }} />
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search definitions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'unseen', 'seen', 'mastered'] as FilterMode[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      filter === f ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'unseen' ? 'New' : f === 'seen' ? 'Reviewing' : 'Mastered'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6 space-y-8">
          {/* Study Session CTA */}
          <Link href={`/study/${slug}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}30` }}>
                <PlayCircle className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Start Study Session</h3>
                <p className="text-xs text-muted-foreground">Flashcard-style study with spaced repetition for {discipline}</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>

          {/* Deep Dive CTA */}
          <Link href={`/learn/${slug}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Layers className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Deep Dive Learning</h3>
                <p className="text-xs text-muted-foreground">Tabbed learning path with personalized sequencing, audio narration, and mastery tracking</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180 group-hover:text-primary transition-colors" />
            </motion.div>
          </Link>

          {/* Formulas Section */}
          {formulas.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs" style={{ background: color, color: 'var(--primary-foreground)' }}>f</span>
                Key Formulas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formulas.map((f: any, i: number) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <h4 className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{f.name}</h4>
                    <p className="text-sm font-mono px-3 py-2 rounded-lg bg-accent mb-2" style={{ color }}>{f.formula}</p>
                    <div className="flex flex-wrap gap-1">
                      {f.variables.map((v: string) => (
                        <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{v}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* FS Applications */}
          {fsApps.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <Lightbulb className="w-4 h-4" style={{ color }} />
                Financial Services Applications
              </h2>
              <div className="space-y-3">
                {fsApps.map((app: any, i: number) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{app.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{app.content}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Definitions */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Definitions ({filtered.length})
              </h2>
            </div>
            <div className="space-y-2">
              {filtered.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    {filter === 'unseen' ? 'All definitions studied!' : filter === 'mastered' ? 'No mastered definitions yet' : search ? 'No matches found' : 'No definitions'}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {filter === 'unseen' ? 'Great work! Try the "Reviewing" filter to practice, or start a Study Session.' : filter === 'mastered' ? 'Rate definitions 4+ stars to mark them as mastered.' : search ? 'Try different keywords or clear the search.' : 'This discipline has no definitions yet.'}
                  </p>
                  {filter !== 'all' && (
                    <button onClick={() => setFilter('all')} className="mt-3 px-4 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors">
                      Show All
                    </button>
                  )}
                </motion.div>
              )}
              {filtered.map((d: any, i: number) => {
                const key = `def-${discipline}-${d.id}`;
                const state = mastery[key];
                const isExpanded = expandedId === d.id;

                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.5) }}
                    className={`rounded-xl border transition-all duration-200 ${
                      state?.mastered ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : d.id);
                        if (!state?.seen) markSeen(key);
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {state?.mastered ? (
                          <Check className="w-4 h-4 shrink-0" style={{ color }} />
                        ) : state?.seen ? (
                          <Eye className="w-4 h-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{d.term}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-border/50">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{d.definition}</p>

                            {/* Confidence Rating */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Confidence:</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(level => (
                                  <button
                                    key={level}
                                    onClick={() => setConfidence(key, level)}
                                    className="transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className="w-4 h-4"
                                      fill={(state?.confidence || 0) >= level ? color : 'transparent'}
                                      stroke={(state?.confidence || 0) >= level ? color : 'var(--muted-foreground)'}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </Navigation>
  );
}
