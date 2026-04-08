/**
 * SharedPlaylist — Public view of a shared playlist via share token.
 * No authentication required. Read-only access to playlist content.
 */

import { trpc } from '@/lib/trpc';
import { useRoute } from 'wouter';
import { motion } from 'framer-motion';
import {
  ListMusic, BookOpen, FlaskConical, Briefcase, Shield,
  Loader2, AlertTriangle, ArrowLeft, User
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  definition: BookOpen,
  formula: FlaskConical,
  case: Briefcase,
  fs_application: Shield,
};

const TYPE_COLORS: Record<string, string> = {
  definition: '#3B82F6',
  formula: '#10B981',
  case: '#F59E0B',
  fs_application: '#EF4444',
};

export default function SharedPlaylist() {
  const [, params] = useRoute('/shared/playlist/:token');
  const token = params?.token ?? '';

  const { data, isLoading, error } = trpc.playlists.getByShareToken.useQuery(
    { shareToken: token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shared playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Playlist Not Found
          </h1>
          <p className="text-sm text-muted-foreground">
            This shared link may have been revoked or the playlist no longer exists.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const { playlist, items, ownerName } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/20">
                <ListMusic className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  {playlist.name}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <User className="w-3 h-3" />
                  <span>Shared by {ownerName}</span>
                  <span className="mx-1">&middot;</span>
                  <span>{items.length} items</span>
                </div>
              </div>
            </div>
            {playlist.description && (
              <p className="text-sm text-muted-foreground">{playlist.description}</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Items */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ListMusic className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">This playlist is empty.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, index: number) => {
              const Icon = TYPE_ICONS[item.contentType] || BookOpen;
              const color = TYPE_COLORS[item.contentType] || '#6B7280';
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/20 transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.contentTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent text-accent-foreground capitalize">
                        {item.contentType.replace('_', ' ')}
                      </span>
                      {item.discipline && (
                        <span className="text-[10px] text-muted-foreground">{item.discipline}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Want to study this playlist? Sign in to the Knowledge Explorer.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ListMusic className="w-4 h-4" />
            Open Explorer
          </a>
        </div>
      </div>
    </div>
  );
}
