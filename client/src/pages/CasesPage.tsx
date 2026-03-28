/**
 * DESIGN: The Atelier — Case Studies & FS Applications
 * Editorial card layout with discipline tagging
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { useState } from 'react';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS } from '@/data/types';
import { ArrowLeft, Briefcase, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

export default function CasesPage() {
  const [tab, setTab] = useState<'cases' | 'fs'>('cases');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const cases = embaData.cases || [];
  const fsApps = embaData.fs_applications || [];
  const items = tab === 'cases' ? cases : fsApps;

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
            <Briefcase className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Case Studies & Applications</h1>
              <p className="text-xs text-muted-foreground font-mono">{cases.length} cases · {fsApps.length} FS applications</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => { setTab('cases'); setExpandedId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === 'cases' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Case Studies ({cases.length})
            </button>
            <button
              onClick={() => { setTab('fs'); setExpandedId(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === 'fs' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" /> FS Applications ({fsApps.length})
            </button>
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6 space-y-3">
          {items.map((item: any, i: number) => {
            const color = DISCIPLINE_COLORS[item.discipline] || 'var(--primary)';
            const isExpanded = expandedId === item.id;

            return (
              <motion.div
                key={`${tab}-${item.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  <div className="w-1 h-8 rounded-full shrink-0 mt-0.5" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-primary-foreground"
                        style={{ background: color }}>
                        {item.discipline}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h3>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
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
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 ml-4">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{item.content}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-20">
              <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No items found.</p>
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
