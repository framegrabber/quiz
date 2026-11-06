# Tasks: Quiz v1

Spec: [`SPEC.md`](../SPEC.md) · Plan: [`plan.md`](plan.md). Standard gate for every task: `npm run typecheck && npm test` pass; `npm run build` succeeds once T1 is done. **UI gate for every UI task:** component tests include a keyboard-only flow and pass axe; uses tokens only; checked in light and dark mode; the screen's states from SPEC "Screens" are implemented, not deferred.

---

## Phase 1: Foundation and risk spikes

## T1: Scaffold the app project
**Description:** Create the Vite + Preact + TypeScript project with the tooling from the spec, so later tasks only add code.

**Acceptance criteria:**
- [ ] `package.json` scripts exist exactly as listed in SPEC "Commands" (`schema`/`validate` may point to scripts created in T6)
- [ ] `tsconfig.json`: `strict`, `erasableSyntaxOnly`, `allowImportingTsExtensions`, `noEmit`, JSX for Preact; `vite.config.ts` with `base: '/quiz/'`
- [ ] `index.html` with `lang="de"` and `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`; app renders a placeholder screen

**Verification:**
- [ ] `npm run dev` serves `http://localhost:5180/quiz/` (dedicated port; 5173 is used by other local projects)
- [ ] `npm run build` produces `dist/`; `npm test` runs Vitest with happy-dom (passes with no tests); `axe-core` installed with a `expectNoAxeViolations(container)` test helper

**Dependencies:** None
**Files likely touched:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/test/axe.ts`, `.prettierrc`, `.gitignore`
**Estimated scope:** M

## T2: Create repos and Pages deployment
**Description:** Create `framegrabber/quiz` and `framegrabber/quiz-content` (after your confirmation), deploy the app on push to `main`, and serve `quiz-content` via Pages. Proves hosting and same-origin loading before features exist.

**Acceptance criteria:**
- [ ] `.github/workflows/deploy.yml` builds and deploys with `actions/deploy-pages` on push to `main`
- [ ] `https://framegrabber.github.io/quiz/` serves the placeholder app
- [ ] `quiz-content` has a placeholder `test.json` served at `https://framegrabber.github.io/quiz-content/test.json`, and `fetch()` of it from the app origin succeeds

**Verification:**
- [ ] Actions run green in both repos
- [ ] Manual: open the app URL; run the fetch in the browser console

**Dependencies:** T1
**Files likely touched:** `.github/workflows/deploy.yml`; in `quiz-content`: `README.md`, `test.json`
**Estimated scope:** S

## T3a: Design contract and tokens
**Description:** Decide the visual system before any screen is built, so every later task uses the same tokens and patterns.

**Acceptance criteria:**
- [ ] `docs/design.md`: per screen (Start, Overview, Round, Result, Error) its job, primary action, required states (from SPEC "Screens"), responsive rules (iPhone SE → 1440 px, ~40 rem column), and rejected patterns
- [ ] `src/styles/tokens.css`: semantic color tokens for light and dark (`prefers-color-scheme`), spacing scale, radii, type scale, focus ring; system font stack; all text/background pairs ≥ 4.5:1 (large text, UI boundaries ≥ 3:1) with the ratios listed in `docs/design.md`
- [ ] `src/styles/base.css`: element defaults (buttons, inputs ≥ 16 px, focus-visible, `touch-action: manipulation`, `overflow-wrap`, reduced motion); SVG icons for correct/incorrect

**Verification:**
- [ ] Static token preview page in dev (removed in T9) showing all tokens, buttons, inputs, and feedback states in light and dark mode; screenshots reviewed by Felix

**Dependencies:** T1
**Files likely touched:** `docs/design.md`, `src/styles/tokens.css`, `src/styles/base.css`, `src/ui/icons.tsx`
**Estimated scope:** M

## T3: iPhone round layout shell
**Description:** Build the real round layout (header · content · action bar) sized to the visual viewport, and prove on the iOS Simulator that the keyboard never hides the input or the action bar and stays open across consecutive typed questions. Decides the focus mechanism the question-type contract relies on.

**Acceptance criteria:**
- [ ] `useVisualViewport` sets `--app-height` from `visualViewport.height` (on `resize` and `scroll`), with `100dvh` fallback; safe-area padding; content column max ~40 rem, centered, header and action bar aligned to it
- [ ] `RoundLayout` renders header ≤ 44 px, a scrollable content area, and an action bar whose buttons `preventDefault` on `mousedown`
- [ ] Demo screen (temporary, replaced in T9) with realistic possessives content tests both mechanisms: (a) one input element reused across two questions, (b) a different input element focused after the next question renders. The working mechanism is recorded in `docs/design.md` and becomes the T9 contract

**Verification:**
- [ ] iOS Simulator, iPhone SE 3rd gen + iPhone 17 + one iPad, software keyboard on, light and dark: prompt, input, action bar visible with keyboard open; keyboard stays open between questions; no zoom on focus; screenshots saved
- [ ] `npm run build` succeeds

**Dependencies:** T3a
**Files likely touched:** `src/ui/useVisualViewport.ts`, `src/ui/RoundLayout.tsx`, `src/styles/base.css`, `src/main.tsx`, `docs/design.md`
**Estimated scope:** M

## T4: Answer normalization and cloze parser
**Description:** Pure functions every check depends on.

**Acceptance criteria:**
- [ ] `normalize(s, { caseSensitive })` implements SPEC "Answer normalization" exactly (NFC, apostrophe variants → `'`, whitespace, case)
- [ ] `parseCloze(text)` returns text segments and gaps with alternatives; supports `\{ \}` escapes; reports malformed input (unclosed brace, empty alternative, no gap) as errors with positions

**Verification:**
- [ ] Unit tests: `It’s` ≡ `it's`, `its` ≠ `it's`, case-sensitive mode, whitespace collapse; cloze cases for alternatives, escapes, each malformed input

**Dependencies:** T1
**Files likely touched:** `src/engine/normalize.ts`, `src/engine/normalize.test.ts`, `src/question-types/cloze/parse.ts`, `src/question-types/cloze/parse.test.ts`
**Estimated scope:** S

### Checkpoint A: Foundation
- [ ] typecheck, tests, build pass
- [ ] Pages deploy works for both repos
- [ ] Layout shell verified in the Simulator with keyboard open (iPhone SE, iPad); focus mechanism decided
- [ ] Design tokens and preview reviewed by Felix (light + dark)
- [ ] Review with Felix

---

## Phase 2: Format contract

## T5a: Format document schema with `choice`
**Description:** The document-level Zod schema, cross-field rules, German error formatting, question ids, and the first type (`choice`). `definitions.ts` (schema + check, no Preact) is the single list of types.

**Acceptance criteria:**
- [ ] `parseQuiz(json)` returns `{ ok: true, quiz }` or `{ ok: false, errors: { path, message }[] }` for all document rules in SPEC "Validation rules" (strict objects, `schema` version, category refs, every category has ≥ 1 question, unique ids) and the `choice` rules (answer ∈ options, unique options, 2–8 options)
- [ ] `checkChoice` (single, multi set equality) returns `CheckResult`
- [ ] `questionId(q)` returns `id` or `h:` + FNV-1a of canonical JSON without `id`

**Verification:**
- [ ] Unit tests with fixtures in `src/format/fixtures/`: a valid choice-only quiz; one invalid fixture per rule asserting the error path
- [ ] Hash stable across key order, changes when content changes
- [ ] Gzip size of a build importing the format module recorded (budget check for Zod)

**Dependencies:** T4
**Files likely touched:** `src/format/schema.ts`, `src/format/parse.ts` (+ test), `src/format/questionId.ts` (+ test), `src/question-types/definitions.ts`, `src/question-types/choice/{schema,check}.ts` (+ test), fixtures
**Estimated scope:** M

## T5b: `input` and `cloze` schemas and checks
**Description:** Add the two remaining v1 types to `definitions.ts`.

**Acceptance criteria:**
- [ ] `input` schema (`answer`, `accept`, `caseSensitive`) and `checkInput` using `normalize`
- [ ] `cloze` schema with validation via `parseCloze` (errors reported at `questions[i].text`), `mode`, `distractors`; `checkCloze` returns per-gap results in `parts`
- [ ] A valid fixture quiz uses all three types

**Verification:**
- [ ] Unit tests: accept list, case sensitivity, smart apostrophe; cloze per-gap correctness with alternatives; invalid fixtures for malformed cloze text

**Dependencies:** T5a
**Files likely touched:** `src/question-types/input/{schema,check}.ts` (+ test), `src/question-types/cloze/{schema,check}.ts` (+ test), `src/question-types/definitions.ts`, fixtures
**Estimated scope:** M

## T6: Validator CLI, generated JSON Schema, authoring docs
**Description:** Make the contract usable for authoring: CLI validator with mobile-fit warnings, generated JSON Schema, and the authoring reference.

**Acceptance criteria:**
- [ ] `npm run validate -- <file|dir|url>...` prints all errors per file as `file: path: message`, exits 1 on any invalid file, 0 otherwise; prints mobile-fit warnings without failing
- [ ] `npm run schema` writes `public/schema/quiz.v1.json` (strict, `additionalProperties: false`); `npm run build` runs it
- [ ] `docs/quiz-format.md` documents every field and type with examples, the validation rules, the fit limits, and an "Authoring with AI" section (prompt template + validate loop)

**Verification:**
- [ ] CLI run on valid and invalid fixtures shows expected exit codes and messages
- [ ] VS Code autocompletes a quiz file using `$schema`

**Dependencies:** T5b
**Files likely touched:** `scripts/validate.ts`, `scripts/schema.ts`, `src/format/fitWarnings.ts` (+ test), `docs/quiz-format.md`, `package.json`
**Estimated scope:** M

## T7: Possessive determiners quiz and content CI
**Description:** First real quiz in `quiz-content`, validated in CI.

**Acceptance criteria:**
- [ ] `englisch/green-line-1/possessive-determiners.json`: ≥ 40 questions, all with ids; covers my, your, his, her, its, our, their; uses `choice`, `input`, `cloze`; explanations for his/her, its/it's, your sg./pl.; own sentences; no fit warnings
- [ ] `quiz-content` CI checks out `framegrabber/quiz`, runs `npm ci` and `npm run validate -- <content dir>`; fails on invalid files
- [ ] `test.json` placeholder removed

**Verification:**
- [ ] Local validate passes; CI green; a deliberately broken commit on a branch fails CI
- [ ] Felix reviews the content

**Dependencies:** T2, T6
**Files likely touched (quiz-content):** `englisch/green-line-1/possessive-determiners.json`, `.github/workflows/validate.yml`, `.github/workflows/pages.yml`, `README.md`
**Estimated scope:** M

### Checkpoint B: Contract
- [ ] Possessives quiz valid locally and in CI
- [ ] `docs/quiz-format.md` reviewed by Felix

---

## Phase 3: Playable slices

## T8: Loading, hash params, error screens
**Description:** From a `#src=` link to a validated quiz on a minimal Overview, with all failure modes shown in German.

**Acceptance criteria:**
- [ ] `parseHash` reads `src`, `cat`, `n` per SPEC (https only, localhost in dev; invalid values reported)
- [ ] `loadQuiz(src)` uses `cache: "no-cache"` and a 15 s timeout; distinct results for HTTP error, network error/timeout, invalid JSON, invalid quiz
- [ ] Error screen lists the first 10 validation errors plus a count, with "Erneut versuchen" and "Zur Startseite"; while loading, the Overview shows a placeholder of its final structure (no spinner, no layout shift); Overview shows title, subject/source, and "Starten"

**Verification:**
- [ ] Unit tests for `parseHash` and `loadQuiz` (mocked `fetch`) per failure kind
- [ ] Manual: dev server with valid fixture, 404 URL, non-JSON URL, invalid fixture, throttled network (placeholder visible, no layout shift)
- [ ] Component tests with axe: loading placeholder, each error kind

**Dependencies:** T5b
**Files likely touched:** `src/app/hash.ts`, `src/app/load.ts` (+ tests), `src/app/App.tsx`, `src/app/ErrorScreen.tsx` (+ test), `src/app/Overview.tsx` (+ test)
**Estimated scope:** M

## T9: Round with `choice` and result screen
**Description:** First vertical slice of play: Start → round of N `choice` questions in `RoundLayout` → result screen. Replaces the T3 demo and the T3a token preview. Fixes the question-type UI contract for all later types.

**Acceptance criteria:**
- [ ] `QuestionProps`/`QuestionType` implemented as in SPEC "Code Style" with the focus mechanism decided in T3; the Round screen alone owns action bar, scoring, and focus; Round lives in `src/app/round/` with no file over ~200 lines
- [ ] Single choice submits on tap; multi choice toggles (selected state exposed via `aria-pressed`) and submits via "Antwort abgeben"; options shuffled per presentation
- [ ] Feedback in the action bar (SVG icon + Richtig/Falsch + solution), explanation in content area, `aria-live="polite"` announcement; focus to "Weiter", then to the next question
- [ ] Starting a round pushes a history entry; back/swipe-back during the round or on the result screen returns to the Overview
- [ ] Result screen: x/N richtig, list of wrong questions with solutions, distinct perfect-round message, "Neue Runde", "Zur Übersicht" (round = first N questions shuffled until T12)

**Verification:**
- [ ] Component tests with axe: keyboard-only round of single and multi choice through to the result screen; perfect round; back navigation returns to the Overview
- [ ] Simulator (SE, light + dark): 4-option choice within fit limits needs no scrolling; swipe-back returns to the Overview

**Dependencies:** T3, T8
**Files likely touched:** `src/question-types/registry.ts`, `src/question-types/choice/Choice.tsx` (+ test), `src/app/round/Round.tsx`, `src/app/round/ActionBar.tsx`, `src/app/Result.tsx` (+ test)
**Estimated scope:** M

## T10: `input` question type
**Description:** Typed answers with the keyboard behavior proven in T3.

**Acceptance criteria:**
- [ ] Input attributes per SPEC (`autocapitalize`, `autocorrect`, `autocomplete`, `spellcheck`, `enterkeyhint="done"`, ≥ 16 px); empty submit disabled
- [ ] Return submits, Return again continues; consecutive `input` questions keep the keyboard open using the T3 mechanism; when the next question isn't typed, the input blurs
- [ ] `___` in the prompt renders as a visual blank; the input has an accessible label

**Verification:**
- [ ] Component test with axe: keyboard-only flow over two consecutive input questions, focus stays in a text field throughout
- [ ] Simulator (SE + 17): keyboard open shows prompt, input, action bar; smart apostrophe answer accepted

**Dependencies:** T9
**Files likely touched:** `src/question-types/input/Input.tsx` (+ test), `src/question-types/registry.ts`, `src/app/round/Round.tsx`
**Estimated scope:** M

## T11: `cloze` question type
**Description:** Gap texts in bank mode (tap to place) and type mode (inline inputs).

**Acceptance criteria:**
- [ ] Bank mode: bank = first alternative per gap + distractors, shuffled; tap word fills the selected or first empty gap; tap filled gap returns the word; submit when all filled. Gaps are buttons labeled "Lücke k von n: leer/<word>", selected gap `aria-pressed`
- [ ] Type mode: inline inputs; Return moves to the next gap (`enterkeyhint="next"`), submits on the last; focused gap scrolled into view; keyboard stays open across `input` ↔ type-mode cloze transitions
- [ ] Feedback marks each gap correct/incorrect with icon + text, not color alone

**Verification:**
- [ ] Component tests with axe: keyboard-only bank flow and type flow; input → type-cloze transition keeps focus in a text field
- [ ] Simulator (SE + iPad, light + dark): bank cloze within fit limits needs no scrolling; type mode with keyboard open keeps the focused gap and action bar visible

**Dependencies:** T9
**Files likely touched:** `src/question-types/cloze/Cloze.tsx`, `src/question-types/cloze/WordBank.tsx` (+ tests), `src/question-types/registry.ts`, `src/styles/base.css`
**Estimated scope:** M

### Checkpoint C: Playable
- [ ] Possessives quiz fully playable from a `#src=` link (local dev pointing at the Pages URL)
- [ ] Simulator screenshots per type, keyboard open/closed, light and dark
- [ ] Review with Felix

---

## Phase 4: Progress and entry points

## T12: Storage, mastery, and round selection
**Description:** Persist per-question progress and use it to pick rounds and show mastery.

**Acceptance criteria:**
- [ ] `storage/` reads/writes `quiz:v1:progress:<url>` per SPEC; corrupt entries reset with a console warning; `navigator.storage.persist()` requested once; when writes throw, a persistent "Fortschritt wird nicht gespeichert" banner appears and play continues
- [ ] Mastery transitions (box 0–3) and `selectRound(pool, progress, n, rng)` per SPEC (box asc, least recently seen, fill-up with mastered, "Alle")
- [ ] Round records every answer; Overview shows "x/y gemeistert" per category and total, and "Alles gemeistert" (Start stays available) when the selection is fully mastered

**Verification:**
- [ ] Unit tests: transitions, selection ordering and fill-up with seeded RNG, storage corrupt-value and write-failure handling (happy-dom `localStorage`)
- [ ] Component tests with axe: all-mastered Overview, storage-unavailable banner
- [ ] Manual: three rounds answering a question correctly marks it mastered; reload keeps it

**Dependencies:** T9
**Files likely touched:** `src/storage/progress.ts` (+ test), `src/engine/mastery.ts`, `src/engine/selectRound.ts` (+ tests), `src/app/round/Round.tsx`, `src/app/Overview.tsx`
**Estimated scope:** M

## T13: Start screen with recent sources
**Description:** Entry point without a link: paste a quiz URL, reopen recent quizzes.

**Acceptance criteria:**
- [ ] Start screen: URL input ("Quiz-Link einfügen", labeled) navigates to `#src=…`; invalid URL shows an inline error
- [ ] First visit (no sources): explanation of what the app does and where links come from, URL input focused
- [ ] Successful loads update `quiz:v1:sources` (most recent first, max 20, title, lastUsed); list shows title, last used, mastered x/y; long titles/URLs wrap without overflow at 320 px
- [ ] Entries can be removed (with confirmation)

**Verification:**
- [ ] Unit tests for the sources list (ordering, cap, dedupe by URL, corrupt value); component tests with axe for first-visit and populated states
- [ ] Manual: open two quizzes, both listed in order; remove one

**Dependencies:** T12
**Files likely touched:** `src/storage/sources.ts` (+ test), `src/app/Start.tsx` (+ test), `src/app/App.tsx`
**Estimated scope:** M

## T14: Overview controls and share link
**Description:** Category filter and round size as URL state, and sharing the current URL.

**Acceptance criteria:**
- [ ] Category selection ("Alle" or one or more) and round size picker (5/10/20/Alle) drive the next round and rewrite the hash via `history.replaceState`; the last round size is saved per source
- [ ] Initial values follow SPEC precedence (`n` > last choice for source > `roundSize` > 10; `cat` preselects, unknown ids → notice + all)
- [ ] "Link teilen" shares `location.href`: Web Share API if available, else clipboard with confirmation; clipboard blocked → selectable link field

**Verification:**
- [ ] Unit tests for precedence and hash rewriting
- [ ] Component tests with axe: controls, clipboard-blocked fallback
- [ ] Manual: open a shared link with `cat` and `n`; values preselected and changeable; URL follows changes without adding history entries

**Dependencies:** T12
**Files likely touched:** `src/app/Overview.tsx`, `src/app/roundSettings.ts` (+ test), `src/app/share.ts`, `src/storage/sources.ts`
**Estimated scope:** M

## T15: Progress export and import
**Description:** Move progress between browsers or into a home-screen app.

**Acceptance criteria:**
- [ ] Export downloads `quiz-fortschritt-YYYY-MM-DD.json` with all `quiz:v1:*` entries and `exportVersion: 1`
- [ ] Import validates the file, asks "Vorhandenen Fortschritt ersetzen?", replaces on confirm; invalid files show an error and change nothing

**Verification:**
- [ ] Unit test: export → clear → import round trip restores identical storage; invalid file leaves storage untouched
- [ ] Manual: export in one browser profile, import in another, mastery counts match

**Dependencies:** T13
**Files likely touched:** `src/storage/backup.ts` (+ test), `src/app/Start.tsx`
**Estimated scope:** S

### Checkpoint D: Feature complete
- [x] Spec success criteria 2, 5–9, 17, 18 met
- [x] Review with Felix

---

## Phase 4b: Statistics (added on request)

## T15b: Activity log, per-quiz and overall statistics, "Fehler üben"
**Description:** SPEC "Statistics": accuracy, rounds, answers, most-missed questions with a practice round per quiz; streak, last 7 days, and totals on the start screen.

**Acceptance criteria:**
- [ ] `quiz:v1:activity` (per local day: answers, correct, rounds; > 60 days dropped) and `quiz:v1:rounds:<url>` written on answer / round end; included in export/import validation
- [ ] Pure stats functions: accuracy overall and per category, most-missed (≤ 5, not mastered, wrong desc), streak (ending today or yesterday), last 7 days series
- [ ] Overview "Statistik" section for the current selection with "Fehler üben" (hidden without missed questions); Start "Deine Statistik" section once there is activity, with an accessible 7-day bar chart

**Verification:**
- [ ] Unit tests for the stats functions (boundaries: no answers, streak gaps, day rollover, pruning)
- [ ] Component tests with axe: overview stats + Fehler üben round; start screen stats; backup round trip includes activity
- [ ] Simulator (SE, light + dark): overview and start screen with stats

**Dependencies:** T12–T15
**Files likely touched:** `src/storage/activity.ts`, `src/engine/stats.ts` (+ tests), `src/app/QuizStats.tsx`, `src/app/OverallStats.tsx`, `src/app/QuizScreen.tsx`, `src/storage/backup.ts`
**Estimated scope:** M

---

## Phase 5: Release

## T16: Home-screen icon and manifest, final accessibility and responsive check, bundle budget
**Description:** Finish cross-cutting requirements. Accessibility and states are built per task; this is the final sweep, not where they get done.

**Acceptance criteria:**
- [ ] Icon "Lernkarten-Stapel" (`public/icons/icon.svg` → PNG 180/192/512/512-maskable via `npm run icons`), `manifest.webmanifest` with name/short_name "Lernquiz", `apple-touch-icon`, `apple-mobile-web-app-title`; starts standalone from the home screen
- [ ] Every screen checked at 320/768/1024/1440 px, light and dark; contrast ratios from `docs/design.md` hold on real screens; VoiceOver (macOS Safari) completes one round per type
- [ ] Production JS ≤ 60 KB gzip (switch to `zod/mini` if over)

**Verification:**
- [ ] Build output size; component tests (incl. axe) green
- [ ] Simulator: add to home screen, launch, play a round

**Dependencies:** T10, T11, T14, T15
**Files likely touched:** `public/manifest.webmanifest`, `public/icons/*`, `index.html`, `src/styles/base.css`
**Estimated scope:** S

## T17: Release verification
**Description:** Prove the spec's success criteria against the deployed app.

**Acceptance criteria:**
- [ ] Simulator screenshots (SE 3rd gen, iPhone 17, iPad; light and dark) for every question type, keyboard closed and open, against the deployed URL
- [ ] Real iPhone: success criterion 1 URL works end to end, smart apostrophe accepted
- [ ] All 18 spec success criteria checked off; `docs/ideas/quiz-app.md`, `SPEC.md`, and `docs/design.md` updated where implementation deviated

**Verification:**
- [ ] Checklist in this file completed with evidence (screenshots, CI links)

**Dependencies:** T7, T16
**Files likely touched:** `SPEC.md`, `tasks/todo.md`
**Estimated scope:** S

### Checkpoint E: Complete
- [ ] All spec success criteria met
- [ ] Ready to share with the class
