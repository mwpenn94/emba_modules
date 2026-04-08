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

## Custom Study Playlists
- [x] Database schema: playlists and playlist_items tables
- [x] tRPC procedures: CRUD, add/remove/reorder items, public discovery
- [x] Playlists page with create, browse, study mode, and item management
- [x] AddItemModal with type tabs, search, and playlist selector
- [x] Study mode with flashcard-style reveal, progress bar, navigation
- [x] Public/private toggle and sharing support
- [x] Navigation link in sidebar and route in App.tsx

## Pomodoro Timer
- [x] PomodoroTimer floating widget with SVG progress ring
- [x] Configurable focus/break intervals (25/5 default, custom 1-60 min)
- [x] Web Audio API chimes for session transitions
- [x] Session counter and total focus time tracking
- [x] Auto-break and streak tracking via MasteryContext
- [x] Minimize/expand toggle, keyboard shortcut (P), fixed bottom-right position

## Dark/Light Theme Toggle
- [x] Added .dark CSS class with warm charcoal dark theme variables
- [x] Converted :root to warm cream light theme with adjusted discipline colors
- [x] Enabled switchable prop on ThemeProvider in App.tsx
- [x] Sun/Moon toggle button in sidebar footer (desktop) and mobile header
- [x] Persisted in localStorage via ThemeContext

## Role-Based Access Levels
- [x] Extend user roles: admin, advisor, user (schema already has admin/user enum)
- [x] Add 'advisor' to role enum in drizzle schema
- [x] Create adminProcedure and advisorProcedure middleware in tRPC
- [x] Admin dashboard page with user management (view, change roles, deactivate)
- [x] Visibility controls: FS Toolkit only for advisor+ roles, admin dashboard for admin only
- [x] Role-based sidebar navigation (hide restricted modules from unauthorized users)
- [x] Navigation link for admin dashboard (admin only)

## Shareable Playlist Links
- [x] Add shareToken (unique UUID) column to playlists table
- [x] Create playlist_shares table (playlistId, sharedWithUserId, permission: view/edit, grantedBy, createdAt)
- [x] Public share URL: /shared/playlist/:shareToken (no auth required for viewing)
- [x] Owner CRUD over shared access: grant/revoke/change permissions for shared users
- [x] Share management UI in playlist detail view
- [x] Copy shareable link button with toast confirmation
- [x] Shared-with-me section in Playlists page

## Continuous Self-Discovery Mode
- [x] SelfDiscovery component that triggers after user inactivity (configurable timeout)
- [x] Uses last studied topic as context for LLM-generated deeper follow-up question
- [x] Toggle in settings to enable/disable continuous loop
- [x] Configurable occurrence limit (default: 1, option for continuous)
- [x] Subtle notification card that slides in with the follow-up question
- [x] Links to relevant study content based on the generated question

## Promote Owner to Admin
- [x] Set owner user role to 'admin' via SQL using OWNER_OPEN_ID

## Email-Based Share Invites
- [x] Add invite-by-email tRPC procedure (owner sends email, creates pending share)
- [x] Email invite UI in playlist share panel (input field + send button)
- [x] Auto-grant access when invited user signs in (match by email)
- [x] Show pending invites in share management panel
- [x] Revoke pending invites

## Self-Discovery History Log
- [x] Create discovery_history table (userId, topic, discipline, question, hint, relatedTopics, difficulty, createdAt)
- [x] Save generated follow-up questions to database on generation
- [x] Discovery History page with timeline view of past questions
- [x] Delete individual entries and clear all history
- [x] Link from SelfDiscovery card to history page
- [x] Navigation sidebar link to Discovery Log

## WealthBridge Exam & Learning Tracks (12 licenses)
Sourced from `WealthBridgeLibraryv11_QA.zip` (DOCX manuals + flashcards) and the
EMBA master manual. The pipeline (`scripts/build_tracks_data.py`) parses the raw
documents into `client/src/data/tracks_data.json` (12 tracks · 68 chapters ·
187 subsections · 104 practice questions · 593 flashcards · ~60K words).

### Pipeline
- [x] Pure-stdlib DOCX parser (`zipfile` + `xml.etree`) — no extra deps
- [x] Heading1/2/3 + table-aware body walker
- [x] Practice exam extractor (numbered headings + glued A/B/C/D options + MASTERY CHECK answer in cell)
- [x] Position-based option splitter (handles "investment adviceB)" run-ons)
- [x] Single-cell callout flattening (SCENARIO / EXAM TIP / COMMON TRAP)
- [x] Auto-promoted "Appendix:" chapters when leaving practice mode
- [x] Consecutive practice Heading1 merging (SIE duplicate fix)
- [x] Empty study chapter pruning
- [x] Exam-overview fallback (Exam Overview / Exam Format / How to Use / 2-col table scan)
- [x] Master manual + verified tax reference passthrough

### Frontend
- [x] `client/src/data/types.ts`: `ExamTrack` / `TrackChapter` / `TrackPracticeQuestion` / `TrackFlashcard` types + `TRACK_META` display config
- [x] `client/src/hooks/useTracks.ts`: typed access layer with key + category lookups
- [x] `client/src/pages/TracksIndex.tsx`: category-grouped landing page with per-track progress bars + Cross-Track Reference (tax + master manual)
- [x] `client/src/pages/TrackPage.tsx`: chapter sidebar (mobile `<details>`, desktop sticky) + main reader + exam-overview rail
- [x] `client/src/pages/TrackQuiz.tsx`: shuffle-able practice exam runner with A/B/C/D keyboard shortcuts + per-answer mastery wiring + bookmark button
- [x] `client/src/pages/TrackFlashcards.tsx`: term/definition cards with chapter filter + reveal/rate flow + per-card mastery wiring + bookmark button
- [x] `client/src/App.tsx`: 4 new lazy routes (`/tracks`, `/track/:key`, `/track/:key/quiz`, `/track/:key/flashcards`)
- [x] `client/src/components/Navigation.tsx`: new "Exam Tracks" sidebar section (Library icon)
- [x] `client/src/pages/Home.tsx`: new "Exam & Learning Tracks" dashboard section
- [x] `client/src/pages/SearchPage.tsx`: indexes track sections / flashcards / practice questions with per-track caps + new filter pills
- [x] `client/src/pages/Bookmarks.tsx`: `CONTENT_TYPE_META` extended with `track_card`, `track_question`, `track_section` icons/labels
- [x] BookmarkButton wired into TrackFlashcards (top-right of card), TrackQuiz (next to answer reveal), TrackPage subsections (visible on hover)
- [x] Mastery namespacing — `track-${key}-card-${id}` and `track-${key}-q-${number}` keys piggyback on existing localStorage + cloud sync

### Tests
- [x] `server/tracks.test.ts` — 9 invariants: schema version, all 12 tracks, every track has chapters + ≥5 practice questions, every question has 4 options + valid correct index, every flashcard non-empty, no empty subsections, aggregate stats consistent, every track key URL-safe.

### Universal Holistic Optimization (9 passes, converged)
- [x] Pass 1 Landscape — callout flattening, exam-overview fallback, "Appendix:" prefixes, merged consecutive practice headings, dropped empty chapters
- [x] Pass 2 Depth — mastery wiring, per-track progress bars
- [x] Pass 3 Adversarial — caught silent regression dropping body paragraphs in SIE-style manuals (saw_h1 gate), removed phantom practice dividers, added invariant tests
- [x] Pass 4 Synthesis — verified single source of truth + cohesion across consumers
- [x] Pass 5 Polish — TrackPage chapter sidebar collapses to `<details>` on mobile
- [x] Pass 6 Convergence audit — 0 issues found, 0 actions
- [x] Pass 7 Deep sweep — bookmark integration across all 3 track pages + Bookmarks page meta
- [x] Pass 8 Convergence audit — 0 issues found, 0 actions
- [x] Pass 9 Convergence audit — 0 issues found, 0 actions (2-pass streak confirmed)
## Abstract EMBA Branding
- [x] Replace "EMBA Knowledge Explorer" with "Knowledge Explorer" in tab title (index.html)
- [x] Update manifest.json name and short_name
- [x] Update Navigation.tsx sidebar branding
- [x] Update OnboardingTour.tsx welcome text
- [x] Update Home.tsx hero section text
- [x] Update ExamSimulator.tsx header
- [x] Update FSToolkit.tsx references (embaLink → conceptLink, "EMBA Connection" → "Concept Connection")
- [x] Update server/routers.ts LLM prompts (EMBA professor → expert professor)
- [x] Update localStorage key prefixes (emba- → ke-)
- [x] Update service worker cache version and comments
- [x] Update ideas.md, screenshot-notes.md references

## Add EMBA Track & Full Content Incorporation
- [x] Audit current tracks_data.json structure (categories, tracks, content fields)
- [x] Extract and examine all files from WealthBridgeLibraryv11_QA.zip
- [x] Identify which tracks have complete content vs incomplete/missing
- [x] Add EMBA track category with master manual content (9 chapters, 81 subsections, 205 tables)
- [x] Ensure all existing tracks have full study manual content, flashcards, and practice questions (all 12 verified)
- [x] Update tracks_data.json with complete content for all tracks (13 tracks total)
- [x] Update UI category definitions and icons for EMBA track
- [x] Recursive convergence pass 1 (Landscape): 40 empty boilerplate chapters removed, test timeout fixed
- [x] Recursive convergence pass 2 (Depth): 124 single-row tables converted to paragraphs, category metadata added
- [x] Recursive convergence pass 3 (Adversarial): 0 issues — all 14 checks pass
- [x] Recursive convergence pass 4 (Synthesis): 0 issues — 2 consecutive zero-action passes confirmed, convergence reached

## Full Content Incorporation (COMPLETE Manuals + Diagrams)
- [x] Audit current tracks flashcard counts vs new flashcard files (12 tracks)
- [x] Parse all 12 COMPLETE study manuals for enriched chapter content (v4 parser handling Format A + B)
- [x] Upload 20 educational diagrams to CDN
- [x] Map diagrams to 8 tracks (SIE:6, S7:2, S66:2, CFP:2, EP:2, LH:2, PC:2, GI:2)
- [x] Replace/enrich track chapters with COMPLETE manual content (54 chapters, 256 subsections)
- [x] Normalize chapter data to match TrackChapter interface (intro, subsections, tables)
- [x] Add diagram gallery UI to TrackPage with expand/collapse
- [x] Add TrackDiagram interface to types.ts and diagrams field to ExamTrack
- [x] Recursive convergence pass 1 (Landscape): 32 issues fixed — 12 FC gaps, 20 broken PQs, 9 correct answers
- [x] Recursive convergence pass 2 (Depth): 25 issues fixed — 9 FC dupes, 4 PQ dupes, 18 diagram descriptions
- [x] Recursive convergence pass 3 (Adversarial): 6 issues fixed — PQ number sequencing
- [x] Recursive convergence pass 4 (Synthesis): 0 issues — 2 consecutive zero-issue passes confirmed, convergence reached

## Comprehensive Content Validation Audit
- [x] Inventory all source materials (COMPLETE manuals, TTS manuals, flashcard files, diagrams, zip contents)
- [x] Deep flashcard comparison: source .txt files vs tracks_data.json (card-by-card) — 593 cards matched perfectly
- [x] Deep chapter comparison: COMPLETE .docx manuals vs tracks_data.json — 54 chapters, 256 subsections, 747 paragraphs all non-empty
- [x] Deep practice question comparison: source manuals vs tracks_data.json — 218 PQs structurally valid
- [x] Diagram validation: all 20 images mapped to 8 tracks, CDN URLs valid
- [x] TTS manual integration: 12 TTS manuals parsed and integrated as tts_content (354 sections, 898 paragraphs, 436K chars)
- [x] Audio Study button + AudioPlayer panel added to TrackPage for all 12 tracks
- [x] Zip file contents validation: all files from WealthBridgeLibraryv11_QA.zip accounted for
- [x] Fix: 25 practice question explanations added (SIE:10, general_insurance:5, investment_advisory:5, surplus_lines:5)
- [x] Fix: 2 correct answer indices corrected (investment_advisory PQ#4 A→B, PQ#5 A→C)
- [x] Fix: SIE exam_overview added (was empty)
- [x] TypeScript types updated: TTSSection interface, tts_content field on ExamTrack
- [x] All 101 vitest tests passing, TypeScript compiles cleanly
- [x] Recursive convergence pass 1 (Landscape): 18 issues fixed — schema_version, category fields, SIE subtitle
- [x] Recursive convergence pass 2 (Depth/Adversarial): 0 issues — 2 consecutive zero-issue passes confirmed, convergence reached
