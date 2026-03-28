import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { MasteryState, SessionStats } from '@/data/types';
import { trpc } from '@/lib/trpc';

/* ── Spaced Repetition Intervals (hours) ── */
const SRS_INTERVALS = [0, 4, 24, 72, 168, 336, 720]; // 0h, 4h, 1d, 3d, 7d, 14d, 30d

/* ── Achievement Definitions ── */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (ctx: MasterySnapshot) => boolean;
}

interface MasterySnapshot {
  studied: number;
  mastered: number;
  streak: number;
  quizScore: number;
  quizTotal: number;
  totalStudyTime: number;
  disciplinesMastered: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'First Step', description: 'Study your first definition', icon: '🌱', condition: s => s.studied >= 1 },
  { id: 'century', title: 'Century Club', description: 'Study 100 definitions', icon: '💯', condition: s => s.studied >= 100 },
  { id: 'five-hundred', title: 'Scholar', description: 'Study 500 definitions', icon: '📖', condition: s => s.studied >= 500 },
  { id: 'thousand', title: 'Knowledge Architect', description: 'Study 1,000 definitions', icon: '🏛️', condition: s => s.studied >= 1000 },
  { id: 'all-studied', title: 'Completionist', description: 'Study all 2,000+ definitions', icon: '🎓', condition: s => s.studied >= 2000 },
  { id: 'first-master', title: 'First Mastery', description: 'Master your first concept', icon: '⭐', condition: s => s.mastered >= 1 },
  { id: 'fifty-master', title: 'Rising Expert', description: 'Master 50 concepts', icon: '🔥', condition: s => s.mastered >= 50 },
  { id: 'hundred-master', title: 'Domain Expert', description: 'Master 100 concepts', icon: '🏆', condition: s => s.mastered >= 100 },
  { id: 'streak-3', title: 'Consistent', description: 'Achieve a 3-day streak', icon: '🔗', condition: s => s.streak >= 3 },
  { id: 'streak-7', title: 'Dedicated', description: 'Achieve a 7-day streak', icon: '⚡', condition: s => s.streak >= 7 },
  { id: 'streak-30', title: 'Unstoppable', description: 'Achieve a 30-day streak', icon: '💎', condition: s => s.streak >= 30 },
  { id: 'quiz-10', title: 'Quiz Starter', description: 'Answer 10 quiz questions', icon: '🧠', condition: s => s.quizTotal >= 10 },
  { id: 'quiz-perfect-10', title: 'Perfect Ten', description: 'Score 10/10 on a quiz run', icon: '🎯', condition: s => s.quizScore >= 10 && s.quizTotal >= 10 },
  { id: 'hour-1', title: 'First Hour', description: 'Study for 1 hour total', icon: '⏱️', condition: s => s.totalStudyTime >= 60 },
  { id: 'hour-10', title: 'Deep Diver', description: 'Study for 10 hours total', icon: '🤿', condition: s => s.totalStudyTime >= 600 },
  { id: 'discipline-1', title: 'Specialist', description: 'Master an entire discipline', icon: '🎖️', condition: s => s.disciplinesMastered >= 1 },
];

/* ── Daily Goal ── */
export interface DailyGoal {
  definitions: number;
  formulas: number;
  quizQuestions: number;
}

const DEFAULT_GOAL: DailyGoal = { definitions: 20, formulas: 5, quizQuestions: 10 };

interface MasteryContextType {
  mastery: MasteryState;
  session: SessionStats;
  markSeen: (key: string) => void;
  markMastered: (key: string) => void;
  setConfidence: (key: string, level: number) => void;
  incrementQuiz: (correct: boolean) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  getMasteryPercent: (discipline?: string) => number;
  getStudiedCount: (discipline?: string) => number;
  getMasteredCount: (discipline?: string) => number;
  resetSession: () => void;
  totalStudyTime: number;
  getDueItems: () => string[];
  getNextReviewTime: (key: string) => number | null;
  unlockedAchievements: string[];
  newAchievement: Achievement | null;
  dismissAchievement: () => void;
  dailyGoal: DailyGoal;
  setDailyGoal: (goal: DailyGoal) => void;
  dailyProgress: { definitions: number; formulas: number; quizQuestions: number };
  studyHistory: Record<string, number>;
  cloudSyncStatus: 'idle' | 'syncing' | 'synced' | 'error';
}

const MasteryContext = createContext<MasteryContextType | null>(null);

const STORAGE_KEY = 'emba-mastery-state';
const SESSION_KEY = 'emba-session-stats';
const TIME_KEY = 'emba-total-study-time';
const ACHIEVEMENTS_KEY = 'emba-achievements';
const GOAL_KEY = 'emba-daily-goal';
const DAILY_PROGRESS_KEY = 'emba-daily-progress';
const HISTORY_KEY = 'emba-study-history';
const DIRTY_KEY = 'emba-mastery-dirty';

function loadMastery(): MasteryState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function loadSession(): SessionStats {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const hoursSinceStart = (Date.now() - parsed.startTime) / (1000 * 60 * 60);
      if (hoursSinceStart > 4) {
        return { termsStudied: 0, formulasPracticed: 0, quizScore: 0, quizTotal: 0, streak: 0, startTime: Date.now(), lastStudiedItem: null, currentDiscipline: null };
      }
      return { ...parsed, lastStudiedItem: parsed.lastStudiedItem ?? null, currentDiscipline: parsed.currentDiscipline ?? null };
    }
  } catch { /* ignore */ }
  return { termsStudied: 0, formulasPracticed: 0, quizScore: 0, quizTotal: 0, streak: 0, startTime: Date.now(), lastStudiedItem: null, currentDiscipline: null };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function MasteryProvider({ children }: { children: ReactNode }) {
  const [mastery, setMastery] = useState<MasteryState>(loadMastery);
  const [session, setSession] = useState<SessionStats>(loadSession);
  const [totalStudyTime, setTotalStudyTime] = useState(() => {
    try { return parseInt(localStorage.getItem(TIME_KEY) || '0'); } catch { return 0; }
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]'); } catch { return []; }
  });
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [dailyGoal, setDailyGoalState] = useState<DailyGoal>(() => {
    try { return JSON.parse(localStorage.getItem(GOAL_KEY) || 'null') || DEFAULT_GOAL; } catch { return DEFAULT_GOAL; }
  });
  const [dailyProgress, setDailyProgress] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(DAILY_PROGRESS_KEY) || '{}');
      if (stored.date === todayKey()) return stored;
    } catch { /* ignore */ }
    return { date: todayKey(), definitions: 0, formulas: 0, quizQuestions: 0 };
  });
  const [studyHistory, setStudyHistory] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}'); } catch { return {}; }
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const dirtyKeysRef = useRef<Set<string>>(new Set());
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Cloud Sync: tRPC mutations ── */
  const authQuery = trpc.auth.me.useQuery(undefined, { retry: false });
  const isAuthenticated = !!authQuery.data;

  const cloudMasteryQuery = trpc.mastery.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 min
    retry: 1,
  });

  const syncBatchMutation = trpc.mastery.syncBatch.useMutation();
  const syncAchievementsMutation = trpc.achievements.syncBatch.useMutation();
  const createSessionMutation = trpc.sessions.create.useMutation();

  /* ── Initial cloud pull: merge server data into local ── */
  useEffect(() => {
    if (!cloudMasteryQuery.data || cloudMasteryQuery.data.length === 0) return;

    setMastery(prev => {
      const merged = { ...prev };
      let changed = false;
      for (const row of cloudMasteryQuery.data) {
        const local = merged[row.itemKey];
        const serverUpdatedAt = row.updatedAt || 0;
        const localUpdatedAt = local?.lastReviewed || 0;

        // Server wins if newer, or if local doesn't have this item
        if (!local || serverUpdatedAt > localUpdatedAt) {
          merged[row.itemKey] = {
            seen: row.seen,
            mastered: row.mastered,
            confidence: row.confidence,
            reviewCount: row.reviewCount,
            lastReviewed: row.lastReviewed,
          };
          changed = true;
        }
      }
      if (changed) return merged;
      return prev;
    });
  }, [cloudMasteryQuery.data]);

  /* ── Cloud sync: push dirty items every 30 seconds ── */
  const flushDirtyItems = useCallback(() => {
    if (!isAuthenticated || dirtyKeysRef.current.size === 0) return;

    const keys = Array.from(dirtyKeysRef.current);
    dirtyKeysRef.current.clear();

    // Read current mastery state from localStorage (most up-to-date)
    const currentMastery = loadMastery();
    const items = keys
      .filter(k => currentMastery[k])
      .map(k => ({
        itemKey: k,
        seen: currentMastery[k].seen || false,
        mastered: currentMastery[k].mastered || false,
        confidence: currentMastery[k].confidence || 0,
        reviewCount: currentMastery[k].reviewCount || 0,
        lastReviewed: currentMastery[k].lastReviewed || 0,
        updatedAt: currentMastery[k].lastReviewed || Date.now(),
      }));

    if (items.length === 0) return;

    setCloudSyncStatus('syncing');
    syncBatchMutation.mutate(
      { items },
      {
        onSuccess: () => setCloudSyncStatus('synced'),
        onError: () => {
          // Re-add failed keys for next sync attempt
          keys.forEach(k => dirtyKeysRef.current.add(k));
          setCloudSyncStatus('error');
        },
      }
    );
  }, [isAuthenticated, syncBatchMutation]);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncTimerRef.current = setInterval(flushDirtyItems, 30000);
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [isAuthenticated, flushDirtyItems]);

  // Flush on page unload
  useEffect(() => {
    const handler = () => flushDirtyItems();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [flushDirtyItems]);

  /* ── Sync achievements to cloud ── */
  useEffect(() => {
    if (!isAuthenticated || unlockedAchievements.length === 0) return;
    syncAchievementsMutation.mutate({ achievementIds: unlockedAchievements });
  }, [isAuthenticated, unlockedAchievements.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safe localStorage writer with quota error handling
  const safeSave = useCallback((key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        try {
          const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
          const keys = Object.keys(hist).sort();
          if (keys.length > 30) {
            const pruned: Record<string, number> = {};
            keys.slice(-30).forEach(k => { pruned[k] = hist[k]; });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
          }
          localStorage.setItem(key, JSON.stringify(data));
        } catch { /* silently fail — data still in memory */ }
      }
    }
  }, []);

  // Persist all state to localStorage
  useEffect(() => { safeSave(STORAGE_KEY, mastery); }, [mastery, safeSave]);
  useEffect(() => { safeSave(SESSION_KEY, session); }, [session, safeSave]);
  useEffect(() => { safeSave(ACHIEVEMENTS_KEY, unlockedAchievements); }, [unlockedAchievements, safeSave]);
  useEffect(() => { safeSave(GOAL_KEY, dailyGoal); }, [dailyGoal, safeSave]);
  useEffect(() => { safeSave(DAILY_PROGRESS_KEY, dailyProgress); }, [dailyProgress, safeSave]);
  useEffect(() => { safeSave(HISTORY_KEY, studyHistory); }, [studyHistory, safeSave]);

  // Study time ticker — only counts when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      setTotalStudyTime(prev => {
        const next = prev + 1;
        try { localStorage.setItem(TIME_KEY, String(next)); } catch { /* quota */ }
        return next;
      });
      setStudyHistory(prev => {
        const key = todayKey();
        return { ...prev, [key]: (prev[key] || 0) + 1 };
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Achievement checker
  const checkAchievements = useCallback((masteryState: MasteryState, sessionState: SessionStats) => {
    const studied = Object.keys(masteryState).filter(k => masteryState[k]?.seen).length;
    const mastered = Object.keys(masteryState).filter(k => masteryState[k]?.mastered).length;

    const disciplineCounts: Record<string, { total: number; mastered: number }> = {};
    Object.keys(masteryState).forEach(k => {
      const parts = k.split('-');
      if (parts[0] === 'def' && parts.length >= 3) {
        const disc = parts.slice(1, -1).join('-');
        if (!disciplineCounts[disc]) disciplineCounts[disc] = { total: 0, mastered: 0 };
        disciplineCounts[disc].total++;
        if (masteryState[k]?.mastered) disciplineCounts[disc].mastered++;
      }
    });
    const disciplinesMastered = Object.values(disciplineCounts).filter(d => d.total > 0 && d.mastered / d.total >= 0.8).length;

    const snapshot: MasterySnapshot = {
      studied, mastered,
      streak: sessionState.streak,
      quizScore: sessionState.quizScore,
      quizTotal: sessionState.quizTotal,
      totalStudyTime,
      disciplinesMastered,
    };

    const currentUnlocked = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]') as string[];
    for (const achievement of ACHIEVEMENTS) {
      if (!currentUnlocked.includes(achievement.id) && achievement.condition(snapshot)) {
        const updated = [...currentUnlocked, achievement.id];
        setUnlockedAchievements(updated);
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(updated));
        setNewAchievement(achievement);
        break;
      }
    }
  }, [totalStudyTime]);

  // Helper: mark a key as dirty for cloud sync
  const markDirty = useCallback((key: string) => {
    dirtyKeysRef.current.add(key);
  }, []);

  const markSeen = useCallback((key: string) => {
    setMastery(prev => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          seen: true,
          lastReviewed: Date.now(),
          reviewCount: (prev[key]?.reviewCount || 0) + 1,
          mastered: prev[key]?.mastered || false,
          confidence: prev[key]?.confidence || 0,
        }
      };
      setTimeout(() => checkAchievements(next, session), 0);
      return next;
    });
    // Track last studied item for self-discovery
    const parts = key.split('-');
    const discipline = parts.length > 1 ? parts[1] : null;
    const itemName = parts.length > 2 ? parts.slice(2).join('-') : key;
    setSession(prev => ({ ...prev, lastStudiedItem: itemName, currentDiscipline: discipline }));
    markDirty(key);
    setSession(prev => ({ ...prev, termsStudied: prev.termsStudied + 1 }));
    setDailyProgress((prev: { date: string; definitions: number; formulas: number; quizQuestions: number }) => {
      const today = todayKey();
      if (prev.date !== today) return { date: today, definitions: 1, formulas: 0, quizQuestions: 0 };
      return { ...prev, definitions: prev.definitions + 1 };
    });
  }, [checkAchievements, session, markDirty]);

  const markMastered = useCallback((key: string) => {
    setMastery(prev => {
      const next = {
        ...prev,
        [key]: { ...prev[key], mastered: true, confidence: 5, seen: true, lastReviewed: Date.now(), reviewCount: (prev[key]?.reviewCount || 0) + 1 }
      };
      setTimeout(() => checkAchievements(next, session), 0);
      return next;
    });
    markDirty(key);
  }, [checkAchievements, session, markDirty]);

  const setConfidence = useCallback((key: string, level: number) => {
    setMastery(prev => {
      const next = {
        ...prev,
        [key]: { ...prev[key], confidence: level, seen: true, lastReviewed: Date.now(), mastered: level >= 4, reviewCount: (prev[key]?.reviewCount || 0) + 1 }
      };
      setTimeout(() => checkAchievements(next, session), 0);
      return next;
    });
    markDirty(key);
  }, [checkAchievements, session, markDirty]);

  const incrementQuiz = useCallback((correct: boolean) => {
    setSession(prev => {
      const next = { ...prev, quizScore: prev.quizScore + (correct ? 1 : 0), quizTotal: prev.quizTotal + 1 };
      setTimeout(() => checkAchievements(mastery, next), 0);
      return next;
    });
    setDailyProgress((prev: { date: string; definitions: number; formulas: number; quizQuestions: number }) => {
      const today = todayKey();
      if (prev.date !== today) return { date: today, definitions: 0, formulas: 0, quizQuestions: 1 };
      return { ...prev, quizQuestions: prev.quizQuestions + 1 };
    });
  }, [checkAchievements, mastery]);

  const incrementStreak = useCallback(() => {
    setSession(prev => ({ ...prev, streak: prev.streak + 1 }));
  }, []);

  const resetStreak = useCallback(() => {
    setSession(prev => ({ ...prev, streak: 0 }));
  }, []);

  const getMasteryPercent = useCallback((discipline?: string) => {
    const keys = Object.keys(mastery).filter(k => !discipline || k.startsWith(`def-${discipline}-`) || k.startsWith(`formula-${discipline}-`));
    if (keys.length === 0) return 0;
    const m = keys.filter(k => mastery[k]?.mastered).length;
    return Math.round((m / keys.length) * 100);
  }, [mastery]);

  const getStudiedCount = useCallback((discipline?: string) => {
    return Object.keys(mastery).filter(k => (!discipline || k.includes(discipline)) && mastery[k]?.seen).length;
  }, [mastery]);

  const getMasteredCount = useCallback((discipline?: string) => {
    return Object.keys(mastery).filter(k => (!discipline || k.includes(discipline)) && mastery[k]?.mastered).length;
  }, [mastery]);

  const resetSession = useCallback(() => {
    setSession({ termsStudied: 0, formulasPracticed: 0, quizScore: 0, quizTotal: 0, streak: 0, startTime: Date.now(), lastStudiedItem: null, currentDiscipline: null });
  }, []);

  // SRS: Get items due for review
  const getDueItems = useCallback(() => {
    const now = Date.now();
    return Object.keys(mastery).filter(key => {
      const entry = mastery[key];
      if (!entry?.seen) return false;
      const confidence = entry.confidence || 0;
      const intervalHours = SRS_INTERVALS[Math.min(confidence, SRS_INTERVALS.length - 1)];
      const nextReview = (entry.lastReviewed || 0) + intervalHours * 3600000;
      return now >= nextReview;
    });
  }, [mastery]);

  const getNextReviewTime = useCallback((key: string) => {
    const entry = mastery[key];
    if (!entry?.seen) return null;
    const confidence = entry.confidence || 0;
    const intervalHours = SRS_INTERVALS[Math.min(confidence, SRS_INTERVALS.length - 1)];
    return (entry.lastReviewed || 0) + intervalHours * 3600000;
  }, [mastery]);

  const dismissAchievement = useCallback(() => setNewAchievement(null), []);

  const setDailyGoal = useCallback((goal: DailyGoal) => {
    setDailyGoalState(goal);
  }, []);

  return (
    <MasteryContext.Provider value={{
      mastery, session, markSeen, markMastered, setConfidence,
      incrementQuiz, incrementStreak, resetStreak,
      getMasteryPercent, getStudiedCount, getMasteredCount,
      resetSession, totalStudyTime,
      getDueItems, getNextReviewTime,
      unlockedAchievements, newAchievement, dismissAchievement,
      dailyGoal, setDailyGoal, dailyProgress,
      studyHistory, cloudSyncStatus,
    }}>
      {children}
    </MasteryContext.Provider>
  );
}

export function useMastery() {
  const ctx = useContext(MasteryContext);
  if (!ctx) throw new Error('useMastery must be used within MasteryProvider');
  return ctx;
}
