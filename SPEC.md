# Spec: Quiz (v1)

Source idea: [`docs/ideas/quiz-app.md`](docs/ideas/quiz-app.md). Predecessor: `geografie-quiz` (vanilla JS, data in `js/data/questions.js`).

## Objective

A static learning-quiz player on GitHub Pages. Quizzes are JSON files in a separate public repo; the app loads one via a link. A teacher or student shares the link with a class; everyone practises on their own device. No backend, no accounts: recently used sources and per-question progress live in `localStorage`.

**Users:** students at Bavarian Gymnasien (first: Englisch, Jgst. 5, Green Line 1 Bayern), shared within a class or circle of friends. **Author:** Felix, writing quiz JSON with AI help.

**Success for a student:** short rounds with a score (fun), and underneath, per-question mastery so they can see "28 / 40 gemeistert" and wrong items come back sooner.

### User stories
1. As a student, I open a shared link and land on the quiz overview without any setup.
2. As a student, I play a round of N questions, get immediate feedback with an explanation, and see my score and mistakes at the end.
3. As a student, I see per-category mastery and practise only one category if I want.
4. As a student, I return days later and the app remembers my quizzes and progress.
5. As a student, I can export my progress to a file and import it on another browser/device.
6. As a teacher/parent, I share a link that pins a category and round size.
7. As the author, I validate a quiz file locally and in CI before publishing, with precise error messages an AI can act on.

## Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Language | TypeScript 7.x, `strict` | `erasableSyntaxOnly`, explicit `.ts` import extensions so Node can run non-JSX modules directly |
| UI | Preact 11 + hooks | Chosen over Svelte: plain TSX, no extra compiler/checker, ~4 KB |
| Build/dev | Vite 8 + `@preact/preset-vite` | `base: '/quiz/'` |
| Format validation | Zod 4 | Single source for TS types, runtime validation, and generated JSON Schema (`z.toJSONSchema`) |
| Tests | Vitest 5 + happy-dom + `@testing-library/preact` + `axe-core` | axe runs in every component test |
| Formatting | Prettier | No ESLint in v1; `tsc --noEmit` is the lint gate |
| Runtime | Node 26 LTS for scripts/CI (`.nvmrc`, `engines`) | Native TypeScript type stripping for the validator CLI |
| Hosting | GitHub Pages via Actions (`actions/deploy-pages`), actions on their current majors (Node 24 runtime) | App: `https://framegrabber.github.io/quiz/` |

Content repo: `framegrabber/quiz-content`, served via Pages at `https://framegrabber.github.io/quiz-content/`. Same origin as the app, so no CORS dependency for first-party quizzes. Third-party URLs work if the host sends `Access-Control-Allow-Origin` (e.g. `raw.githubusercontent.com`).

## Commands

```
Install:   npm ci
Dev:       npm run dev                    # vite, http://localhost:5180/quiz/ (also on the LAN for devices)
Build:     npm run build                  # npm run schema && tsc --noEmit && vite build → dist/
Preview:   npm run preview                # http://localhost:5181/quiz/
Test:      npm test                       # vitest run
Watch:     npm run test:watch
Typecheck: npm run typecheck              # tsc --noEmit
Format:    npm run format                 # prettier --write .
Schema:    npm run schema                 # node scripts/schema.ts → public/schema/quiz.v1.json
Validate:  npm run validate -- <file|dir|url>...   # node scripts/validate.ts; exit 1 on any invalid file
```

## Project Structure

```
quiz/
  index.html
  SPEC.md
  src/
    main.tsx                 → mount, hash-route bootstrap
    styles/                  → tokens.css (design tokens, light + dark), base.css
    app/                     → screens (Start, Overview, Round/, Result), hash param parsing; one folder per non-trivial screen
    format/                  → quiz document schema, parse+validate, question id derivation, error formatting
    question-types/
      definitions.ts         → schema + check per type, no Preact; the format schema and the CLI use it
      registry.ts            → definitions + UI components; used by the app
      choice/                → schema.ts, check.ts, Choice.tsx (+ *.test.ts)
      input/                 → schema.ts, check.ts, Input.tsx
      cloze/                 → schema.ts, parse.ts, check.ts, Cloze.tsx
    engine/                  → answer normalization, round selection, mastery transitions (pure)
    storage/                 → localStorage access, export/import
    ui/                      → shared presentational components
  scripts/
    validate.ts              → CLI validator (imports only non-JSX modules)
    schema.ts                → writes public/schema/quiz.v1.json
  public/schema/quiz.v1.json → generated; published for editor autocompletion ($schema)
  docs/
    quiz-format.md           → authoring reference for humans and LLMs, with examples
    design.md                → design contract: screen jobs, states, tokens, responsive rules, rejected patterns
    ideas/quiz-app.md
  .github/workflows/deploy.yml
```

Tests sit next to the code (`*.test.ts(x)`). `schema.ts`/`check.ts`/`parse.ts` never import Preact, so the CLI can load them with plain Node.

## Quiz Format (the cross-repo contract)

### Document

```ts
interface QuizDocument {
  $schema?: string;              // e.g. "https://framegrabber.github.io/quiz/schema/quiz.v1.json"
  schema: 1;                     // format version; app rejects other values
  title: string;
  description?: string;
  subject?: string;              // "Englisch"
  grade?: number;                // Jahrgangsstufe 5–13
  source?: string;               // "Green Line 1 Bayern, Unit 2"
  language?: string;             // BCP 47 tag of the content, e.g. "en"; sets lang= on question text
  roundSize?: number;            // default 10, positive integer
  categories: Category[];        // ≥ 1
  questions: Question[];         // ≥ 1
}

interface Category { id: Id; name: string; description?: string }
type Id = string;                // /^[A-Za-z0-9_-]{1,64}$/

interface QuestionBase {
  id?: Id;                       // unique within the file; strongly recommended
  type: string;                  // discriminator
  category: Id;                  // must reference categories[].id
  explanation?: string;          // shown after answering, right or wrong
}
```

### Question types (v1)

```ts
interface ChoiceQuestion extends QuestionBase {
  type: "choice";
  prompt: string;
  options: string[];             // 2–8, unique
  answer: string | string[];     // every value ∈ options; array = select all correct ones
}

interface InputQuestion extends QuestionBase {
  type: "input";
  prompt: string;                // may contain "___" as a visual blank
  answer: string;                // canonical answer, shown as the solution
  accept?: string[];             // additional correct answers
  caseSensitive?: boolean;       // default false (set true e.g. for German nouns)
}

interface ClozeQuestion extends QuestionBase {
  type: "cloze";
  prompt?: string;               // instruction, e.g. "Ergänze die Begleiter."
  text: string;                  // gaps: {answer} or {answer|alt|alt}; literal braces: \{ \}
  mode?: "bank" | "type";        // default "bank" (tap words), "type" = inline inputs
  distractors?: string[];        // extra wrong words for the bank
  caseSensitive?: boolean;       // default false
}
```

Example:
```json
{
  "$schema": "https://framegrabber.github.io/quiz/schema/quiz.v1.json",
  "schema": 1,
  "title": "Possessive determiners",
  "subject": "Englisch",
  "grade": 5,
  "source": "Green Line 1 Bayern",
  "language": "en",
  "roundSize": 10,
  "categories": [{ "id": "forms", "name": "my, your, his …" }],
  "questions": [
    { "id": "pd-001", "type": "input", "category": "forms",
      "prompt": "Tom and Lisa love ___ dog.", "answer": "their" },
    { "id": "pd-002", "type": "choice", "category": "forms",
      "prompt": "The cat is playing with ___ ball.",
      "options": ["its", "it's", "his", "their"], "answer": "its",
      "explanation": "its = sein/ihr (Besitz). it's = it is." },
    { "id": "pd-003", "type": "cloze", "category": "forms",
      "text": "I like {my} bike, but {her} bike is faster.",
      "distractors": ["his", "your"] }
  ]
}
```

### Validation rules
- Unknown fields are errors (catches AI/author typos like `anwser`). `$schema` is the only extra top-level field.
- Cross-field rules: `category` references an existing id; every category has ≥ 1 question; ids unique (questions and categories separately); `answer` values ∈ `options`; `options` unique; cloze `text` has ≥ 1 gap and no empty alternatives.
- Unknown `type` → error. Adding a type within `schema: 1` is additive; the deployed app is always the latest, so no skip-unknown logic.
- Any document with `schema` ≠ 1 → error "Quiz-Format Version X wird nicht unterstützt." (Reserves room for a future library manifest as a distinct document type.)
- Error output: list of `path: message`, e.g. `questions[3].answer: "its" ist nicht in options enthalten`. CLI prints all errors; app shows the first 10 plus a count.
- Mobile-fit warnings (CLI only, exit code stays 0; limits from "Mobile layout"): `prompt` > 120 characters; `choice` with > 4 options; cloze `text` > 160 characters, > 4 gaps, or bank > 8 words.

### Question identity
`id` if present, else `h:` + FNV-1a hash (hex) of the question's canonical JSON (sorted keys, `id` excluded). Editing an id-less question resets its progress; that is accepted.

### Future assets
Any asset path added in later types (images, GeoJSON for `map`/`flag` in v2) resolves relative to the quiz file URL: `new URL(path, srcUrl)`.

## Behavior

### Routing and links
- Hash parameters: `#src=<encodeURIComponent(url)>&cat=<id>[,<id>…]&n=<positive int|all>`.
- No `src` → Start screen. With `src` → load, validate, show Overview.
- `src` must be `https:` (or `http://localhost*` in dev); anything else → error.
- `cat`/`n` set initial selections only; the student can change them. Unknown `cat` ids → notice, fall back to all categories.
- Initial round size precedence: `n` in link > student's last choice for this source > `roundSize` > 10.
- **The URL is the overview state.** Changing category or round size rewrites the hash with `history.replaceState` (no new history entry), so the current URL is always the share link.
- "Link teilen" shares `location.href`: Web Share API if available, else clipboard with a confirmation; if the clipboard is blocked, the link is shown in a selectable field.
- **History:** starting a round pushes one history entry; browser back / iOS swipe-back during a round or on the result screen returns to the Overview. A round is not addressable by URL; reloading during a round lands on the Overview.

### Loading
- `fetch(src, { cache: "no-cache" })`, 15 s timeout. HTTP error, network error, invalid JSON, and schema errors each have a distinct German message. Nothing renders from an invalid document.
- While loading, the Overview shows a placeholder layout of its final structure (no spinner, no layout shift when content arrives); error screens offer "Erneut versuchen" and "Zur Startseite".

### Screens
1. **Start:** URL input ("Quiz-Link einfügen"), recent sources (title, last used, mastered x/y), remove entry, export/import progress. **First visit (no recent sources):** short explanation of what the app does and where quiz links come from, URL input focused.
2. **Overview:** title, subject/source, categories with mastered x/y and "Alle", round size picker (5 / 10 / 20 / Alle), Start, Link teilen. **All mastered (in the selection):** "Alles gemeistert" message; Start remains available as a review round.
3. **Round:** question k/N, question UI, feedback (correct/incorrect, correct solution, explanation), "Weiter".
4. **Result:** score x/N, list of wrong questions with solutions, mastery change for the round, "Neue Runde", "Zur Übersicht". **Perfect round:** a distinct message instead of an empty mistakes list.

### Answering per type
- **choice, single:** tap = submit. **choice, multi:** toggle options, then "Antwort abgeben"; correct iff selected set = answer set (same rule as geografie-quiz).
- **input:** text field with `autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false"`; Enter or button submits; empty submit disabled.
- **cloze, bank:** bank = first alternative of every gap (duplicates kept) + `distractors`, shuffled. Tap a word → fills the selected gap, else the first empty gap. Tap a filled gap → word returns to the bank. Submit enabled when all gaps are filled. No drag and drop.
- **cloze, type:** one inline input per gap with the same attributes as `input`.
- Correct iff all gaps are correct; feedback marks each gap.
- Option and bank order are shuffled on every presentation.

### Answer normalization (both sides, before comparing)
1. Unicode NFC.
2. `’ ‘ ‛ ´ \`` → `'` (iOS smart punctuation must not fail `it's`).
3. Trim; collapse internal whitespace to one space.
4. Lowercase unless `caseSensitive`.

Nothing else: no fuzzy matching, no stripping punctuation. `it's` ≠ `its`.

### Mastery and round selection
- Per question: `box` 0–3. Correct → `min(box+1, 3)`; wrong → 0. **Mastered = box 3.**
- A question appears at most once per round, so mastering takes ≥ 3 rounds.
- Selection from the filtered pool: sort by box ascending, then least recently seen (never seen first); take N; shuffle the selected questions. Mastered questions only fill up when unmastered ones run out. "Alle" = whole filtered pool.
- Selection uses an injectable RNG for deterministic tests.

### Storage
- Keys prefixed `quiz:v1:` (the origin `framegrabber.github.io` is shared with other Pages projects, e.g. geografie-quiz).
  - `quiz:v1:sources` → `{ url, title, lastUsed, roundSize? }[]`, most recent first, max 20.
  - `quiz:v1:progress:<url>` → `{ [questionId]: { box, right, wrong, lastSeen } }`.
- Progress for questions no longer in the file is kept and ignored.
- `navigator.storage.persist()` requested once (best effort).
- **Export:** downloads `quiz-fortschritt-YYYY-MM-DD.json` with all `quiz:v1:*` entries plus `{ exportVersion: 1 }`. **Import:** file picker, validates, confirms "Vorhandenen Fortschritt ersetzen?", replaces. No merge.
- Corrupt storage values → that entry is reset with a console warning; the app keeps working.
- **Storage unavailable** (write throws, e.g. quota or restricted mode) → persistent banner "Fortschritt wird nicht gespeichert"; quizzes stay playable.
- Web app manifest + icon so the app can be added to the home screen. No service worker, no offline mode in v1.

### Security
- Quiz content is untrusted. It is validated at load and rendered as text only (no `dangerouslySetInnerHTML`, no HTML/Markdown in v1).
- No analytics, cookies, or third-party runtime requests other than the quiz `src`.

### Accessibility (WCAG 2.1 AA)
- Every flow works keyboard-only and with a screen reader: native `<button>`/`<input>` for all controls, a visible focus. After answering, feedback is announced via an `aria-live="polite"` region that exists before it changes; focus stays in the input for typed answers (see Mobile layout) and moves to "Weiter" otherwise. On "Weiter", focus moves to the next question's answer control.
- Multi choice options expose their selected state (`aria-pressed` or checkbox semantics). Cloze gaps are buttons labeled with their state ("Lücke 2 von 4: leer" / "Lücke 2 von 4: their"); the selected gap is `aria-pressed`.
- One `h1` per screen, no skipped heading levels; every input has a visible or `aria-label` label.
- Correct/incorrect is never shown by color alone (icon + text). Text contrast ≥ 4.5:1, large text and UI boundaries ≥ 3:1, in light and dark mode.
- Animations only for state changes, ≤ 200 ms, disabled under `prefers-reduced-motion`.
- `lang="de"` on the UI; quiz `language` applied to question content (also drives `hyphens: auto`). URLs and long words wrap (`overflow-wrap: anywhere`).
- Touch targets ≥ 44 px; usable at 320 px width.

### Visual design
- Direction: **calm and clear**. Neutral surfaces, one accent color, semantic colors for correct/incorrect, strong type hierarchy; the question is the most prominent element on the round screen. Rejected: gradients, heavy shadows, card grids, purple default palettes, emoji as UI icons.
- **Design tokens** in `src/styles/tokens.css` as CSS custom properties with semantic names (`--color-surface`, `--color-text`, `--color-accent`, `--color-correct`, `--color-incorrect`, `--space-1…`, `--radius-…`, `--font-size-…`). Components use tokens only, no raw colors or off-scale spacing.
- **Light and dark mode** from day one via `prefers-color-scheme`; both palettes meet the contrast rules.
- System font stack only (no web fonts). Icons are inline SVG.
- `docs/design.md` holds the design contract: per screen its job, primary action, required states, responsive rules, and the rejected patterns above.

### Mobile layout (iPhone)
Reference devices, portrait, Safari with its toolbar visible: **iPhone SE 3rd gen (375 × 667 pt)** as the smallest supported screen, and iPhone 17 (402 × 874 pt). Landscape works but may scroll.

- **Round screen = fixed three-part layout** filling the visible viewport: header ≤ 44 px (back, k/N, progress bar) · content area (question + answer UI) · action bar at the bottom (feedback + the primary button "Antwort abgeben"/"Weiter"). The page never scrolls during a round; only the content area may, and only for content beyond the fit limits.
- **Fit limits without scrolling, iPhone SE, keyboard closed:** choice with prompt ≤ 120 characters and ≤ 4 options; bank cloze with text ≤ 160 characters, ≤ 4 gaps, bank ≤ 8 words. **Keyboard open:** an input question with prompt ≤ 120 characters shows prompt, input, and action bar together above the keyboard. Longer content is allowed (validator warns) and scrolls inside the content area.
- **Keyboard overlay:** iOS Safari does not shrink the layout viewport for the on-screen keyboard and ignores `interactive-widget`. The round layout height therefore follows `window.visualViewport.height` (CSS variable `--app-height`, updated on `visualViewport` `resize` and `scroll`), which puts the action bar directly above the keyboard. Fallback without `visualViewport`: `100dvh`.
- **Typed answers keep the keyboard open:** Return submits (`enterkeyhint="done"`); feedback appears in the action bar; Return again continues. Consecutive typed questions (`input` and type-mode `cloze`, in any order) keep the keyboard open: the round keeps a text field focused across the transition. The mechanism (reusing one round-owned field vs. moving focus to the next question's field after render) is decided by the T3 Simulator test and documented in `docs/design.md`. Action bar buttons call `preventDefault` on `pointerdown` so tapping "Weiter" does not blur the input. When the next question needs no typing, the input blurs and the keyboard closes.
- **Type-mode cloze:** Return moves to the next gap (`enterkeyhint="next"`), on the last gap submits (`enterkeyhint="done"`); the focused gap is scrolled into view above the keyboard (`scrollIntoView({ block: "nearest" })` after the viewport resize).
- **Feedback** (icon, Richtig/Falsch, solution) lives in the action bar; a long explanation expands inside the content area. "Weiter" never leaves the screen.
- Inputs use `font-size` ≥ 16 px (prevents iOS auto-zoom on focus). No `maximum-scale`/`user-scalable=no`; pinch zoom stays available.
- `viewport-fit=cover` plus `env(safe-area-inset-*)` padding: nothing sits under the notch/Dynamic Island or the home indicator.
- `touch-action: manipulation` on controls (no double-tap zoom).
- Start and Overview scroll normally; the primary action ("Starten") sits in a sticky bottom bar. Result screen: score and buttons visible without scrolling; the mistakes list scrolls below them.

### Larger screens (iPad, desktop)
- Content column max width ~40 rem, centered; the round's header and action bar align to the same column. Same layout rules otherwise, including the visual-viewport handling for the iPad on-screen keyboard.
- Checked at 768, 1024, and 1440 px wide, and on an iPad in the Simulator with the keyboard open.

### Content: first quiz (`quiz-content` repo)
- Path: `englisch/green-line-1/possessive-determiners.json`.
- ≥ 40 questions, all with ids; covers my, your, his, her, its, our, their; uses all three types; explanations on the typical confusions (his/her, its/it's, your sg./pl.).
- Own sentences only; no text copied from Green Line.
- The `quiz-content` CI checks out `framegrabber/quiz` and runs `npm run validate -- ../quiz-content` on every push/PR; invalid files fail the build.

## Code Style

```tsx
// src/question-types/input/check.ts
import { normalize } from "../../engine/normalize.ts";
import type { InputQuestion } from "./schema.ts";

export function checkInput(q: InputQuestion, given: string): CheckResult {
  const opts = { caseSensitive: q.caseSensitive ?? false };
  const target = normalize(given, opts);
  const correct = [q.answer, ...(q.accept ?? [])].some((a) => normalize(a, opts) === target);
  return { correct, solution: q.answer };
}
```

```ts
// non-UI part (src/question-types/definitions.ts) — used by format/ and the CLI
export interface QuestionDefinition<Q extends QuestionBase, A> {
  type: Q["type"];
  schema: z.ZodType<Q>;
  check(question: Q, answer: A): CheckResult;              // pure
}
export interface CheckResult { correct: boolean; solution: string; parts?: boolean[] }

// UI part (src/question-types/registry.ts) — used by the app
export interface QuestionProps<Q, A> {
  question: Q;
  phase: "answering" | "feedback";
  result?: CheckResult;                                     // set in "feedback"
  onChange(answer: A | null): void;                         // null = incomplete; enables "Antwort abgeben"
  onSubmit(answer: A): void;                                // immediate submit (single choice tap, Return)
}
export interface QuestionType<Q extends QuestionBase, A> extends QuestionDefinition<Q, A> {
  Component: FunctionComponent<QuestionProps<Q, A>>;
}
```

- The Round screen alone owns the action bar, scoring, progress recording, and focus moves between questions; question components never render the primary button.
- Components stay under ~200 lines; split into subcomponents otherwise. Styles use tokens from `src/styles/tokens.css` only.
- Named exports, no default exports. Files `camelCase.ts`, components `PascalCase.tsx`.
- Pure logic (format, engine, check) has no DOM or storage access; side effects live in `storage/` and components.
- Validation happens once at the boundary (load, import); internal code trusts types.
- UI strings in German, inline (no i18n layer).
- Prettier defaults; 2-space indentation; double quotes.

## Testing Strategy

- **Unit (Vitest), required:** `normalize`; each type's `check`; cloze parser (gaps, alternatives, escapes, malformed text); format validation with valid and invalid fixtures, asserting error paths; id derivation stability; mastery transitions; round selection (ordering, fill-up, "Alle", category filter) with a seeded RNG; hash param parsing and precedence; storage read/write, corrupt values, export/import round trip.
- **Component (Testing Library + happy-dom):** one keyboard-only flow per question type (answer → feedback → Weiter), the error screen for an invalid document, and the empty/loading/all-mastered/perfect-round states. Every component test runs axe-core on the rendered output and fails on violations (contrast is checked manually, happy-dom has no layout).
- **Fixtures:** `src/format/fixtures/*.json`, including a converted sample of the possessives quiz.
- **No E2E suite in v1.** Before each release, layout check in the **iOS Simulator** (Xcode, iOS 26: iPhone SE 3rd gen, iPhone 17, one iPad; software keyboard enabled; light and dark mode) against `npm run dev`/`preview` on `localhost`: one screenshot per question type with keyboard closed, plus input and type-cloze with keyboard open. Desktop responsive mode does not count for keyboard behavior; it is used for the 320/768/1024/1440 px width checks. Then a real iPhone (incl. smart apostrophe input) and one desktop browser against the deployed Pages URL.
- No coverage percentage target; every module in `format/`, `engine/`, `storage/`, `question-types/*/check.ts` has tests.

## Boundaries

- **Always:** validate quiz documents and imports at the boundary; render quiz content as text; run `npm run typecheck && npm test` before committing; when the format changes, update the Zod schema, the generated JSON Schema, and `docs/quiz-format.md` in the same commit.
- **Ask first:** adding dependencies; any non-additive format change (would mean `schema: 2`); changing the `localStorage` key layout (needs a migration); adding a service worker, backend, or third-party service; adding Markdown/HTML rendering of content.
- **Never:** execute or `eval` content from quiz files; inject quiz content as HTML; add analytics or tracking; delete user progress without explicit confirmation; copy textbook text verbatim into `quiz-content`.

## Success Criteria

1. Opening `https://framegrabber.github.io/quiz/#src=https%3A%2F%2Fframegrabber.github.io%2Fquiz-content%2Fenglisch%2Fgreen-line-1%2Fpossessive-determiners.json` on iPhone Safari shows the quiz overview and a round can be completed.
2. `#…&cat=<id>&n=5` starts with that category and round size preselected; the student can change both.
3. An invalid quiz shows a German error with JSON paths; a 404, a network error, and non-JSON each show their own message; the app never shows a blank screen.
4. `npm run validate` exits 1 with all errors listed for invalid files, 0 for valid ones; `quiz-content` CI fails on an invalid quiz.
5. For answer `it's`, input `It’s` (smart apostrophe, capital) is correct and `its` is wrong; for `caseSensitive: true`, case matters.
6. Answering a question correctly in 3 separate rounds marks it mastered; one wrong answer resets it; progress survives reload and browser restart.
7. Rounds prefer unmastered and least recently seen questions; with a seeded RNG, selection is deterministic in tests.
8. Recent sources list shows the last used quizzes; entries can be removed.
9. Exporting progress and importing it in a fresh browser profile restores the same mastery counts.
10. A full round of each question type works keyboard-only; feedback does not rely on color.
11. The possessive determiners quiz meets the content requirements above and passes the validator.
12. Pushing to `main` deploys the app to Pages; the JSON Schema is available at `/quiz/schema/quiz.v1.json`.
13. Production JS ≤ 60 KB gzip (Vite build output).
14. In the iOS Simulator on iPhone SE 3rd gen: content within the fit limits needs no scrolling; with the keyboard open, prompt, input, and action bar are visible; consecutive typed questions keep the keyboard open; tapping an input causes no zoom; nothing is hidden under the notch, home indicator, or keyboard.
15. `npm run typecheck` and `npm test` pass, including axe checks in all component tests.
16. Every screen works in light and dark mode with the contrast rules met, and at 320/768/1024/1440 px wide; on iPad the content stays a centered column.
17. Swipe-back during a round returns to the Overview; the URL on the Overview always reflects the current category and round size.
18. Loading, first-visit, all-mastered, perfect-round, storage-unavailable, and clipboard-blocked states each render their specified content.

## Out of Scope for v1

- `map` and `flag` question types and the geografie-quiz converter (v2). Planned mapping: `multiple` → `choice`, `fillblanks` → `cloze` (`_` + `blanks[]` → `{answer}`), `flag-to-country` / `country-to-flag` → `flag`, `map` → `map` with map config (GeoJSON URL, projection, name property, filter) moving from `mapConfig.js` into the quiz document.
- Library manifest / browse screen.
- QR code for share links, offline mode/service worker, i18n, Markdown in questions, points/streaks (score is "x/N richtig"), teacher dashboard, accounts/sync.

## Resolved Decisions

1. Green Line unit: not pinned; `source` is `"Green Line 1 Bayern"` without a unit.
2. Separate home-screen storage on iOS: accepted; export/import is the bridge, no install warning.
3. Scoring: "x/N richtig" only, no points or streaks in v1.
