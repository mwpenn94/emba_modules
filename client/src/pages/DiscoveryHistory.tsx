/**
 * Discovery History — review past self-discovery follow-up questions.
 * Shows a timeline of LLM-generated prompts with topic, discipline, difficulty, and related topics.
 */
import Navigation from '@/components/Navigation';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DISCIPLINE_COLORS } from '@/data/types';
import {
  Clock, Trash2, ArrowRight, Brain, Lightbulb,
  ChevronDown, ChevronUp, Loader2, AlertTriangle, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'wouter';

function DifficultyBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    foundational: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
    intermediate: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
    advanced: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
  };
  const c = colors[level] || colors.intermediate;
  return (
    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${c.bg} ${c.text} uppercase tracking-wider`}>
      {level}
    </span>
  );
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DiscoveryHistory() {
  const { user, isAuthenticated } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const utils = trpc.useUtils();
  const historyQuery = trpc.selfDiscovery.history.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const deleteEntryMut = trpc.selfDiscovery.deleteEntry.useMutation({
    onSuccess: () => {
      utils.selfDiscovery.history.invalidate();
      toast.success('Entry deleted');
    },
  });

  const clearHistoryMut = trpc.selfDiscovery.clearHistory.useMutation({
    onSuccess: () => {
      utils.selfDiscovery.history.invalidate();
      setShowClearConfirm(false);
      toast.success('Discovery history cleared');
    },
  });

  if (!isAuthenticated) {
    return (
      <Navigation>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Discovery Log
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to view your self-discovery question history.
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Navigation>
    );
  }

  const entries = historyQuery.data || [];

  return (
    <Navigation>
      <div className="min-h-screen px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono tracking-widest uppercase text-primary">Self-Discovery</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Discovery Log
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {entries.length} follow-up question{entries.length !== 1 ? 's' : ''} generated from your study sessions.
            </p>
          </div>
          {entries.length > 0 && (
            <div className="relative">
              {showClearConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Clear all?</span>
                  <button
                    onClick={() => clearHistoryMut.mutate()}
                    disabled={clearHistoryMut.isPending}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs hover:opacity-90 disabled:opacity-50"
                  >
                    {clearHistoryMut.isPending ? 'Clearing...' : 'Yes, clear'}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {historyQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!historyQuery.isLoading && entries.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              No discoveries yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Study some content and enable the Self-Discovery feature. After a period of inactivity,
              you'll receive thought-provoking follow-up questions that are saved here.
            </p>
            <Link href="/study">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity cursor-pointer">
                Start Studying <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        )}

        {/* Timeline */}
        {entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry: any, i: number) => {
              const isExpanded = expandedId === entry.id;
              const relatedTopics = entry.relatedTopics || [];
              const discColor = entry.discipline ? (DISCIPLINE_COLORS[entry.discipline] || 'var(--primary)') : 'var(--primary)';

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: discColor }} />

                  {/* Main Row */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${discColor}20` }}
                      >
                        <Lightbulb className="w-4 h-4" style={{ color: discColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {entry.discipline && (
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                              style={{ background: `${discColor}15`, color: discColor }}
                            >
                              {entry.discipline}
                            </span>
                          )}
                          <DifficultyBadge level={entry.difficulty || 'intermediate'} />
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed" style={{ fontFamily: 'var(--font-display)' }}>
                          {entry.question}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Prompted by: <span className="text-foreground/70">{entry.topic}</span>
                        </p>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                          {/* Hint */}
                          {entry.hint && (
                            <div className="p-3 rounded-lg bg-accent/50 border border-border">
                              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Hint</p>
                              <p className="text-sm text-foreground/80">{entry.hint}</p>
                            </div>
                          )}

                          {/* Related Topics */}
                          {relatedTopics.length > 0 && (
                            <div>
                              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Explore Next</p>
                              <div className="flex flex-wrap gap-2">
                                {relatedTopics.map((rt: any, j: number) => (
                                  <Link key={j} href={`/search?q=${encodeURIComponent(rt.topic)}`}>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs hover:border-primary/30 hover:bg-accent transition-colors cursor-pointer">
                                      <span style={{ color: DISCIPLINE_COLORS[rt.discipline] || 'var(--primary)' }}>
                                        {rt.discipline}
                                      </span>
                                      <span className="text-muted-foreground">·</span>
                                      {rt.topic}
                                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Delete */}
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEntryMut.mutate({ entryId: entry.id });
                              }}
                              disabled={deleteEntryMut.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Navigation>
  );
}
