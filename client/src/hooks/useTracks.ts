/**
 * useTracks — typed access to the WealthBridge exam-track library.
 *
 * The dataset is built by `scripts/build_tracks_data.py` from the
 * WealthBridgeLibraryv11_QA.zip archive (study manuals + flashcards) plus the
 * EMBA master manual at the repo root.  This hook layers display metadata
 * (colors, taglines) on top of the raw JSON and exposes lookup helpers.
 */

import { useMemo } from 'react';
import tracksRaw from '@/data/tracks_data.json';
import type {
  ExamTrack,
  TrackCategory,
  TracksDataset,
} from '@/data/types';
import { TRACK_META } from '@/data/types';

const dataset = tracksRaw as unknown as TracksDataset;

export function useTracks() {
  const tracks = dataset.tracks as ExamTrack[];

  const byKey = useMemo(() => {
    const map = new Map<string, ExamTrack>();
    for (const t of tracks) map.set(t.key, t);
    return map;
  }, [tracks]);

  const byCategory = useMemo(() => {
    const map = new Map<TrackCategory, ExamTrack[]>();
    for (const t of tracks) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [tracks]);

  return {
    dataset,
    tracks,
    categories: dataset.categories,
    byKey,
    byCategory,
    stats: dataset.stats,
    meta: TRACK_META,
  };
}

export function useTrack(key: string | undefined): ExamTrack | undefined {
  const { byKey } = useTracks();
  if (!key) return undefined;
  return byKey.get(key);
}
