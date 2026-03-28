/**
 * DESIGN: The Atelier — Connections Map
 * Visual representation of cross-discipline concept links
 */

import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS } from '@/data/types';
import { ArrowLeft, Network, ArrowRight, Filter } from 'lucide-react';

export default function ConnectionsPage() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const connections = embaData.connections || [];

  const disciplines = useMemo(() => {
    const set = new Set<string>();
    connections.forEach((c: any) => { set.add(c.from); set.add(c.to); });
    return Array.from(set).sort();
  }, [connections]);

  const filtered = useMemo(() => {
    if (selectedDiscipline === 'all') return connections;
    return connections.filter((c: any) => c.from === selectedDiscipline || c.to === selectedDiscipline);
  }, [connections, selectedDiscipline]);

  // Group by "from" discipline
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    filtered.forEach((c: any) => {
      if (!map[c.from]) map[c.from] = [];
      map[c.from].push(c);
    });
    return map;
  }, [filtered]);

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div className="px-6 lg:px-10 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/">
              <motion.div whileHover={{ x: -2 }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <Network className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Connections Map</h1>
              <p className="text-xs text-muted-foreground font-mono">{connections.length} cross-discipline links</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
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

        <div className="px-6 lg:px-10 py-6 space-y-8">
          {Object.entries(grouped).map(([fromDisc, conns], gi) => (
            <motion.section
              key={fromDisc}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: DISCIPLINE_COLORS[fromDisc] || 'var(--primary)' }} />
                <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{fromDisc}</h2>
                <span className="text-xs text-muted-foreground font-mono">({conns.length} links)</span>
              </div>
              <div className="space-y-2 pl-5 border-l-2" style={{ borderColor: DISCIPLINE_COLORS[fromDisc] || 'var(--border)' }}>
                {conns.map((c: any, ci: number) => (
                  <motion.div
                    key={ci}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: gi * 0.05 + ci * 0.02 }}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md text-primary-foreground"
                        style={{ background: DISCIPLINE_COLORS[c.from] || 'var(--accent)' }}>
                        {c.concept_from}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs font-mono px-2 py-0.5 rounded-md text-primary-foreground"
                        style={{ background: DISCIPLINE_COLORS[c.to] || 'var(--accent)' }}>
                        {c.concept_to}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.relationship}</p>
                    <div className="mt-2">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {c.from} → {c.to}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Network className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No connections found for this filter.</p>
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
