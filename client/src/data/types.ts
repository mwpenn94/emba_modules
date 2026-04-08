export interface Definition {
  id: number;
  term: string;
  definition: string;
  discipline: string;
}

export interface Formula {
  id: number;
  name: string;
  formula: string;
  discipline: string;
  variables: string[];
}

export interface CaseStudy {
  id: number;
  title: string;
  content: string;
  discipline: string;
}

export interface FSApplication {
  id: number;
  title: string;
  content: string;
  discipline: string;
}

export interface Connection {
  from: string;
  to: string;
  concept_from: string;
  concept_to: string;
  relationship: string;
}

export interface EMBAData {
  definitions: Definition[];
  formulas: Formula[];
  cases: CaseStudy[];
  fs_applications: FSApplication[];
  connections: Connection[];
  disciplines: string[];
  stats: {
    total_definitions: number;
    total_formulas: number;
    total_cases: number;
    total_fs_apps: number;
  };
}

export type ContentType = 'definition' | 'formula' | 'case' | 'fs_application';

export type StudyMode = 'explore' | 'study' | 'quiz' | 'connections';

export interface MasteryState {
  [key: string]: {
    seen: boolean;
    mastered: boolean;
    lastReviewed: number;
    reviewCount: number;
    confidence: number; // 0-5
  };
}

export interface SessionStats {
  termsStudied: number;
  formulasPracticed: number;
  quizScore: number;
  quizTotal: number;
  streak: number;
  startTime: number;
  lastStudiedItem: string | null;
  currentDiscipline: string | null;
}

export const DISCIPLINE_COLORS: Record<string, string> = {
  'Accounting': 'var(--discipline-accounting)',
  'Markets & Economies': 'var(--discipline-markets)',
  'Finance': 'var(--discipline-finance)',
  'Strategy': 'var(--discipline-strategy)',
  'Leading Organizations': 'var(--discipline-leadership)',
  'Data & Decisions': 'var(--discipline-data)',
  'Marketing & Pricing': 'var(--discipline-marketing)',
  'Supply Chain & Operations': 'var(--discipline-operations)',
  'US Business Law': 'var(--discipline-law)',
  'Business Communications': 'var(--discipline-communications)',
  'Entrepreneurship': 'var(--discipline-entrepreneurship)',
  'Entrepreneurial Finance': 'var(--discipline-finance)',
  'Blockchain': 'var(--discipline-blockchain)',
  'AI for Business': 'var(--discipline-ai)',
  'Managing Software Development': 'var(--discipline-software)',
  'Statistical Analysis': 'var(--discipline-data)',
  'Advanced Finance': 'var(--discipline-finance)',
  'Advanced Marketing': 'var(--discipline-marketing)',
  'Advanced Corporate-Level Strategy': 'var(--discipline-strategy)',
  'Advanced Statistical Inference': 'var(--discipline-data)',
  'Strategic Leadership': 'var(--discipline-leadership)',
  'English Business Law': 'var(--discipline-law)',
};

export const DISCIPLINE_ICONS: Record<string, string> = {
  'Accounting': '📊',
  'Markets & Economies': '🌐',
  'Finance': '💰',
  'Strategy': '♟️',
  'Leading Organizations': '👥',
  'Data & Decisions': '📈',
  'Marketing & Pricing': '🎯',
  'Supply Chain & Operations': '⚙️',
  'US Business Law': '⚖️',
  'Business Communications': '💬',
  'Entrepreneurship': '🚀',
  'Entrepreneurial Finance': '💡',
  'Blockchain': '🔗',
  'AI for Business': '🤖',
  'Managing Software Development': '💻',
  'Statistical Analysis': '📐',
  'Advanced Finance': '📉',
  'Advanced Marketing': '📣',
  'Advanced Corporate-Level Strategy': '🏰',
  'Advanced Statistical Inference': '🔬',
  'Strategic Leadership': '🎖️',
  'English Business Law': '🏛️',
};

export const CORE_DISCIPLINES = [
  'Accounting',
  'Markets & Economies',
  'Finance',
  'Strategy',
  'Leading Organizations',
  'Data & Decisions',
  'Marketing & Pricing',
  'Supply Chain & Operations',
];

export const SPECIALIZATION_DISCIPLINES = [
  'US Business Law',
  'Business Communications',
  'Entrepreneurship',
  'Entrepreneurial Finance',
  'Blockchain',
  'AI for Business',
  'Managing Software Development',
  'Statistical Analysis',
  'Advanced Finance',
  'Advanced Marketing',
  'Advanced Corporate-Level Strategy',
  'Advanced Statistical Inference',
  'Strategic Leadership',
  'English Business Law',
];

/* ──────────────────────────────────────────────────────────────────────────
 * WealthBridge Library — Exam / Learning Track Schema
 *
 * The Knowledge Explorer is also a multi-track exam-prep workbench.  Each
 * track is a complete study manual (e.g. CFP, SIE, Series 7, Life & Health)
 * sourced from WealthBridgeLibraryv11_QA.zip and shaped by
 * scripts/build_tracks_data.py into client/src/data/tracks_data.json.
 * ──────────────────────────────────────────────────────────────────────── */

export type TrackCategory = 'securities' | 'planning' | 'insurance';

export interface TrackTable {
  rows: string[][];
}

export interface TrackSubsection {
  id: string;
  title: string;
  level: 2 | 3;
  paragraphs: string[];
  tables: TrackTable[];
  is_question?: boolean;
}

export interface TrackChapter {
  id: string;
  title: string;
  intro: string;
  subsections: TrackSubsection[];
  tables?: TrackTable[];
  is_practice: boolean;
}

export interface TrackPracticeQuestion {
  number: number;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface TrackFlashcard {
  id: number;
  term: string;
  definition: string;
  source: string;
  chapter: string;
}

export interface TrackCounts {
  chapters: number;
  subsections: number;
  practice_questions: number;
  flashcards: number;
}

export interface ExamTrack {
  key: string;
  name: string;
  category: TrackCategory;
  title: string;
  subtitle: string;
  chapters: TrackChapter[];
  practice_questions: TrackPracticeQuestion[];
  exam_overview: string[][];
  flashcards: TrackFlashcard[];
  counts: TrackCounts;
}

export interface TrackCategoryMeta {
  label: string;
  desc: string;
  color: string;
  icon: string;
}

export interface TracksDataset {
  schema_version: number;
  generated_from: string;
  categories: Record<TrackCategory, TrackCategoryMeta>;
  tracks: ExamTrack[];
  reference: {
    tax_reference_markdown: string;
  };
  master_manual: {
    sections_count: number;
    word_count: number;
    sections: { title: string; paragraphs: string[] }[];
  };
  stats: {
    total_tracks: number;
    total_chapters: number;
    total_practice_questions: number;
    total_flashcards: number;
  };
}

/* Display metadata for each track — colors mirror the manual cover styling. */
export const TRACK_META: Record<
  string,
  { color: string; tagline: string; emoji: string }
> = {
  sie: {
    color: '#1B4F72',
    tagline: 'FINRA foundational securities exam',
    emoji: '📜',
  },
  series7: {
    color: '#2E86AB',
    tagline: 'General Securities Representative — full registration',
    emoji: '📈',
  },
  series66: {
    color: '#5D3FD3',
    tagline: 'Uniform Combined State Law — RIA + agent in one',
    emoji: '⚖️',
  },
  cfp: {
    color: '#0E6655',
    tagline: 'Capstone fiduciary planning credential',
    emoji: '🏛️',
  },
  financial_planning: {
    color: '#117864',
    tagline: 'Personal financial planning fundamentals',
    emoji: '💼',
  },
  investment_advisory: {
    color: '#6C3483',
    tagline: 'Advisory practice, fiduciary duty, ADV',
    emoji: '🎯',
  },
  estate_planning: {
    color: '#7D3C98',
    tagline: 'Trusts, gifting, generational transfer',
    emoji: '🏰',
  },
  premium_financing: {
    color: '#B7950B',
    tagline: 'Leveraged life insurance design + risk',
    emoji: '🏦',
  },
  life_health: {
    color: '#922B21',
    tagline: 'Life, health, annuity, LTC product mastery',
    emoji: '❤️',
  },
  general_insurance: {
    color: '#C0392B',
    tagline: 'Foundational P&C and casualty principles',
    emoji: '🛡️',
  },
  p_and_c: {
    color: '#D35400',
    tagline: 'Property + casualty deep-dive license track',
    emoji: '🏠',
  },
  surplus_lines: {
    color: '#A04000',
    tagline: 'Excess + non-admitted broker authority',
    emoji: '🌊',
  },
};

export function trackHref(key: string): string {
  return `/track/${key}`;
}

export function trackQuizHref(key: string): string {
  return `/track/${key}/quiz`;
}

export function trackFlashcardsHref(key: string): string {
  return `/track/${key}/flashcards`;
}
