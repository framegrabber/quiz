// Builds the "Lernkarten-Stapel" app icon: writes the SVG sources and renders PNGs with a local
// Chrome (headless). Run `npm run icons` after changing the artwork; the outputs are committed.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const OUT = resolve("public/icons");
const CHROME =
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ACCENT = "#1d5c9e";

/** Three stacked cards with a check mark, drawn on a 512 × 512 canvas. Back cards use solid tints
 *  (white at 45 % and 72 % over the accent) so their overlaps don't show through. */
const ART = `
  <rect x="170" y="112" width="230" height="160" rx="28" fill="#83a5ca"/>
  <rect x="138" y="150" width="250" height="170" rx="30" fill="#c0d1e4"/>
  <rect x="96" y="196" width="290" height="200" rx="34" fill="#fff"/>
  <path d="M170 298 l42 42 l92 -98" fill="none" stroke="${ACCENT}" stroke-width="36"
        stroke-linecap="round" stroke-linejoin="round"/>`;

const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${body}</svg>\n`;

/** Rounded tile with transparent corners: favicon and "any" icons. */
const rounded = svg(
  `<rect width="512" height="512" rx="112" fill="${ACCENT}"/>${ART}`,
);
/** Full-bleed square, artwork shrunk into the 80 % safe zone: maskable and Apple touch icons. */
const fullBleed = svg(
  `<rect width="512" height="512" fill="${ACCENT}"/><g transform="translate(256 256) scale(0.84) translate(-248 -254)">${ART}</g>`,
);

writeFileSync(join(OUT, "icon.svg"), rounded);
writeFileSync(join(OUT, "icon-maskable.svg"), fullBleed);

const work = mkdtempSync(join(tmpdir(), "icons-"));
function render(source: string, size: number, file: string) {
  const html = join(work, `${file}.html`);
  writeFileSync(
    html,
    `<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`,
  );
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--default-background-color=00000000",
      `--window-size=${size},${size}`,
      `--screenshot=${join(OUT, file)}`,
      `file://${html}`,
    ],
    { stdio: "ignore" },
  );
  console.log(`Wrote public/icons/${file}`);
}

render(rounded, 192, "icon-192.png");
render(rounded, 512, "icon-512.png");
render(fullBleed, 512, "icon-maskable-512.png");
render(fullBleed, 180, "apple-touch-icon.png");
