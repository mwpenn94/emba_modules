# Project TODO

## Core Features (Previous)
- [x] Dashboard with discipline grid and mastery progress
- [x] Discipline pages with definitions, formulas, FS applications
- [x] Exam Simulator with 220 questions, timed modes, adaptive difficulty
- [x] Formula Calculator Lab with 6 interactive calculators
- [x] Case Study Simulator with branching decisions
- [x] Connection Map with interactive concept graph
- [x] FS Practice Toolkit with 6 professional tools
- [x] Universal Search across all content
- [x] Quick Quiz flashcard review
- [x] Formula Reference page
- [x] Connections listing page
- [x] Cases library page

## Recursive Optimization Pass 1 (Depth)
- [x] Spaced repetition system (SRS) with confidence-based intervals
- [x] Study Session page with flashcard study mode
- [x] Achievements page with trophy gallery and daily goals
- [x] AchievementToast with particle effect celebrations
- [x] Keyboard navigation across all interactive modules
- [x] MasteryContext with localStorage persistence

## Recursive Optimization Pass 2 (Landscape)
- [x] Skip-to-content link for keyboard users
- [x] Reduced motion media query
- [x] ARIA labels on navigation, search, result lists
- [x] Enhanced focus-visible ring
- [x] Keyboard shortcuts on QuizPage and ExamSimulator
- [x] Screen-reader-only utility class

## Recursive Optimization Pass 3 (Adversarial)
- [x] localStorage quota error handling
- [x] Divide-by-zero guards in all calculators
- [x] Input clamping in FSToolkit
- [x] Visibility-aware study timer
- [x] Empty states across all modules

## New Features (Current Sprint)
- [x] Edge TTS backend with 322 neural voices (server/tts.ts)
- [x] useTTS hook with Edge TTS + Web Speech API fallback
- [x] AudioPlayer component with voice selection, speed controls, queue playback
- [x] Progress Export page with CSV and formatted report download
- [x] Discipline Deep Dive page with tabbed learning (Definitions, Formulas, Cases, FS)
- [x] Personalized learning sequences (General, Personalized, Weak-First, Due Review)
- [x] Full-stack upgrade (tRPC, database, auth)
- [x] Navigation links for Progress Export and Deep Dive

## Recursive Optimization Pass 4 (Polish)
- [x] Add keyboard navigation to DisciplineDeepDive (Space/Enter reveal, arrows navigate, 1-5 rate)
- [x] Add AudioPlayer integration to more pages (Home dashboard links, FormulasPage)
- [x] Micro-celebrations on mastery milestones in Deep Dive (mastered badge + star animation)
- [x] Loading skeleton states for TTS voice loading (built into useTTS hook)
- [x] Vitest tests for TTS endpoint (7 tests passing)

## Recursive Optimization Pass 5 (Convergence)
- [x] Performance audit (lazy loading via React.lazy + Suspense for all 16 routes)
- [x] Final accessibility review (ARIA, focus-visible, skip-to-content, reduced-motion, print styles)
- [x] Edge case testing for TTS with long text (auto-chunking at 4500 chars with sentence-boundary splitting)
- [x] Mobile responsiveness polish (touch targets, compact padding, print styles)
