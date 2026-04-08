/**
 * NotificationCenter — Toggle-able in-app spaced repetition notifications.
 * Shows a bell icon with badge count of due items.
 * Expandable panel with due items grouped by discipline.
 * Toggle to enable/disable SRS notifications in settings.
 * All notifications are in-app only (no email).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import {
  Bell, BellOff, X, Clock, ChevronRight,
  BookOpen, Settings, Check
} from 'lucide-react';
import { useMastery } from '@/contexts/MasteryContext';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '@/data/types';

const NOTIF_ENABLED_KEY = 'ke-srs-notifications-enabled';
const NOTIF_DISMISSED_KEY = 'ke-srs-notifications-dismissed';
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface DueGroup {
  discipline: string;
  count: number;
  items: string[];
}

export function useNotificationPreference() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIF_ENABLED_KEY);
      return stored === null ? true : stored === 'true'; // default ON
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(NOTIF_ENABLED_KEY, String(next));
      } catch { /* quota */ }
      return next;
    });
  }, []);

  const setPreference = useCallback((val: boolean) => {
    setEnabled(val);
    try {
      localStorage.setItem(NOTIF_ENABLED_KEY, String(val));
    } catch { /* quota */ }
  }, []);

  return { enabled, toggle, setPreference };
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(NOTIF_DISMISSED_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const { enabled, toggle } = useNotificationPreference();
  const { getDueItems, mastery } = useMastery();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get due items and group by discipline
  const dueKeys = getDueItems();
  const definitions = embaData.definitions || [];
  
  const dueGroups: DueGroup[] = (() => {
    const groups: Record<string, string[]> = {};
    dueKeys.forEach(key => {
      // key format: "def-DisciplineName-index"
      const parts = key.split('-');
      if (parts.length >= 3) {
        const discipline = parts.slice(1, -1).join('-');
        if (!groups[discipline]) groups[discipline] = [];
        groups[discipline].push(key);
      }
    });
    return Object.entries(groups)
      .map(([discipline, items]) => ({ discipline, count: items.length, items }))
      .sort((a, b) => b.count - a.count);
  })();

  const activeDueCount = enabled
    ? dueKeys.filter(k => !dismissed.has(k)).length
    : 0;

  // Dismiss a single item
  const dismissItem = useCallback((key: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(key);
      try {
        localStorage.setItem(NOTIF_DISMISSED_KEY, JSON.stringify(Array.from(next)));
      } catch { /* quota */ }
      return next;
    });
  }, []);

  // Dismiss all
  const dismissAll = useCallback(() => {
    setDismissed(prev => {
      const next = new Set(prev);
      dueKeys.forEach(k => next.add(k));
      try {
        localStorage.setItem(NOTIF_DISMISSED_KEY, JSON.stringify(Array.from(next)));
      } catch { /* quota */ }
      return next;
    });
  }, [dueKeys]);

  // Clear dismissed on new day
  useEffect(() => {
    const interval = setInterval(() => {
      // Reset dismissed set periodically to show new due items
      setDismissed(new Set());
      try {
        localStorage.removeItem(NOTIF_DISMISSED_KEY);
      } catch { /* */ }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label={`Notifications${activeDueCount > 0 ? ` (${activeDueCount} due)` : ''}`}
        aria-expanded={isOpen}
      >
        {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        {activeDueCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: 'var(--chart-5)', color: 'white' }}
          >
            {activeDueCount > 9 ? '9+' : activeDueCount}
          </motion.span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                  Spaced Repetition
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {dueKeys.length > 0 && (
                  <button
                    onClick={dismissAll}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="Dismiss all"
                    title="Dismiss all"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-accent/30">
              <span className="text-xs text-muted-foreground">Review reminders</span>
              <button
                onClick={toggle}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  enabled ? 'bg-primary' : 'bg-muted'
                }`}
                role="switch"
                aria-checked={enabled}
                aria-label="Toggle spaced repetition notifications"
              >
                <motion.div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ left: enabled ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-72 overflow-y-auto">
              {!enabled ? (
                <div className="px-4 py-8 text-center">
                  <BellOff className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Notifications are turned off</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Toggle on to see due review items</p>
                </div>
              ) : dueKeys.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Check className="w-8 h-8 text-primary/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">No items due for review right now</p>
                </div>
              ) : (
                <div className="py-1">
                  {dueGroups.map(group => {
                    const color = DISCIPLINE_COLORS[group.discipline] || 'var(--primary)';
                    const icon = DISCIPLINE_ICONS[group.discipline] || '📚';
                    const activeDue = group.items.filter(k => !dismissed.has(k)).length;
                    if (activeDue === 0) return null;

                    return (
                      <Link
                        key={group.discipline}
                        href={`/study/${group.discipline.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      >
                        <div
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer group"
                          onClick={() => setIsOpen(false)}
                        >
                          <span className="text-lg">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{group.discipline}</p>
                            <p className="text-[10px] text-muted-foreground">{activeDue} items due</p>
                          </div>
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                            style={{ background: `${color}20`, color }}
                          >
                            {activeDue}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {enabled && dueKeys.length > 0 && (
              <div className="border-t border-border px-4 py-2.5">
                <Link href="/study">
                  <div
                    className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Start review session ({dueKeys.length} total due)
                  </div>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
