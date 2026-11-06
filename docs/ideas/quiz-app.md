# Quiz App (successor to geografie-quiz)

## Problem Statement
How might we let Bavarian Gymnasium students in a class practise any subject's content by opening a shared link — no accounts, no backend — while the author only writes content (with AI help), never code?

## Recommended Direction
**Link player with plugin question types, library-ready.** A static app on GitHub Pages loads one quiz file from a URL (`app/#src=<url>`). Sharing a quiz = sharing that link (or a QR code) with the class. Quiz content lives in a separate public repo, ideally itself served via GitHub Pages; assets (images, GeoJSON) resolve relative to the quiz file URL via `new URL(path, src)`.

Each question type is a self-contained module behind one contract (render, check answer, report result). v1 ships `choice`, `input` (typed answer) and `cloze` (sentence gaps, generalising the old `fillblanks`). The geography types (`map`, `flag`) are ported in v2 — that port is the proof the plugin contract is honest.

The UI stays round-based (short rounds, score) because that is what kept geografie-quiz fun, but rounds are drawn with per-question mastery underneath (simple Leitner boxes): wrong items come back sooner, and a quiz shows "x of y mastered". Progress and recently used sources live in localStorage, keyed by source URL + question id. A library manifest (`index.json` by subject/grade/textbook/unit) is explicitly deferred but the source format must not block it.

Compatibility with geografie-quiz is loose: new clean JSON schema, one-off converter for `js/data/questions.js` (question objects map almost 1:1; category metadata from `config/categories.js` and map settings from `config/mapConfig.js` move into the quiz file).

### Format sketch (to be pinned down as JSON Schema)
```json
{
  "schema": 1,
  "title": "Possessive determiners",
  "subject": "Englisch",
  "source": "Green Line 1 Bayern, Unit ?",
  "language": "en",
  "categories": [{ "id": "possessives", "name": "my, your, his …" }],
  "questions": [
    { "id": "pd-001", "type": "input", "category": "possessives",
      "prompt": "Tom and Lisa love ___ dog.", "answer": "their" },
    { "id": "pd-002", "type": "choice", "category": "possessives",
      "prompt": "The cat is playing with ___ ball.",
      "options": ["its", "it's", "his", "their"], "answer": "its" },
    { "id": "pd-003", "type": "cloze", "category": "possessives",
      "text": "I like {my} bike, but {her} bike is faster.",
      "words": ["my", "her", "his", "your"] }
  ]
}
```

## Key Assumptions to Validate
- [ ] **localStorage survives long enough for mastery to matter** — Safari/iOS ITP may clear it after ~7 days without a visit; school iPads/private mode too. Test on real student devices; mitigate with progress export/import (code or file) and PWA install.
- [ ] **Quiz repo is fetchable cross-origin and fresh enough** — day-1 spike: fetch a JSON file from the quiz repo's Pages URL and from raw.githubusercontent.com (≈5 min cache) out of the app's Pages origin.
- [ ] **Strict typed-answer checking is acceptable** — case/whitespace-insensitive exact match plus explicit `accept: []` alternatives; no fuzzy matching (`it's` must fail for `its`). Pilot and watch for "but I was right" complaints.
- [ ] **Classmates come back** — pilot one Green Line unit with 3–5 students for 2 weeks; ask how often they used it and whether "x of y mastered" motivated them.
- [ ] **AI-authored quizzes are reliably correct** — schema validator catches structure; spot-check content; every quiz has an author-run validation step before publishing.

## MVP Scope
**In**
- Static app on GitHub Pages; load quiz from `#src=` URL; recent sources list (localStorage)
- JSON Schema + validator (CLI usable by author/AI before committing a quiz)
- Question types: `choice` (single/multi correct), `input`, `cloze`
- Rounds with score; per-question Leitner mastery; "x of y mastered" per quiz/category
- Progress export/import
- Separate public quiz repo with the first quiz: possessive determiners (my, your, his, her, its, our, their), own sentences, aligned to Green Line 1 Bayern

**Out (v2+)**
- `map` and `flag` types + converter for the geografie-quiz content
- Library manifest and browse screen

## Not Doing (and Why)
- **Backend, accounts, sync, teacher dashboard** — the core constraint; class sharing works through links alone.
- **Loading legacy `.js` quiz files** — would execute remote code from user-supplied URLs; a converter is safer and one-off.
- **Generated questions from tables** — explicit items are cheap with AI authoring and easier to verify; revisit as a question type if authoring becomes the bottleneck.
- **Fuzzy answer matching** — it would accept exactly the errors (`it's`/`its`) the quizzes train.
- **In-app quiz editor** — author is technical and uses AI; schema + validator is enough.
- **Private quiz repos** — GitHub Pages cannot read them without a token.
- **Copying textbook exercises verbatim** — public repo + Klett copyright; write original items and reference the unit.

## Open Questions
- Which Green Line 1 Bayern unit introduces possessive determiners (for the `source` field and quiz sequencing)?
- Tech stack: plain ES modules with no build vs. TypeScript + Vite with a Pages deploy action (TS + a schema library would give types and JSON Schema from one source).
- Round length and mastery thresholds (e.g. 10 items; mastered after 3 correct in a row across sessions?).
- Should a share link be able to pin a subset (category) or round length, e.g. `#src=…&cat=possessives`?
- Language of the UI: German only, or per-quiz (`language` field drives e.g. keyboard hints)?
