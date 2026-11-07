# Quiz file format (version 1)

A quiz is one JSON file. The app loads it from a link: `https://framegrabber.github.io/quiz/#src=<URL-encoded link to the file>`. Files live in the public repo [`framegrabber/quiz-content`](https://github.com/framegrabber/quiz-content) and are served from `https://framegrabber.github.io/quiz-content/…`.

- Editor autocompletion: start the file with `"$schema": "https://framegrabber.github.io/quiz/schema/quiz.v1.json"`.
- Check a file before publishing: `npm run validate -- <file|folder|URL>` in the app repo. Exit code 0 = valid.
- The source of truth is the Zod schema in `src/format/` and `src/question-types/*/schema.ts`; this document describes it.

## Document

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
  "questions": []
}
```

| Field | Required | Type | Meaning |
|---|---|---|---|
| `$schema` | no | string | JSON Schema URL for editors; ignored by the app |
| `schema` | yes | `1` | Format version. Other values are rejected |
| `title` | yes | text | Shown on the overview and in the recent-quizzes list |
| `description` | no | text | Short explanation under the title |
| `subject` | no | text | e.g. `"Englisch"` |
| `grade` | no | integer 5–13 | Jahrgangsstufe |
| `source` | no | text | e.g. `"Green Line 1 Bayern, Unit 2"` |
| `language` | no | language code | Language of the questions (`en`, `de`, `fr`, …); used for pronunciation by screen readers and hyphenation |
| `roundSize` | no | positive integer | Default number of questions per round (default 10) |
| `categories` | yes | list, ≥ 1 | `{ "id", "name", "description"? }` |
| `questions` | yes | list, ≥ 1 | See question types below |

"text" means a string that is not empty or only whitespace. Any field not listed here is an error (this catches typos such as `anwser`).

## Fields every question has

| Field | Required | Meaning |
|---|---|---|
| `type` | yes | `"choice"`, `"input"`, or `"cloze"` |
| `category` | yes | The `id` of one entry in `categories` |
| `id` | no, **strongly recommended** | Unique within the file; `A–Z a–z 0–9 _ -`, max 64 characters. Progress is stored per id. Without an id, the app derives one from the content, so editing the question resets its progress |
| `explanation` | no | Shown after answering, right or wrong. Use it for the rule behind the answer |

## Question types

### `choice`: pick one or more options

```json
{
  "id": "pd-001",
  "type": "choice",
  "category": "its",
  "prompt": "The cat is playing with ___ ball.",
  "options": ["its", "it's", "his", "their"],
  "answer": "its",
  "explanation": "its = sein/ihr (Besitz). it's = it is."
}
```

- `prompt` (text), `options` (2–8 unique texts), `answer` (one text, or a list for "select all correct").
- Every answer must appear in `options`. Options are shuffled in the app.
- A list answer is correct only if exactly those options are selected.

### `input`: type the answer

```json
{
  "id": "pd-010",
  "type": "input",
  "category": "forms",
  "prompt": "Tom and Lisa love ___ dog. (they)",
  "answer": "their"
}
```

- `prompt` (text; `___` is shown as a blank), `answer` (the solution shown after answering), `accept` (optional list of further correct answers), `caseSensitive` (optional, default `false`).
- Use `caseSensitive: true` where case matters (German nouns).

### `cloze`: fill gaps in a text

```json
{
  "id": "pd-020",
  "type": "cloze",
  "category": "forms",
  "prompt": "Ergänze die Begleiter.",
  "text": "I like {my} bike, but {her} bike is faster.",
  "distractors": ["his", "your"]
}
```

- `text` with gaps in braces: `{answer}` or `{answer|alternative|…}`. The first alternative is the one shown in the word bank and in the solution. Literal braces: `\\{` and `\\}` (backslash escaped for JSON).
- `mode`: `"bank"` (default: tap words from a word bank) or `"type"` (type into each gap).
- `distractors` (optional): extra wrong words for the bank.
- `prompt` (optional instruction), `caseSensitive` (optional, default `false`).
- The question is correct only if every gap is correct; feedback marks each gap.

## How typed answers are checked

Both sides are normalized, then compared exactly:

1. Unicode normalization (NFC).
2. `’ ‘ ‛ ´` and `` ` `` become `'` (iPhone keyboards type `’`).
3. Leading/trailing whitespace removed, inner whitespace collapsed to one space.
4. Lowercased, unless `caseSensitive` is `true`.

Nothing else is forgiven: no typo tolerance, punctuation counts. `its` ≠ `it's`. Add real alternatives to `accept` (input) or `{a|b}` (cloze).

## Catalog

The start screen lists every quiz from `https://framegrabber.github.io/quiz-content/catalog.json`. You never write this file: `quiz-content` CI runs `npm run catalog -- ../content` after validation and publishes it.

- Each quiz contributes `title`, `description`, `subject`, `grade`, `source`, and its question count. Quizzes are grouped under "subject · Jgst. grade · source", so give quizzes from the same book identical values.
- Order is the file path (`englisch/green-line-1/…`); prefix file names (`01-…`) to control it.
- A catalog document has `"catalog": 1` and a `quizzes` list of `{ src, title, description?, subject?, grade?, source?, questions }`, with `src` relative to the catalog. The validator checks such files too.
- Another catalog (e.g. another teacher's repo) can be opened with `https://framegrabber.github.io/quiz/#catalog=<URL-encoded catalog link>`; the app remembers it.

## Validation rules

Errors (the file is rejected):

- Unknown fields, missing required fields, wrong types, empty texts.
- `schema` other than `1`.
- Unknown question `type`.
- `category` not defined in `categories`; a category without questions; duplicate category ids.
- Duplicate question ids; identical questions without ids.
- `choice`: fewer than 2 or more than 8 options, duplicate options, an answer not in `options`.
- `cloze`: no gap, unclosed `{`, stray `}`, nested gaps, empty gaps or alternatives (reported with the character position).

Cross-references (categories, duplicate ids) are checked once every question is structurally valid. Fix the reported errors and run the validator again.

Warnings (valid, but the question will need scrolling on small phones such as the iPhone SE):

| Limit | Recommended |
|---|---|
| `prompt` length | ≤ 120 characters |
| `choice` options | ≤ 4 |
| `cloze` text length (as shown) | ≤ 160 characters |
| `cloze` gaps | ≤ 4 |
| `cloze` word bank (gaps + distractors, bank mode) | ≤ 8 words |

## Writing good questions

- One learning point per question; put the rule in `explanation`.
- Give every question an `id` with a quiz prefix (`pd-001`, `pd-002`, …). Never reuse an id for a different question.
- Mix types: `choice` to recognize, `input`/`cloze` (type mode) to produce.
- Distractors should be the typical mistakes (`it's` for `its`, `his` for `her`), not random words.
- Write your own sentences. Do not copy exercises or texts from textbooks (the repo is public).

## Authoring with AI

Loop: generate → validate → fix → validate until exit code 0 and no warnings → review the content yourself → commit.

Prompt template:

```text
Write a quiz file in the JSON format described below (paste docs/quiz-format.md).

Topic: <e.g. possessive determiners: my, your, his, her, its, our, their>
Audience: <e.g. Gymnasium Bayern, Jahrgangsstufe 5, Green Line 1>
Language of the questions: <en>, explanations in German.
Categories: <list ids and names>
Size: <e.g. 40 questions>, mix of choice, input, and cloze (some cloze in "type" mode).
Rules:
- Every question has an id "<prefix>-001", "<prefix>-002", …
- Own sentences only, no textbook texts.
- Distractors are typical mistakes for this age group.
- Stay within the recommended limits (prompt ≤ 120 characters, ≤ 4 options, cloze ≤ 160 characters, ≤ 4 gaps, ≤ 8 bank words).
- Add an explanation in German wherever a typical confusion is involved.
Output only the JSON.
```

Then run `npm run validate -- <file>` and paste any errors back to the AI: each line names the file, the JSON path (`questions[12].answer`), and the problem.
