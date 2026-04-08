/**
 * Bookmarks Page — View, search, filter, and manage all bookmarked content.
 * Shows bookmarks grouped by content type with inline note editing.
 * Requires authentication for cloud bookmarks.
 */

import Navigation from '@/components/Navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import {
  Bookmark, BookmarkCheck, Search, Filter, Trash2,
  MessageSquare, Save, X, BookOpen, Calculator,
  GitBranch, Shield, ChevronDown, StickyNote, LogIn,
  Library, Brain, ListMusic
} from 'lucide-react';
import { DISCIPLINE_COLORS, DISCIPLINE_ICONS } from '@/data/types';

const CONTENT_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  definition: { label: 'Definitions', icon: BookOpen, color: '#8B5CF6' },
  formula: { label: 'Formulas', icon: Calculator, color: '#10B981' },
  case: { label: 'Case Studies', icon: GitBranch, color: '#F59E0B' },
  fs_application: { label: 'FS Applications', icon: Shield, color: '#EF4444' },
  track_card: { label: 'Track Flashcards', icon: ListMusic, color: '#0E6655' },
  track_question: { label: 'Practice Questions', icon: Brain, color: '#6C3483' },
  track_section: { label: 'Track Sections', icon: Library, color: '#1B4F72' },
};

export default function Bookmarks() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const utils = trpc.useUtils();

  const bookmarksQuery = trpc.bookmarks.list.useQuery(
    typeFilter ? { contentType: typeFilter } : undefined,
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.bookmarks.delete.useMutation({
    onSuccess: () => utils.bookmarks.list.invalidate(),
  });

  const updateNoteMutation = trpc.bookmarks.updateNote.useMutation({
    onSuccess: () => {
      utils.bookmarks.list.invalidate();
      setEditingNote(null);
    },
  });

  const bookmarks = bookmarksQuery.data || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return bookmarks;
    const q = search.toLowerCase();
    return bookmarks.filter(
      b =>
        b.contentTitle.toLowerCase().includes(q) ||
        (b.discipline && b.discipline.toLowerCase().includes(q)) ||
        (b.note && b.note.toLowerCase().includes(q))
    );
  }, [bookmarks, search]);

  // Group by content type
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(b => {
      if (!groups[b.contentType]) groups[b.contentType] = [];
      groups[b.contentType].push(b);
    });
    return groups;
  }, [filtered]);

  const typeKeys = Object.keys(grouped);

  if (authLoading) {
    return (
      <Navigation>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Navigation>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigation>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Content Bookmarks
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to save bookmarks and personal notes across devices.
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </a>
          </div>
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="min-h-screen px-6 lg:px-10 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <BookmarkCheck className="w-5 h-5" style={{ color: 'var(--primary-foreground)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Bookmarks
              </h1>
              <p className="text-xs text-muted-foreground">
                {bookmarks.length} saved items across {Object.keys(CONTENT_TYPE_META).filter(t => grouped[t]).length} categories
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter(null)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                !typeFilter ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {Object.entries(CONTENT_TYPE_META).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <button
                  key={key}
                  onClick={() => setTypeFilter(typeFilter === key ? null : key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    typeFilter === key ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Bookmark className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              {bookmarks.length === 0 ? 'No bookmarks yet' : 'No matches found'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {bookmarks.length === 0
                ? 'Bookmark definitions, formulas, cases, and FS applications as you study. Look for the bookmark icon on content cards.'
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </motion.div>
        )}

        {/* Bookmark Groups */}
        <div className="space-y-8">
          {typeKeys.map(type => {
            const meta = CONTENT_TYPE_META[type] || { label: type, icon: BookOpen, color: '#6366F1' };
            const Icon = meta.icon;
            const items = grouped[type];

            return (
              <motion.section
                key={type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${meta.color}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                  </div>
                  <h2 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    {meta.label}
                  </h2>
                  <span className="text-[10px] font-mono text-muted-foreground">{items.length}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(bookmark => {
                    const disciplineColor = bookmark.discipline ? DISCIPLINE_COLORS[bookmark.discipline] || 'var(--primary)' : 'var(--primary)';
                    const disciplineIcon = bookmark.discipline ? DISCIPLINE_ICONS[bookmark.discipline] || '📚' : '📚';
                    const isEditing = editingNote === bookmark.id;

                    return (
                      <motion.div
                        key={bookmark.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
                      >
                        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ background: disciplineColor }} />

                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm">{disciplineIcon}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent text-accent-foreground truncate">
                              {bookmark.discipline || 'General'}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingNote(bookmark.id);
                                setNoteText(bookmark.note || '');
                              }}
                              className="p-1 rounded text-muted-foreground hover:text-foreground"
                              title="Edit note"
                            >
                              <StickyNote className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate({ bookmarkId: bookmark.id })}
                              className="p-1 rounded text-muted-foreground hover:text-destructive"
                              title="Remove bookmark"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold mb-1 line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
                          {bookmark.contentTitle}
                        </h3>

                        {/* Note */}
                        <AnimatePresence mode="wait">
                          {isEditing ? (
                            <motion.div
                              key="editing"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2"
                            >
                              <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Add your notes..."
                                className="w-full h-16 text-xs bg-background border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                              />
                              <div className="flex justify-end gap-1 mt-1">
                                <button
                                  onClick={() => setEditingNote(null)}
                                  className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    updateNoteMutation.mutate({
                                      bookmarkId: bookmark.id,
                                      note: noteText || null,
                                    });
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                              </div>
                            </motion.div>
                          ) : bookmark.note ? (
                            <motion.div
                              key="note"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-2 p-2 rounded-md bg-accent/50 border border-border/50"
                            >
                              <div className="flex items-start gap-1.5">
                                <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                                  {bookmark.note}
                                </p>
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>

                        {/* Timestamp */}
                        <p className="text-[9px] text-muted-foreground/60 mt-2 font-mono">
                          {new Date(bookmark.createdAt).toLocaleDateString()}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </Navigation>
  );
}
