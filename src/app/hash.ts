export type RoundSize = number | "all";

export interface HashParams {
  src?: string;
  /** Set when a `src` was given but is not allowed. */
  srcRejected?: true;
  cats?: string[];
  n?: RoundSize;
  /** Human-readable notices about ignored parameters. */
  problems: string[];
}

/** Parses `#src=<url>&cat=<id>,<id>&n=<int|all>`. Invalid values are dropped and reported. */
export function parseHash(hash: string, { dev }: { dev: boolean }): HashParams {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const result: HashParams = { problems: [] };

  const src = params.get("src");
  if (src !== null) {
    if (isAllowedSource(src, dev)) result.src = src;
    else result.srcRejected = true;
  }
  const cat = params.get("cat");
  if (cat) result.cats = cat.split(",").filter(Boolean);

  const n = params.get("n");
  if (n !== null) {
    if (n === "all") result.n = "all";
    else if (/^[1-9]\d*$/.test(n)) result.n = Number(n);
    else result.problems.push(`Ungültige Rundengröße „${n}“ wird ignoriert.`);
  }

  return result;
}

function isAllowedSource(value: string, dev: boolean): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return true;
  return (
    dev &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname)
  );
}
