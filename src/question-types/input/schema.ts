import { z } from "zod";
import { questionBaseShape, textSchema } from "../../format/common.ts";

export const inputSchema = z.strictObject({
  ...questionBaseShape,
  type: z.literal("input"),
  prompt: textSchema,
  answer: textSchema,
  accept: z.array(textSchema).min(1).optional(),
  caseSensitive: z.boolean().optional(),
});

export type InputQuestion = z.infer<typeof inputSchema>;
