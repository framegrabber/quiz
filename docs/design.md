# Design contract

Direction: **calm and clear.** The question is the most prominent thing on the round screen; everything else stays quiet. Audience: students aged 10–18 on phones and school iPads.

Tokens: [`src/styles/tokens.css`](../src/styles/tokens.css). Element defaults and shared classes: [`src/styles/base.css`](../src/styles/base.css). Components use tokens only; component-specific styles live next to the component as `Component.module.css`.

## Screens

| Screen | Job | Primary action | Required states |
|---|---|---|---|
| Start | Get to a quiz | Open a pasted quiz link | First visit (explanation, input focused) · recent quizzes · invalid link (inline error) · storage unavailable (banner) |
| Overview | Pick what to practise and see progress | "Starten" (sticky bottom bar) | Loading (placeholder of the final structure) · normal · all mastered in the selection ("Alles gemeistert", Start stays as review) · unknown `cat` notice · clipboard blocked (selectable link) |
| Round | Answer one question at a time | "Antwort abgeben" → "Weiter" (action bar) | Answering · submit disabled (incomplete) · feedback correct · feedback incorrect with solution · explanation |
| Result | Show how the round went | "Neue Runde" | Mistakes list · perfect round message |
| Error | Explain why the quiz can't open | "Erneut versuchen" | HTTP error · network/timeout · not JSON · invalid quiz (first 10 errors + count) · unsupported format version |

## Layout

- One content column, max `--column-width` (40 rem), centered; side padding `--space-4`.
- **Round:** fixed three-part layout sized to the visual viewport (`--app-height`): header (`--header-height`, back, k/N, progress bar) · scrollable content · action bar. Header and action bar align to the content column. The page itself never scrolls.
- **Start, Overview:** normal page scroll; primary action in a sticky bottom bar.
- **Result:** score and buttons first; mistakes list below.
- Safe areas: `env(safe-area-inset-*)` padding on the outer edges of fixed bars.
- Widths checked: 320, 375 (iPhone SE), 402 (iPhone 17), 768, 1024, 1440 px. Keyboard behavior checked in the iOS Simulator only.

## Type

| Use | Token | Weight |
|---|---|---|
| Question prompt | `--font-size-l` (20 px), `--line-height-tight` | strong |
| Screen title (`h1`, one per screen) | `--font-size-xl` (24 px) | strong |
| Score on result screen | `--font-size-xxl` (32 px) | strong |
| Body, options, buttons, inputs | `--font-size-m` (16 px; inputs never smaller, prevents iOS zoom) | normal / strong for buttons |
| Secondary text | `--font-size-s` (14 px), `--color-text-muted` | normal |

System font stack only. Quiz content gets the quiz's `lang` and `.content` (automatic hyphenation); URLs use `.wrap-anywhere`.

## Color and contrast

Semantic tokens with a light and a dark palette (`prefers-color-scheme`). Ratios computed with the WCAG formula; minimum 4.5:1 for text, 3:1 for UI boundaries and the focus ring.

| Foreground | Background | Min | Light | Dark |
|---|---|---|---|---|
| text | bg / surface / sunken | 4.5 | 15.93 / 17.25 / 14.55 | 15.85 / 14.39 / 12.76 |
| text | accent-subtle / correct-subtle / incorrect-subtle | 4.5 | 14.44 / 14.85 / 14.37 | 12.25 / 12.13 / 13.10 |
| text-muted | bg / surface / sunken | 4.5 | 6.73 / 7.29 / 6.15 | 7.86 / 7.14 / 6.33 |
| on-accent | accent (primary button) | 4.5 | 6.83 | 8.29 |
| accent | bg / surface / accent-subtle | 4.5 | 6.30 / 6.83 / 5.71 | 8.80 / 7.99 / 6.80 |
| correct | surface / correct-subtle | 4.5 | 6.14 / 5.29 | 8.90 / 7.50 |
| incorrect | surface / incorrect-subtle | 4.5 | 6.66 / 5.55 | 7.39 / 6.73 |
| border-strong (inputs, options) | surface / bg | 3 | 4.15 / 3.83 | 4.25 / 4.68 |
| accent (focus ring) | sunken | 3 | 5.76 | 7.08 |

`--color-border` is decorative only (dividers); it never carries meaning.

## Components

- **Buttons:** `.btn` + `.btn-primary` (one per screen region) or `.btn-secondary`. Height ≥ `--tap-target` (44 px). Disabled primary uses sunken background and muted text.
- **Answer option:** `.option`, full-width, ≥ 44 px. Selected: `aria-pressed="true"` (accent border + subtle fill). After answering: `data-state="correct|incorrect"` plus a check/cross icon; the correct option is always marked.
- **Text input:** `.text-input`, ≥ 16 px, `autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false"`, `enterkeyhint` per context. Read-only during feedback (sunken background).
- **Feedback:** icon + "Richtig"/"Falsch" in the semantic color, solution in body text, explanation in muted text in the content area. Announced through an `aria-live="polite"` region that is always rendered.
- **Icons:** inline SVG (`src/ui/icons.tsx`), `aria-hidden`, always next to text.
- **Focus:** `:focus-visible` ring, 3 px accent, 2 px offset. Never removed.
- **Motion:** only state changes (background/border), `--duration` 150 ms; off under `prefers-reduced-motion`.

## Keeping the keyboard open between typed questions

**Decision: (b) each question renders its own text field; the Round focuses the next question's first field right after it renders**, inside the same Return keypress or "Weiter" tap. Question components stay independent; no shared, round-owned field.

Evidence (iOS Simulator, iOS 26.3, Safari, software keyboard, temporary dev spike pages removed in T9, automated with AXe taps on the on-screen keys):

| Transition | (a) reused field | (b) new field |
|---|---|---|
| Return → feedback (field read-only) | keyboard stays | keyboard stays |
| Return → next typed question | keyboard stays | keyboard stays |
| Tap "Weiter" (action bar) → next typed question | keyboard stays | keyboard stays |
| → choice question (field gone, blurred) | keyboard closes | keyboard closes |
| Choice → tap "Weiter" → typed question | — | keyboard opens (focus inside the tap) |

Checked on iPhone SE 3rd gen (visible height 287 of 549 pt with keyboard: prompt, field, feedback, and "Weiter" all visible) and iPad (A16, 715 of 1052 pt). Both mechanisms behave the same, so the simpler component model wins.

Rules that make it work:
- Focus moves synchronously after the render triggered by the user's key or tap (layout effect), never later (timers lose the user gesture and iOS will not open the keyboard).
- Action bar buttons call `preventDefault` on `mousedown`, so tapping them does not blur the field.
- The field becomes read-only during feedback; it is not blurred or disabled.
- While the keyboard is open (`html[data-keyboard-open]`), the round tightens its vertical rhythm (`--content-padding`, `--question-gap`, `--actions-padding` drop one step) so a 120-character prompt, its field, and the action bar fit above the keyboard on the iPhone SE (verified in T11). A focused field is also scrolled into view after the keyboard resizes the viewport.
- Notes: the form accessory bar's ✓ ("Fertig") dismisses the keyboard by design; the QuickType suggestion bar still shows with `autocorrect="off"`, typed text is not altered. Confirm on a real iPhone in T17.

## Rejected patterns

Gradients · heavy or layered shadows · card grids · purple/indigo default palettes · emoji as UI icons · oversized uniform padding · spinners for content loading · color as the only signal · disabling pinch zoom · drag and drop for answers.
