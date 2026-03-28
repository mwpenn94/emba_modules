/**
 * DESIGN: The Atelier — Formula Lab
 * Interactive formula cards with variable highlighting and discipline grouping
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS } from '@/data/types';
import { ArrowLeft, Search, FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';

export default function FormulasPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

  const formulas = embaData.formulas || [];
  const disciplines = useMemo(() =>
    Array.from(new Set(formulas.map((f: any) => f.discipline))).sort(),
    [formulas]
  );

  const filtered = useMemo(() => {
    let items = formulas;
    if (selectedDiscipline !== 'all') {
      items = items.filter((f: any) => f.discipline === selectedDiscipline);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((f: any) =>
        f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) ||
        f.variables.some((v: string) => v.toLowerCase().includes(q))
      );
    }
    return items;
  }, [formulas, search, selectedDiscipline]);

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
              <FlaskConical className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Formula Lab</h1>
                <p className="text-xs text-muted-foreground font-mono">{formulas.length} formulas across {disciplines.length} disciplines</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search formulas..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <select
                value={selectedDiscipline}
                onChange={e => setSelectedDiscipline(e.target.value)}
                className="px-3 py-2 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Disciplines</option>
                {disciplines.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((f: any, i: number) => {
              const color = DISCIPLINE_COLORS[f.discipline] || 'var(--primary)';
              const isExpanded = expandedId === f.id;

              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold pr-2" style={{ fontFamily: 'var(--font-display)' }}>{f.name}</h3>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                    <p className="text-sm font-mono px-3 py-2 rounded-lg bg-accent" style={{ color }}>{f.formula}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{f.discipline}</span>
                    </div>
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
                        <div className="px-4 pb-4 border-t border-border/50 pt-3">
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Variables</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {f.variables.map((v: string) => (
                              <span key={v} className="text-xs px-2 py-1 rounded-md border border-border bg-accent text-accent-foreground">{v}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <FlaskConical className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No formulas match your search.</p>
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
