import { siteConfig, type LensId, type LensTags } from "../config";

// Build-time helpers for the `?lens=` feature. Components use these to emit data
// attributes and <mark>s; the per-lens CSS is generated below so adding a lens to
// `siteConfig.lenses` needs no stylesheet edit.

export const lenses = siteConfig.lenses;
export const lensIds: string[] = lenses.map((lens) => lens.id);

const fail = (where: string, message: string): never => {
  throw new Error(`[lens] ${where}: ${message}`);
};

const assertKnown = (tags: LensTags, where: string) => {
  for (const id of Object.keys(tags)) {
    if (!lensIds.includes(id)) fail(where, `unknown lens "${id}"`);
  }
};

/** Space-separated lens ids an item is in focus for. Empty string = tagged for none (softened under every lens). */
export const lensMatch = (tags: LensTags = {}, where = "item"): string => {
  assertKnown(tags, where);
  return Object.keys(tags).join(" ");
};

/** Inline custom properties read by the generated `order` rules. */
export const lensOrderStyle = (tags: LensTags = {}): string | undefined => {
  const style = Object.entries(tags)
    .map(([id, tag]) => `--lens-order-${id}:${tag?.order ?? 0}`)
    .join(";");
  return style || undefined;
};

/** Lens ids whose `skills` list includes this chip. */
export const skillLensMatch = (skill: string): string =>
  lenses
    .filter((lens) => (lens.skills as readonly string[]).includes(skill))
    .map((lens) => lens.id)
    .join(" ");

// A skill named by a lens that isn't in `skillGroups` is almost certainly a typo.
for (const lens of lenses) {
  for (const skill of lens.skills) {
    if (!siteConfig.skills.includes(skill)) fail(`lens "${lens.id}"`, `skill "${skill}" is not in skillGroups`);
  }
}

export interface LensMark {
  lens: string;
  phrase: string;
}

export interface TextPart {
  text: string;
  /** Static highlight (References' `highlights`), rendered as before. */
  highlighted: boolean;
  /** Lenses whose marker sweeps over this part. */
  lenses: string[];
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type Range = [start: number, end: number];

/**
 * Split text into parts for rendering. `highlights` are matched case-insensitively
 * everywhere (existing References behaviour); lens `marks` are exact, first occurrence,
 * and throw if the phrase is missing. Ranges may overlap; parts split at every edge.
 */
export const splitText = (text: string, highlights: string[] = [], marks: LensMark[] = []): TextPart[] => {
  const staticRanges: Range[] = highlights.length
    ? [...text.matchAll(new RegExp(highlights.map(escapeRegExp).join("|"), "gi"))].map((m) => [
        m.index!,
        m.index! + m[0].length,
      ])
    : [];

  const markRanges = marks.map(({ lens, phrase }): [string, Range] => {
    const start = text.indexOf(phrase);
    if (start === -1) fail(`lens "${lens}"`, `highlight "${phrase}" not found in: ${text.slice(0, 60)}…`);
    return [lens, [start, start + phrase.length]];
  });

  const edges = new Set<number>([0, text.length]);
  for (const [start, end] of [...staticRanges, ...markRanges.map(([, range]) => range)]) {
    edges.add(start);
    edges.add(end);
  }
  const sorted = [...edges].sort((a, b) => a - b);

  const parts: TextPart[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const [start, end] = [sorted[i], sorted[i + 1]];
    if (start === end) continue;
    parts.push({
      text: text.slice(start, end),
      highlighted: staticRanges.some(([s, e]) => s <= start && end <= e),
      lenses: markRanges.filter(([, [s, e]]) => s <= start && end <= e).map(([lens]) => lens),
    });
  }
  return parts;
};

/**
 * For items whose highlight phrase may live in any of several text fields (a project's
 * description or one of its bullets): returns, per field, the marks that belong to it.
 */
export const placeMarks = (fields: string[], tags: LensTags = {}, where = "item"): LensMark[][] => {
  assertKnown(tags, where);
  const placed: LensMark[][] = fields.map(() => []);
  for (const [lens, tag] of Object.entries(tags)) {
    const phrase = tag?.highlight;
    if (!phrase) continue;
    const index = fields.findIndex((field) => field.includes(phrase));
    if (index === -1) fail(where, `lens "${lens}" highlight "${phrase}" not found in any text`);
    placed[index].push({ lens, phrase });
  }
  return placed;
};

/** Per-lens rules, keyed on `html[data-lens]`. Static rules live in styles/lens.css. */
export const lensCss = (): string => {
  const pressed = [
    'html:not([data-lens]) .lens-btn[data-lens-id=""]',
    ...lensIds.map((id) => `html[data-lens="${id}"] .lens-btn[data-lens-id="${id}"]`),
  ].join(",");

  const perLens = lensIds
    .map(
      (id) => `
html[data-lens="${id}"] [data-lens-sort]{order:var(--lens-order-${id},100)}
html[data-lens="${id}"] [data-lens-match]:not([data-lens-match~="${id}"]):not(:hover):not(:focus-within){--lens-opacity:.45;--lens-blur:1px}
html[data-lens="${id}"] [data-lens-show~="${id}"]{display:inline}
html[data-lens="${id}"] mark.lens-mark[data-lens-mark~="${id}"]{background-image:linear-gradient(var(--lens-mark),var(--lens-mark))}
html[data-lens="${id}"] mark.lens-mark[data-lens-mark~="${id}"].is-swept{background-size:100% 78%}
html[data-lens="${id}"] .project-index::before{counter-reset:lens-n calc(var(--lens-order-${id},0) + 1)}`,
    )
    .join("");

  return `${pressed}{background:var(--theme-accent);border-color:var(--theme-accent);color:var(--theme-bg)}${perLens}\n`;
};

/**
 * Copy variants for a swap-by-CSS slot: the default text plus one per lens, with identical
 * texts merged into one element. `keys` goes in `data-lens-show` ("default" or lens ids).
 */
export const lensVariants = (fallback: string, pick: (lens: (typeof lenses)[number]) => string) => {
  const byText = new Map<string, string[]>([[fallback, ["default"]]]);
  for (const lens of lenses) {
    const text = pick(lens);
    byText.set(text, [...(byText.get(text) ?? []), lens.id]);
  }
  return [...byText].map(([text, keys]) => ({ text, keys: keys.join(" ") }));
};
