/**
 * tracks.test.ts — sanity tests for the WealthBridge exam-track dataset.
 *
 * The dataset is a static JSON file built by `scripts/build_tracks_data.py`.
 * These tests guard against regressions in the parser by enforcing
 * structural invariants on the generated content (every track has chapters,
 * every practice question has 4 options, etc).  They run quickly because
 * they only inspect the JSON — no DB or network involved.
 */

import { describe, expect, it } from 'vitest';
import tracksDataRaw from '../client/src/data/tracks_data.json';

interface PracticeQuestion {
  number: number;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Subsection {
  id: string;
  title: string;
  paragraphs: string[];
  tables: { rows: string[][] }[];
}

interface Chapter {
  id: string;
  title: string;
  intro: string;
  subsections: Subsection[];
  is_practice: boolean;
}

interface Track {
  key: string;
  name: string;
  category: string;
  chapters: Chapter[];
  practice_questions: PracticeQuestion[];
  flashcards: { id: number; term: string; definition: string }[];
  exam_overview: string[][];
  counts: {
    chapters: number;
    subsections: number;
    practice_questions: number;
    flashcards: number;
  };
}

interface TracksDataset {
  schema_version: number;
  categories: Record<string, unknown>;
  tracks: Track[];
  stats: {
    total_tracks: number;
    total_chapters: number;
    total_practice_questions: number;
    total_flashcards: number;
  };
}

const tracks = tracksDataRaw as unknown as TracksDataset;

describe('tracks_data.json', () => {
  it('declares schema version', () => {
    expect(tracks.schema_version).toBeGreaterThanOrEqual(1);
  });

  it('contains all 13 expected study tracks', () => {
    const expectedKeys = [
      'emba',
      'sie',
      'series7',
      'series66',
      'cfp',
      'financial_planning',
      'investment_advisory',
      'estate_planning',
      'premium_financing',
      'life_health',
      'general_insurance',
      'p_and_c',
      'surplus_lines',
    ];
    const actualKeys = tracks.tracks.map((t) => t.key);
    for (const k of expectedKeys) {
      expect(actualKeys).toContain(k);
    }
  });

  it('every track has at least one non-empty study chapter', () => {
    for (const t of tracks.tracks) {
      const realChapters = t.chapters.filter(
        (c) =>
          !c.is_practice &&
          (c.intro.trim().length > 0 ||
            c.subsections.length > 0),
      );
      expect(realChapters.length, `${t.key} should have study chapters`).toBeGreaterThan(0);
    }
  });

  it('every track has at least 5 practice questions', () => {
    for (const t of tracks.tracks) {
      expect(
        t.practice_questions.length,
        `${t.key} should have practice questions`,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it('every practice question has exactly 4 options and a valid correct index', () => {
    for (const t of tracks.tracks) {
      for (const q of t.practice_questions) {
        expect(
          q.options.length,
          `${t.key} Q${q.number} option count`,
        ).toBe(4);
        expect(q.correct, `${t.key} Q${q.number} correct index`).toBeGreaterThanOrEqual(0);
        expect(q.correct, `${t.key} Q${q.number} correct index`).toBeLessThan(4);
        expect(q.prompt.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every track has flashcards with non-empty term and definition', () => {
    for (const t of tracks.tracks) {
      expect(t.flashcards.length, `${t.key} flashcards`).toBeGreaterThan(0);
      for (const card of t.flashcards) {
        expect(card.term.trim().length).toBeGreaterThan(0);
        expect(card.definition.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('no subsection is completely empty', () => {
    for (const t of tracks.tracks) {
      for (const c of t.chapters) {
        for (const s of c.subsections) {
          const hasContent =
            s.paragraphs.length > 0 || (s.tables?.length ?? 0) > 0;
          expect(
            hasContent,
            `${t.key} ${c.title} -> ${s.title} should have content`,
          ).toBe(true);
        }
      }
    }
  });

  it('aggregate stats are consistent with per-track counts', () => {
    const expected = tracks.tracks.reduce(
      (acc, t) => ({
        chapters: acc.chapters + t.counts.chapters,
        questions: acc.questions + t.counts.practice_questions,
        flashcards: acc.flashcards + t.counts.flashcards,
      }),
      { chapters: 0, questions: 0, flashcards: 0 },
    );
    expect(tracks.stats.total_chapters).toBe(expected.chapters);
    expect(tracks.stats.total_practice_questions).toBe(expected.questions);
    expect(tracks.stats.total_flashcards).toBe(expected.flashcards);
  });

  it('every track key is URL-safe', () => {
    const re = /^[a-z0-9_]+$/;
    for (const t of tracks.tracks) {
      expect(re.test(t.key), `${t.key} URL-safe`).toBe(true);
    }
  });
});
