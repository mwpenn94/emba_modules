/**
 * BookmarkButton — Inline bookmark toggle with optional note editing.
 * Works with the tRPC bookmarks router for cloud persistence.
 * Falls back to localStorage for unauthenticated users.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkCheck, MessageSquare, X, Save } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

interface BookmarkButtonProps {
  contentType: string; // "definition", "formula", "case", "fs_application"
  contentId: string;
  contentTitle: string;
  discipline?: string;
  size?: 'sm' | 'md';
  showNote?: boolean;
}

const LOCAL_KEY = 'emba-bookmarks-local';

function getLocalBookmarks(): Record<string, { note?: string }> {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
}

function setLocalBookmark(id: string, note?: string) {
  const bm = getLocalBookmarks();
  bm[id] = { note };
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(bm)); } catch { /* quota */ }
}

function removeLocalBookmark(id: string) {
  const bm = getLocalBookmarks();
  delete bm[id];
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(bm)); } catch { /* quota */ }
}

export default function BookmarkButton({
  contentType,
  contentId,
  contentTitle,
  discipline,
  size = 'sm',
  showNote = true,
}: BookmarkButtonProps) {
  const { isAuthenticated } = useAuth();
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [localBookmarked, setLocalBookmarked] = useState(() => {
    const bm = getLocalBookmarks();
    return !!bm[`${contentType}-${contentId}`];
  });

  const utils = trpc.useUtils();

  // Cloud queries (only when authenticated)
  const checkQuery = trpc.bookmarks.check.useQuery(
    { contentType, contentId },
    { enabled: isAuthenticated }
  );

  const createMutation = trpc.bookmarks.create.useMutation({
    onSuccess: () => {
      utils.bookmarks.check.invalidate({ contentType, contentId });
      utils.bookmarks.list.invalidate();
    },
  });

  const deleteMutation = trpc.bookmarks.delete.useMutation({
    onSuccess: () => {
      utils.bookmarks.check.invalidate({ contentType, contentId });
      utils.bookmarks.list.invalidate();
    },
  });

  const updateNoteMutation = trpc.bookmarks.updateNote.useMutation({
    onSuccess: () => {
      utils.bookmarks.check.invalidate({ contentType, contentId });
      utils.bookmarks.list.invalidate();
    },
  });

  const isBookmarked = isAuthenticated
    ? checkQuery.data?.bookmarked ?? false
    : localBookmarked;

  const bookmarkData = isAuthenticated && checkQuery.data?.bookmark && typeof checkQuery.data.bookmark === 'object'
    ? checkQuery.data.bookmark
    : null;

  const toggleBookmark = useCallback(() => {
    if (isAuthenticated) {
      if (isBookmarked && bookmarkData) {
        deleteMutation.mutate({ bookmarkId: bookmarkData.id });
      } else {
        createMutation.mutate({
          contentType,
          contentId,
          contentTitle,
          discipline,
          note: noteText || undefined,
        });
      }
    } else {
      const key = `${contentType}-${contentId}`;
      if (localBookmarked) {
        removeLocalBookmark(key);
        setLocalBookmarked(false);
      } else {
        setLocalBookmark(key, noteText || undefined);
        setLocalBookmarked(true);
      }
    }
  }, [isAuthenticated, isBookmarked, bookmarkData, contentType, contentId, contentTitle, discipline, noteText, localBookmarked, createMutation, deleteMutation]);

  const saveNote = useCallback(() => {
    if (isAuthenticated && bookmarkData) {
      updateNoteMutation.mutate({
        bookmarkId: bookmarkData.id,
        note: noteText || null,
      });
    } else {
      const key = `${contentType}-${contentId}`;
      setLocalBookmark(key, noteText || undefined);
    }
    setNoteOpen(false);
  }, [isAuthenticated, bookmarkData, noteText, contentType, contentId, updateNoteMutation]);

  const openNote = useCallback(() => {
    if (bookmarkData?.note) {
      setNoteText(typeof bookmarkData.note === 'string' ? bookmarkData.note : '');
    }
    setNoteOpen(true);
  }, [bookmarkData]);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const btnPad = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <div className="relative inline-flex items-center gap-0.5">
      {/* Bookmark toggle */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={toggleBookmark}
        className={`${btnPad} rounded-md transition-colors ${
          isBookmarked
            ? 'text-primary hover:text-primary/80'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this'}
      >
        {isBookmarked ? (
          <BookmarkCheck className={iconSize} />
        ) : (
          <Bookmark className={iconSize} />
        )}
      </motion.button>

      {/* Note button (only when bookmarked) */}
      {showNote && isBookmarked && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.85 }}
          onClick={openNote}
          className={`${btnPad} rounded-md text-muted-foreground hover:text-foreground transition-colors`}
          aria-label="Add note"
          title="Add a personal note"
        >
          <MessageSquare className={iconSize} />
        </motion.button>
      )}

      {/* Note editor popover */}
      <AnimatePresence>
        {noteOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute top-full right-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-xl z-50 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                Personal Note
              </span>
              <button
                onClick={() => setNoteOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add your notes here..."
              className="w-full h-20 text-xs bg-background border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveNote}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
