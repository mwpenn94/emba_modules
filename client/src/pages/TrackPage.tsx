/**
 * TrackPage — single exam-track reading view.
 *
 * Renders chapter / subsection content from the parsed WealthBridge study
 * manual.  A sidebar lists chapters; the main pane shows the selected
 * chapter's intro paragraphs, all of its subsections, and any tables.  An
 * "Exam Overview" rail at the top shows the canonical exam metadata when
 * present.  Quick links jump into the practice quiz and flashcard deck.
 */

import Navigation from '@/components/Navigation';
import { useState, useMemo } from 'react';
import { Link, useRoute } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  ListMusic,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useTrack } from '@/hooks/useTracks';
import BookmarkButton from '@/components/BookmarkButton';
import { TRACK_META } from '@/data/types';
import NotFound from './NotFound';

function TrackTable({ rows }: { rows: string[][] }) {
  if (!rows || rows.length === 0) return null;
  const [head, ...body] = rows;
  const looksLikeHeader = head && head.length > 1;
  return (
    <div className="overflow-x-auto my-4 rounded-lg border border-border">
      <table className="w-full text-xs">
        {looksLikeHeader && (
          <thead className="bg-accent/40 text-muted-foreground">
            <tr>
              {head.map((cell, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {(looksLikeHeader ? body : rows).map((row, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 align-top text-foreground/90"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrackPage() {
  const [, params] = useRoute('/track/:key');
  const trackKey = params?.key;
  const track = useTrack(trackKey);

  // Default to the first chapter that actually has content (intro,
  // subsections, or chapter-level tables).
  const hasContent = (c: typeof track extends undefined
    ? never
    : NonNullable<typeof track>['chapters'][number]) => {
    return (
      c.subsections.length > 0 ||
      c.intro.trim().length > 0 ||
      (c.tables?.length ?? 0) > 0
    );
  };

  const initialChapterId = useMemo(() => {
    if (!track) return null;
    const ch = track.chapters.find(hasContent) ?? track.chapters[0];
    return ch?.id ?? null;
  }, [track]);

  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    initialChapterId,
  );

  if (!track) {
    return <NotFound />;
  }

  const meta = TRACK_META[track.key] ?? {
    color: 'var(--primary)',
    tagline: track.subtitle,
    emoji: '📘',
  };
  const activeChapter =
    track.chapters.find((c) => c.id === (activeChapterId ?? initialChapterId)) ??
    track.chapters[0];

  return (
    <Navigation>
      <div className="min-h-screen">
        {/* Header */}
        <div
          className="px-6 lg:px-10 py-6 border-b border-border"
          style={{ background: `linear-gradient(180deg, ${meta.color}14, transparent)` }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Link href="/tracks">
              <motion.div
                whileHover={{ x: -2 }}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </Link>
            <span className="text-2xl" aria-hidden>
              {meta.emoji}
            </span>
            <div>
              <h1
                className="text-xl lg:text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {track.name}
              </h1>
              <p className="text-xs text-muted-foreground">{meta.tagline}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Link href={`/track/${track.key}/quiz`}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <Brain className="w-3.5 h-3.5" /> Practice Quiz
                <span className="font-mono opacity-80">
                  ({track.counts.practice_questions})
                </span>
              </span>
            </Link>
            <Link href={`/track/${track.key}/flashcards`}>
              <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                <ListMusic className="w-3.5 h-3.5" /> Flashcards
                <span className="font-mono opacity-80">
                  ({track.counts.flashcards})
                </span>
              </span>
            </Link>
            <span className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-accent text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" /> {track.counts.chapters} chapters ·{' '}
              {track.counts.subsections} sections
            </span>
          </div>
        </div>

        {/* Exam overview rail */}
        {track.exam_overview && track.exam_overview.length > 0 && (
          <div className="px-6 lg:px-10 py-4 border-b border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
                Exam Overview
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {track.exam_overview.slice(0, 8).map((row, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {row[0]}
                  </p>
                  <p className="text-sm font-semibold mt-1">{row[1]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body — sidebar TOC + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0">
          <aside className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-border bg-sidebar/30">
            {/* Mobile: collapsible <details>; Desktop: always-open list */}
            <details className="lg:hidden" open={false}>
              <summary className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground">
                Chapters ({track.chapters.filter(hasContent).length})
              </summary>
              <nav
                className="space-y-0.5 px-3 pb-3"
                aria-label="Chapter navigation (mobile)"
              >
                {track.chapters.map((c) => {
                  if (!hasContent(c)) return null;
                  const isActive =
                    c.id === (activeChapterId ?? initialChapterId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveChapterId(c.id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-2">{c.title}</span>
                    </button>
                  );
                })}
              </nav>
            </details>

            <div className="hidden lg:block px-3 py-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-3 mb-2">
                Chapters
              </p>
              <nav
                className="space-y-0.5"
                aria-label="Chapter navigation"
              >
                {track.chapters.map((c) => {
                  if (!hasContent(c)) return null;
                  const isActive =
                    c.id === (activeChapterId ?? initialChapterId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveChapterId(c.id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-2">{c.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <article className="px-6 lg:px-10 py-8 max-w-3xl">
            {activeChapter && (
              <motion.div
                key={activeChapter.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <h2
                  className="text-2xl font-bold tracking-tight mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {activeChapter.title}
                </h2>

                {activeChapter.intro &&
                  activeChapter.intro.split('\n').map(
                    (p, i) =>
                      p.trim() && (
                        <p
                          key={`intro-${i}`}
                          className="text-sm text-foreground/85 leading-relaxed mb-3"
                        >
                          {p}
                        </p>
                      ),
                  )}

                {activeChapter.tables?.map((t, i) => (
                  <TrackTable key={`ct-${i}`} rows={t.rows} />
                ))}

                {activeChapter.subsections.map((sub) => (
                  <section key={sub.id} className="mt-6 group/section">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {sub.level === 2 ? (
                        <h3
                          className="text-lg font-semibold"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {sub.title}
                        </h3>
                      ) : (
                        <h4 className="text-base font-semibold text-primary">
                          {sub.title}
                        </h4>
                      )}
                      <div className="opacity-0 group-hover/section:opacity-100 transition-opacity">
                        <BookmarkButton
                          contentType="track_section"
                          contentId={`${track.key}-${activeChapter.id}-${sub.id}`}
                          contentTitle={`${track.name}: ${sub.title}`}
                          discipline={track.name}
                          size="sm"
                        />
                      </div>
                    </div>
                    {sub.paragraphs.map((p, i) => (
                      <p
                        key={`sp-${sub.id}-${i}`}
                        className="text-sm text-foreground/85 leading-relaxed mb-3"
                      >
                        {p}
                      </p>
                    ))}
                    {sub.tables?.map((t, i) => (
                      <TrackTable key={`st-${sub.id}-${i}`} rows={t.rows} />
                    ))}
                  </section>
                ))}
              </motion.div>
            )}
          </article>
        </div>
      </div>
    </Navigation>
  );
}
