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
