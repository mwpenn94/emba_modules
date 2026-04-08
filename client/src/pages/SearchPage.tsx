/**
 * DESIGN: The Atelier — Universal Search
 * Full-text search across definitions, formulas, cases, and FS applications
 */

import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useState, useMemo } from 'react';
import embaData from '@/data/emba_data.json';
import { DISCIPLINE_COLORS, TRACK_META } from '@/data/types';
import { useTracks } from '@/hooks/useTracks';
import { ArrowLeft, Search as SearchIcon, BookOpen, FlaskConical, Briefcase, Lightbulb, Library, Brain } from 'lucide-react';

type ResultType =
  | 'definition'
  | 'formula'
  | 'case'
  | 'fs_app'
  | 'track_section'
  | 'track_card'
  | 'track_question';

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  content: string;
  discipline: string;
  href?: string;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResultType | 'all'>('all');
  const { tracks } = useTracks();

  const allResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    (embaData.definitions || []).forEach((d: any) => {
      if (d.term.toLowerCase().includes(q) || d.definition.toLowerCase().includes(q)) {
        results.push({ type: 'definition', id: `def-${d.id}`, title: d.term, content: d.definition, discipline: d.discipline });
      }
    });

    (embaData.formulas || []).forEach((f: any) => {
      if (f.name.toLowerCase().includes(q) || f.formula.toLowerCase().includes(q) || f.variables.some((v: string) => v.toLowerCase().includes(q))) {
        results.push({ type: 'formula', id: `for-${f.id}`, title: f.name, content: f.formula, discipline: f.discipline });
      }
    });

    (embaData.cases || []).forEach((c: any) => {
      if (c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q)) {
        results.push({ type: 'case', id: `case-${c.id}`, title: c.title, content: c.content, discipline: c.discipline });
      }
    });

    (embaData.fs_applications || []).forEach((a: any) => {
      if (a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)) {
        results.push({ type: 'fs_app', id: `fs-${a.id}`, title: a.title, content: a.content, discipline: a.discipline });
      }
    });

    // Search across exam-track content (chapters/subsections, flashcards,
    // practice questions). Cap each track's contribution to keep results
    // balanced across the corpus.
    tracks.forEach((track) => {
      let trackHits = 0;
      const TRACK_CAP = 8;
      for (const ch of track.chapters) {
        for (const sub of ch.subsections) {
          if (trackHits >= TRACK_CAP) break;
          const text = sub.title + ' ' + sub.paragraphs.join(' ');
          if (text.toLowerCase().includes(q)) {
            results.push({
              type: 'track_section',
              id: `tsec-${track.key}-${ch.id}-${sub.id}`,
              title: `${track.name} · ${sub.title}`,
              content: sub.paragraphs[0] || ch.title,
              discipline: track.name,
              href: `/track/${track.key}`,
            });
            trackHits += 1;
          }
        }
      }
      let cardHits = 0;
      for (const card of track.flashcards) {
        if (cardHits >= 4) break;
        if (
          card.term.toLowerCase().includes(q) ||
          card.definition.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'track_card',
            id: `tcard-${track.key}-${card.id}`,
            title: `${track.name} · ${card.term}`,
            content: card.definition,
            discipline: track.name,
            href: `/track/${track.key}/flashcards`,
          });
          cardHits += 1;
        }
      }
      let qHits = 0;
      for (const pq of track.practice_questions) {
        if (qHits >= 4) break;
        if (
          pq.prompt.toLowerCase().includes(q) ||
          pq.explanation.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'track_question',
            id: `tq-${track.key}-${pq.number}`,
            title: `${track.name} · Q${pq.number}`,
            content: pq.prompt,
            discipline: track.name,
            href: `/track/${track.key}/quiz`,
          });
          qHits += 1;
        }
      }
    });

    return results;
  }, [query, tracks]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return allResults;
    return allResults.filter(r => r.type === typeFilter);
  }, [allResults, typeFilter]);

  const counts = useMemo(() => ({
    all: allResults.length,
    definition: allResults.filter(r => r.type === 'definition').length,
    formula: allResults.filter(r => r.type === 'formula').length,
    case: allResults.filter(r => r.type === 'case').length,
    fs_app: allResults.filter(r => r.type === 'fs_app').length,
    track_section: allResults.filter(r => r.type === 'track_section').length,
    track_card: allResults.filter(r => r.type === 'track_card').length,
    track_question: allResults.filter(r => r.type === 'track_question').length,
  }), [allResults]);

  const typeIcon = (type: ResultType) => {
    switch (type) {
      case 'definition': return <BookOpen className="w-3.5 h-3.5" />;
      case 'formula': return <FlaskConical className="w-3.5 h-3.5" />;
      case 'case': return <Briefcase className="w-3.5 h-3.5" />;
      case 'fs_app': return <Lightbulb className="w-3.5 h-3.5" />;
      case 'track_section': return <Library className="w-3.5 h-3.5" />;
      case 'track_card': return <BookOpen className="w-3.5 h-3.5" />;
      case 'track_question': return <Brain className="w-3.5 h-3.5" />;
    }
  };

  const typeLabel = (type: ResultType) => {
    switch (type) {
      case 'definition': return 'Definition';
      case 'formula': return 'Formula';
      case 'case': return 'Case Study';
      case 'fs_app': return 'FS Application';
      case 'track_section': return 'Track Section';
      case 'track_card': return 'Track Flashcard';
      case 'track_question': return 'Practice Q';
    }
  };

  function highlightMatch(text: string, q: string) {
    if (!q || q.length < 2) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text.length > 200 ? text.slice(0, 200) + '...' : text;
    const start = Math.max(0, idx - 60);
    const end = Math.min(text.length, idx + q.length + 100);
    const before = (start > 0 ? '...' : '') + text.slice(start, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length, end) + (end < text.length ? '...' : '');
    return (
      <span>{before}<mark className="bg-primary/30 text-foreground rounded px-0.5">{match}</mark>{after}</span>
    );
  }

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
              <SearchIcon className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Search</h1>
            </div>

            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="search"
                role="searchbox"
                aria-label="Search definitions, formulas, cases, and applications"
                placeholder="Search definitions, formulas, cases, applications..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 text-base bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {query.length >= 2 && (
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
                {([
                  ['all', 'All'],
                  ['definition', 'Definitions'],
                  ['formula', 'Formulas'],
                  ['case', 'Cases'],
                  ['fs_app', 'FS Apps'],
                  ['track_section', 'Track Sections'],
                  ['track_card', 'Track Cards'],
                  ['track_question', 'Practice Qs'],
                ] as [string, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key as any)}
                    className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                      typeFilter === key ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label} ({counts[key as keyof typeof counts]})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-10 py-6">
          {query.length < 2 ? (
            <div className="text-center py-20">
              <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Type at least 2 characters to search across all {(embaData.definitions || []).length + (embaData.formulas || []).length} items.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <SearchIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-2" role="list" aria-label={`${filtered.length} search results`}>
              {filtered.slice(0, 100).map((r, i) => {
                const isTrack =
                  r.type === 'track_section' ||
                  r.type === 'track_card' ||
                  r.type === 'track_question';
                const trackKey = isTrack ? r.id.split('-')[1] : undefined;
                const trackMeta = trackKey ? TRACK_META[trackKey] : undefined;
                const color = isTrack
                  ? trackMeta?.color || 'var(--primary)'
                  : DISCIPLINE_COLORS[r.discipline] || 'var(--primary)';
                const titleNode = (
                  <h3
                    className="text-sm font-semibold mb-1 hover:text-primary transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {r.title}
                  </h3>
                );
                return (
                  <motion.div
                    key={`${r.type}-${r.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/20 transition-all"
                    role="listitem"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                        {typeIcon(r.type)} {typeLabel(r.type)}
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded text-primary-foreground"
                        style={{ background: color }}
                      >
                        {r.discipline}
                      </span>
                    </div>
                    {r.type === 'definition' ? (
                      <Link href={`/discipline/${slugify(r.discipline)}`}>{titleNode}</Link>
                    ) : isTrack && r.href ? (
                      <Link href={r.href}>{titleNode}</Link>
                    ) : (
                      <h3
                        className="text-sm font-semibold mb-1"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {r.title}
                      </h3>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {r.type === 'formula' ? (
                        <span className="font-mono">{r.content}</span>
                      ) : (
                        highlightMatch(r.content, query)
                      )}
                    </p>
                  </motion.div>
                );
              })}
              {filtered.length > 100 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Showing 100 of {filtered.length} results. Refine your search for more specific results.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Navigation>
  );
}
