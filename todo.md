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

## Cloud Progress Sync
- [x] Database schema for mastery_progress, study_sessions, user_achievements, user_settings, quiz_questions tables
- [x] tRPC procedures for mastery sync, sessions, achievements, settings, and AI quiz
- [x] Migrate MasteryContext from localStorage-only to cloud-first with localStorage cache
- [x] Sync on login with server-wins merge strategy for newer timestamps
- [x] 14 vitest tests for input validation and auth protection

## AI-Powered Quiz Generation
- [x] tRPC procedure using LLM with structured JSON schema for question generation
- [x] AI Quiz page with discipline/topic selector, difficulty control, question type selector
- [x] Dynamic question types: multiple choice, fill-in-blank, scenario-based, explain-concept
- [x] Feedback loop with detailed explanations and self-assessment for non-MC types
- [x] Question caching in database for reuse
- [x] Keyboard navigation (A-D for MC, Enter/N for next)

## Hands-Free Study Mode
- [x] HandsFreeStudy page with auto-play TTS through discipline content
- [x] Audible progress cues (Web Audio API chimes: start, section transition, complete)
- [x] Auto-advance through definitions → formulas → cases → FS applications with section announcements
- [x] Transport controls: play/pause, skip forward/back, stop
- [x] Keyboard shortcuts: Space pause, arrows skip, Esc stop
- [x] Settings: voice selection, speed (0.75x-2x), engine (Edge/Browser), repeat mode
- [x] Section toggle to include/exclude content types
- [x] Navigation links in sidebar, Home dashboard, and DisciplinePage

## Branding Cleanup
- [x] Remove all Quantic references from Home.tsx hero section
- [x] Remove Quantic/WealthBridge/National Life from ExamSimulator, FormulaLab, CaseSimulator, FSToolkit, ConnectionMap
- [x] Replace all branded labels with generic FS Application terminology
- [x] Update to generic EMBA Knowledge Explorer branding

## Study Analytics Dashboard
- [x] Analytics page with study time trends (Area chart), mastery velocity (Bar chart), SRS effectiveness (Pie chart)
- [x] Session history table with discipline, duration, items studied/mastered
- [x] Summary stat cards: total study time, mastery rate, streak, items due
- [x] Uses local mastery data + cloud session data
- [x] Navigation link and Home dashboard entry

## Collaborative Study Groups
- [x] Database schema: study_groups, group_members, shared_quizzes, quiz_challenges tables
- [x] tRPC procedures for group CRUD, join via invite code, quiz sharing, challenge creation, result submission, leaderboard
- [x] Study Groups listing page with create/join functionality and invite code system
- [x] Group detail page with shared quizzes, member list, and challenge leaderboard
- [x] 12 vitest tests for auth protection and input validation
- [x] Navigation link and Home dashboard entry

## Offline Mode
- [x] Service Worker (sw.js) with cache-first for static assets, network-first for API
- [x] Content data caching via postMessage (CACHE_CONTENT_DATA, CACHE_MASTERY_DATA)
- [x] SPA fallback: navigation requests serve cached index.html when offline
- [x] useOffline hook for SW registration, offline detection, and update management
- [x] OfflineBanner component: offline indicator + update-available prompt
- [x] PWA manifest.json with standalone display mode
- [x] Apple mobile web app meta tags for iOS support

## AI-Guided Onboarding Tour
- [x] OnboardingTour component with 13-step interactive walkthrough
- [x] Highlights all key modules: Dashboard, Exam Simulator, Formula Lab, Case Simulator, Connection Map, AI Quiz, Hands-Free, Study Groups, Analytics
- [x] Recommends starting path based on learning science (Deep Dive → Formula Lab → Exam Sim → SRS)
- [x] Persists "tour completed" in localStorage, auto-starts for first-time users
- [x] Smooth card animations, progress bar, step indicators, keyboard navigation (arrows, Enter, Escape)

## Toggle-able Spaced Repetition Notifications
- [x] NotificationCenter component with bell icon and badge count
- [x] Expandable panel showing due items grouped by discipline with color-coded badges
- [x] Toggle switch to enable/disable SRS notifications (persisted in localStorage)
- [x] Dismiss individual items or all at once, auto-resets every 5 minutes
- [x] Links directly to study session for each discipline
- [x] In-app only (no email) per notification preferences

## Content Bookmarking and Notes
- [x] Database schema for bookmarks table (userId, contentType, contentId, contentTitle, discipline, note, createdAt)
- [x] tRPC procedures for bookmark CRUD (list, check, create, delete, updateNote)
- [x] BookmarkButton component on definitions, formulas, cases, and FS applications in DisciplinePage
- [x] Inline note editor with save/cancel in BookmarkButton popover
- [x] Bookmarks page with search, filter by type/discipline, and note editing
- [x] Navigation link in sidebar
- [x] 7 vitest tests for auth protection and input validation
