import { expect, test } from "vitest";
import { loadQuiz } from "./load.ts";
import valid from "../format/fixtures/valid.json" with { type: "json" };

const respond =
  (body: string, status = 200) =>
  async () =>
    new Response(body, { status });

test("loads and validates a quiz, without using the HTTP cache blindly", async () => {
  let init: RequestInit | undefined;
  const result = await loadQuiz("https://x/q.json", {
    fetchImpl: async (_url, requestInit) => {
      init = requestInit;
      return new Response(JSON.stringify(valid));
    },
  });
  expect(result.ok && result.quiz.title).toBe(valid.title);
  expect(init?.cache).toBe("no-cache");
});

test("HTTP errors keep their status", async () => {
  expect(
    await loadQuiz("https://x", { fetchImpl: respond("nope", 404) }),
  ).toEqual({
    ok: false,
    error: { kind: "http", status: 404 },
  });
});

test("network failure", async () => {
  const fetchImpl = async () => {
    throw new TypeError("Failed to fetch");
  };
  expect(await loadQuiz("https://x", { fetchImpl })).toEqual({
    ok: false,
    error: { kind: "network" },
  });
});

test("timeout", async () => {
  const fetchImpl = (_url: RequestInfo | URL, init?: RequestInit) => {
    const { promise, reject } = Promise.withResolvers<Response>();
    init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
    return promise;
  };
  expect(await loadQuiz("https://x", { fetchImpl, timeoutMs: 10 })).toEqual({
    ok: false,
    error: { kind: "timeout" },
  });
});

test("not JSON", async () => {
  expect(await loadQuiz("https://x", { fetchImpl: respond("<html>") })).toEqual(
    {
      ok: false,
      error: { kind: "json" },
    },
  );
});

test("invalid quiz reports format errors", async () => {
  const result = await loadQuiz("https://x", {
    fetchImpl: respond(JSON.stringify({ schema: 1 })),
  });
  expect(result.ok).toBe(false);
  if (!result.ok && result.error.kind === "invalid") {
    expect(result.error.errors).toContainEqual({
      path: "title",
      message: "Pflichtfeld fehlt",
    });
  } else {
    throw new Error(`unexpected result ${JSON.stringify(result)}`);
  }
});
