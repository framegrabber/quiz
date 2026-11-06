// Writes the JSON Schema for editor autocompletion. Cross-field rules (refinements) are not
// representable in JSON Schema; the validator CLI and the app enforce them.
import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import { quizSchema } from "../src/format/schema.ts";

const OUTPUT = "public/schema/quiz.v1.json";

const schema = {
  ...z.toJSONSchema(quizSchema, { io: "input", target: "draft-2020-12" }),
  $id: "https://framegrabber.github.io/quiz/schema/quiz.v1.json",
  title: "Quiz (Format Version 1)",
};

await mkdir("public/schema", { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(schema, null, 2)}\n`);
console.log(`Wrote ${OUTPUT}`);
