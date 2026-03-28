/**
 * Custom Study Playlists — curate, order, study, and share content collections.
 * Supports create/edit/delete playlists, add/remove/reorder items, study mode, and public sharing.
 */
import Navigation from '@/components/Navigation';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS } from '@/data/types';
import {
  ListMusic, Plus, Trash2, GripVertical, Play, Globe, Lock,
  ChevronLeft, ChevronRight, ArrowRight, Search, BookOpen,
  Edit2, Check, X, Share2, Copy, Link2, UserPlus, UserMinus,
  Eye, Pencil, ExternalLink, Loader2, Users
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Helpers ── */
function getContentByKey(contentType: string, contentId: string) {
  if (contentType === 'definition') {
    return (embaData.definitions || []).find((d: any) => d.id?.toString() === contentId || d.term === contentId);
  }
  if (contentType === 'formula') {
    return (embaData.formulas || []).find((f: any) => f.id?.toString() === contentId || f.name === contentId);
  }
  if (contentType === 'case') {
    return (embaData.cases || []).find((c: any) => c.id?.toString() === contentId || c.title === contentId);
  }
  if (contentType === 'fs_application') {
    return (embaData.fs_applications || []).find((a: any) => a.id?.toString() === contentId || a.title === contentId);
  }
  return null;
}

function ContentTypeIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    definition: '#8B5CF6',
    formula: '#10B981',
    case: '#F59E0B',
    fs_application: '#EF4444',
  };
  const labels: Record<string, string> = {
    definition: 'DEF',
    formula: 'FRM',
    case: 'CASE',
    fs_application: 'FS',
  };
  return (
    <span
      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${colors[type] || '#6366F1'}20`, color: colors[type] || '#6366F1' }}
    >
      {labels[type] || type.toUpperCase()}
    </span>
  );
}

/* ── Add to Playlist Modal ── */
function AddItemModal({
  playlists,
  onAdd,
  onClose,
}: {
  playlists: any[];
  onAdd: (playlistId: number, contentType: string, contentId: string, contentTitle: string, discipline?: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('definition');
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(playlists[0]?.id ?? null);

  const allItems = useMemo(() => {
    const items: { type: string; id: string; title: string; discipline?: string }[] = [];
    (embaData.definitions || []).forEach((d: any) => {
      items.push({ type: 'definition', id: d.id?.toString() || d.term, title: d.term, discipline: d.discipline });
    });
    (embaData.formulas || []).forEach((f: any) => {
      items.push({ type: 'formula', id: f.id?.toString() || f.name, title: f.name, discipline: f.discipline });
    });
    (embaData.cases || []).forEach((c: any) => {
      items.push({ type: 'case', id: c.id?.toString() || c.title, title: c.title, discipline: c.discipline });
    });
    (embaData.fs_applications || []).forEach((a: any) => {
      items.push({ type: 'fs_application', id: a.id?.toString() || a.title, title: a.title, discipline: a.discipline });
    });
    return items;
  }, []);

  const filtered = allItems.filter(
    (item) =>
      item.type === selectedType &&
      item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Add to Playlist
        </h3>

        {/* Playlist selector */}
        <select
          className="w-full p-2 rounded-lg bg-background border border-border text-sm mb-3"
          value={selectedPlaylist ?? ''}
          onChange={(e) => setSelectedPlaylist(Number(e.target.value))}
        >
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Type tabs */}
        <div className="flex gap-2 mb-3">
          {['definition', 'formula', 'case', 'fs_application'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                selectedType === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {t === 'fs_application' ? 'FS Apps' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-border text-sm"
          />
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {filtered.slice(0, 50).map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => {
                if (selectedPlaylist) {
                  onAdd(selectedPlaylist, item.type, item.id, item.title, item.discipline);
                }
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <ContentTypeIcon type={item.type} />
              <span className="text-sm flex-1 truncate">{item.title}</span>
              {item.discipline && (
                <span className="text-[10px] text-muted-foreground">{item.discipline}</span>
              )}
              <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No items match your search</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent text-sm transition-colors"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
}

/* ── Study Mode ── */
function StudyMode({
  items,
  onClose,
}: {
  items: any[];
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const item = items[currentIndex];
  const content = item ? getContentByKey(item.contentType, item.contentId) : null;

  const next = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
      setRevealed(false);
    }
  }, [currentIndex, items.length]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setRevealed(false);
    }
  }, [currentIndex]);

  if (!item || !content) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No content to study</p>
        <button onClick={onClose} className="mt-4 text-primary text-sm">Back to playlist</button>
      </div>
    );
  }

  const getContentText = () => {
    const c = content as any;
    if (item.contentType === 'definition') return c.definition || c.description || '';
    if (item.contentType === 'formula') return `${c.formula || ''}\n\n${c.description || ''}`;
    if (item.contentType === 'case') return c.description || c.scenario || '';
    if (item.contentType === 'fs_application') return c.content || c.description || '';
    return 'No content available';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-mono text-muted-foreground">
          {currentIndex + 1} / {items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <ContentTypeIcon type={item.contentType} />
          {content.discipline && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: `${DISCIPLINE_COLORS[content.discipline] || 'var(--primary)'}20`,
                color: DISCIPLINE_COLORS[content.discipline] || 'var(--primary)',
              }}
            >
              {content.discipline}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          {item.contentTitle}
        </h3>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-8 rounded-lg border-2 border-dashed border-border hover:border-primary/30 transition-colors text-muted-foreground"
          >
            Click to reveal content
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
          >
            {getContentText()}
          </motion.div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg bg-muted hover:bg-accent disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {currentIndex < items.length - 1 ? (
          <button
            onClick={next}
            className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            Complete <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Playlists Page ── */
export default function Playlists() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPublic, setNewPublic] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);

  const utils = trpc.useUtils();
  const playlistsQuery = trpc.playlists.list.useQuery(undefined, { enabled: isAuthenticated });
  const publicQuery = trpc.playlists.discover.useQuery(undefined, { enabled: isAuthenticated });
  const detailQuery = trpc.playlists.getById.useQuery(
    { playlistId: selectedPlaylistId! },
    { enabled: !!selectedPlaylistId && isAuthenticated }
  );

  const createMut = trpc.playlists.create.useMutation({
    onSuccess: () => {
      utils.playlists.list.invalidate();
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setNewPublic(false);
    },
  });

  const deleteMut = trpc.playlists.delete.useMutation({
    onSuccess: () => {
      utils.playlists.list.invalidate();
      setSelectedPlaylistId(null);
    },
  });

  const updateMut = trpc.playlists.update.useMutation({
    onSuccess: () => {
      utils.playlists.list.invalidate();
      if (selectedPlaylistId) utils.playlists.getById.invalidate({ playlistId: selectedPlaylistId });
      setEditingId(null);
    },
  });

  const addItemMut = trpc.playlists.addItem.useMutation({
    onSuccess: () => {
      if (selectedPlaylistId) utils.playlists.getById.invalidate({ playlistId: selectedPlaylistId });
      utils.playlists.list.invalidate();
    },
  });

  const removeItemMut = trpc.playlists.removeItem.useMutation({
    onSuccess: () => {
      if (selectedPlaylistId) utils.playlists.getById.invalidate({ playlistId: selectedPlaylistId });
    },
  });

  /* ── Share mutations ── */
  const generateTokenMut = trpc.playlists.generateShareToken.useMutation({
    onSuccess: (data) => {
      if (selectedPlaylistId) utils.playlists.getById.invalidate({ playlistId: selectedPlaylistId });
      const url = `${window.location.origin}/shared/playlist/${data.shareToken}`;
      navigator.clipboard.writeText(url).then(() => toast.success('Share link copied to clipboard!'));
    },
  });

  const revokeTokenMut = trpc.playlists.revokeShareToken.useMutation({
    onSuccess: () => {
      if (selectedPlaylistId) utils.playlists.getById.invalidate({ playlistId: selectedPlaylistId });
      toast.success('Share link revoked');
    },
  });

  const sharesQuery = trpc.playlists.getShares.useQuery(
    { playlistId: selectedPlaylistId! },
    { enabled: !!selectedPlaylistId && showSharePanel && isAuthenticated }
  );

  const updatePermMut = trpc.playlists.updateSharePermission.useMutation({
    onSuccess: () => {
      if (selectedPlaylistId) sharesQuery.refetch();
      toast.success('Permission updated');
    },
  });

  const revokeAccessMut = trpc.playlists.revokeAccess.useMutation({
    onSuccess: () => {
      if (selectedPlaylistId) sharesQuery.refetch();
      toast.success('Access revoked');
    },
  });

  const sharedWithMeQuery = trpc.playlists.sharedWithMe.useQuery(undefined, { enabled: isAuthenticated });

  const myPlaylists = playlistsQuery.data || [];
  const publicPlaylists = (publicQuery.data || []).filter(
    (p) => !myPlaylists.some((m) => m.id === p.id)
  );

  if (!isAuthenticated) {
    return (
      <Navigation>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <ListMusic className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Study Playlists
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sign in to create custom study playlists and share them with your study groups.
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In to Get Started <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </Navigation>
    );
  }

  // Study mode view
  if (studyMode && detailQuery.data?.items?.length) {
    return (
      <Navigation>
        <div className="min-h-screen p-6">
          <StudyMode
            items={detailQuery.data.items}
            onClose={() => setStudyMode(false)}
          />
        </div>
      </Navigation>
    );
  }

  // Playlist detail view
  if (selectedPlaylistId && detailQuery.data) {
    const { playlist, items } = detailQuery.data;
    const isOwner = playlist.userId === user?.id;

    return (
      <Navigation>
        <div className="min-h-screen p-6 lg:p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> All Playlists
            </button>
          </div>

          <div className="flex items-start justify-between mb-6">
            <div>
              {editingId === playlist.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary outline-none"
                    style={{ fontFamily: 'var(--font-display)' }}
                    autoFocus
                  />
                  <button
                    onClick={() => updateMut.mutate({ playlistId: playlist.id, name: editName })}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg bg-muted text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h1 className="text-2xl font-bold flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
                  {playlist.name}
                  {isOwner && (
                    <button
                      onClick={() => { setEditingId(playlist.id); setEditName(playlist.name); }}
                      className="p-1 rounded hover:bg-accent"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </h1>
              )}
              <div className="flex items-center gap-3 mt-1">
                {playlist.isPublic ? (
                  <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
                <span className="text-[10px] font-mono text-muted-foreground">{items.length} items</span>
              </div>
              {playlist.description && (
                <p className="text-sm text-muted-foreground mt-2">{playlist.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={() => setStudyMode(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
                >
                  <Play className="w-4 h-4" /> Study
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => setShowSharePanel(!showSharePanel)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Items
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this playlist?')) {
                        deleteMut.mutate({ playlistId: playlist.id });
                      }
                    }}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Share Management Panel */}
          <AnimatePresence>
            {showSharePanel && isOwner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="p-5 rounded-xl border border-border bg-card">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                    <Link2 className="w-4 h-4 text-primary" /> Share Settings
                  </h3>

                  {/* Share Link Section */}
                  <div className="mb-5">
                    <p className="text-xs text-muted-foreground mb-2">Shareable Link</p>
                    {playlist.shareToken ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border">
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-mono text-muted-foreground truncate">
                            {window.location.origin}/shared/playlist/{playlist.shareToken}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/shared/playlist/${playlist.shareToken}`);
                            toast.success('Link copied!');
                          }}
                          className="p-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors shrink-0"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateTokenMut.mutate({ playlistId: playlist.id })}
                          className="p-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors shrink-0 text-xs"
                          title="Regenerate link"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={() => revokeTokenMut.mutate({ playlistId: playlist.id })}
                          className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors shrink-0 text-xs"
                          title="Revoke link"
                        >
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => generateTokenMut.mutate({ playlistId: playlist.id })}
                        disabled={generateTokenMut.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {generateTokenMut.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Link2 className="w-4 h-4" />
                        )}
                        Generate Share Link
                      </button>
                    )}
                  </div>

                  {/* Shared Users Section */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Shared With
                    </p>
                    {sharesQuery.isLoading ? (
                      <div className="flex items-center gap-2 py-4 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      </div>
                    ) : (sharesQuery.data?.length ?? 0) === 0 ? (
                      <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">
                        No users have been granted direct access yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {sharesQuery.data?.map((s: any) => (
                          <div key={s.share.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold">
                              {(s.userName || 'U')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.userName || 'Unknown User'}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{s.userEmail || ''}</p>
                            </div>
                            <select
                              value={s.share.permission}
                              onChange={(e) => updatePermMut.mutate({
                                playlistId: playlist.id,
                                shareId: s.share.id,
                                permission: e.target.value as 'view' | 'edit',
                              })}
                              className="text-xs px-2 py-1 rounded border border-border bg-background"
                            >
                              <option value="view">View</option>
                              <option value="edit">Edit</option>
                            </select>
                            <button
                              onClick={() => revokeAccessMut.mutate({ playlistId: playlist.id, shareId: s.share.id })}
                              className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                              title="Revoke access"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Items */}
          {items.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">This playlist is empty</p>
              {isOwner && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Add your first item
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors group"
                >
                  <span className="text-xs font-mono text-muted-foreground w-6 text-center">{idx + 1}</span>
                  <GripVertical className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground cursor-grab shrink-0" />
                  <ContentTypeIcon type={item.contentType} />
                  <span className="text-sm flex-1 truncate">{item.contentTitle}</span>
                  {item.discipline && (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded hidden sm:inline"
                      style={{
                        background: `${DISCIPLINE_COLORS[item.discipline] || 'var(--primary)'}15`,
                        color: DISCIPLINE_COLORS[item.discipline] || 'var(--primary)',
                      }}
                    >
                      {item.discipline}
                    </span>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => removeItemMut.mutate({ itemId: item.id, playlistId: playlist.id })}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Add Item Modal */}
          <AnimatePresence>
            {showAddModal && (
              <AddItemModal
                playlists={myPlaylists}
                onAdd={(playlistId, contentType, contentId, contentTitle, discipline) => {
                  addItemMut.mutate({ playlistId, contentType, contentId, contentTitle, discipline });
                }}
                onClose={() => setShowAddModal(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </Navigation>
    );
  }

  // Playlists list view
  return (
    <Navigation>
      <div className="min-h-screen p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ListMusic className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Study Playlists
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Create curated collections of definitions, formulas, and cases for focused study.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Playlist
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="p-5 rounded-xl border border-border bg-card">
                <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Create New Playlist
                </h3>
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-background border border-border text-sm mb-3"
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-background border border-border text-sm mb-3 resize-none"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPublic}
                      onChange={(e) => setNewPublic(e.target.checked)}
                      className="rounded"
                    />
                    <Globe className="w-3.5 h-3.5" /> Make public
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (newName.trim()) {
                          createMut.mutate({
                            name: newName.trim(),
                            description: newDesc.trim() || undefined,
                            isPublic: newPublic,
                          });
                        }
                      }}
                      disabled={!newName.trim() || createMut.isPending}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {createMut.isPending ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Playlists */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">My Playlists</h2>
          {myPlaylists.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <ListMusic className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No playlists yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myPlaylists.map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPlaylistId(p.id)}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                      {p.name}
                    </h3>
                    {p.isPublic ? (
                      <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Shared With Me */}
        {(sharedWithMeQuery.data?.length ?? 0) > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" /> Shared With Me
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sharedWithMeQuery.data?.map((s: any, i: number) => (
                <motion.div
                  key={s.share.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPlaylistId(s.playlist.id)}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                      {s.playlist.name}
                    </h3>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                      {s.share.permission === 'edit' ? 'Can Edit' : 'View Only'}
                    </span>
                  </div>
                  {s.playlist.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{s.playlist.description}</p>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Shared {new Date(s.share.createdAt).toLocaleDateString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Public Playlists */}
        {publicPlaylists.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Discover Public Playlists
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {publicPlaylists.map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPlaylistId(p.id)}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                      {p.name}
                    </h3>
                    <Share2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Navigation>
  );
}
