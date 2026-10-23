import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { siteConfig } from "../config";

export interface MediumPost {
  id: string;
  title: string;
  url: string;
  date: Date;
  excerpt: string;
  readingMinutes?: number;
  tags: string[];
}

const WORDS_PER_MINUTE = 230;
const EXCERPT_LENGTH = 180;

const decodeEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

const stripCdata = (value: string) => value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim();

const tag = (xml: string, name: string) => {
  const match = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return match ? stripCdata(match[1]) : "";
};

const toText = (html: string) =>
  decodeEntities(
    html
      .replace(/<figure[\s\S]*?<\/figure>/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

const truncate = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:]+$/, "")}…`;
};

const parseItem = (xml: string): MediumPost | null => {
  const title = decodeEntities(tag(xml, "title"));
  const link = tag(xml, "link");
  if (!title || !link) return null;

  // Medium appends ?source= tracking params; the guid holds the stable post ID.
  const url = link.split("?")[0];
  const id = tag(xml, "guid").split("/").pop() || url;
  // Recent posts carry the full body; older and publication posts only a snippet.
  const html = tag(xml, "content:encoded");
  const text = toText(html);
  const firstParagraph = html
    ? toText(html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? "") || text
    : toText(tag(xml, "description").match(/<p class="medium-feed-snippet">([\s\S]*?)<\/p>/)?.[1] ?? "");

  return {
    id,
    title,
    url,
    date: new Date(tag(xml, "pubDate")),
    excerpt: truncate(firstParagraph, EXCERPT_LENGTH),
    readingMinutes: text ? Math.max(1, Math.round(text.split(" ").length / WORDS_PER_MINUTE)) : undefined,
    tags: [...xml.matchAll(/<category>([\s\S]*?)<\/category>/g)]
      .map((match) => stripCdata(match[1]).replace(/-/g, " "))
      .slice(0, 3),
  };
};

// cwd is the project root in Astro builds and dev; import.meta.url points into bundled output.
const SNAPSHOT_PATH = join(process.cwd(), "src/data/medium.json");

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const newestFirst = (posts: MediumPost[]) => [...posts].sort((a, b) => b.date.getTime() - a.date.getTime());

// The snapshot keeps every parsed post, so exclude/limit changes still apply to it.
const saveSnapshot = (posts: MediumPost[]) => {
  try {
    const next = `${JSON.stringify(newestFirst(posts), null, 2)}\n`;
    let current: string | undefined;
    try {
      current = readFileSync(SNAPSHOT_PATH, "utf8");
    } catch {}
    // Skip identical writes so builds don't dirty git or trigger dev-server reloads.
    if (current === next) return;
    mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
    writeFileSync(SNAPSHOT_PATH, next);
  } catch (error) {
    console.warn(`[medium] Could not write snapshot: ${errorMessage(error)}`);
  }
};

const loadSnapshot = (): MediumPost[] => {
  try {
    const posts = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as (Omit<MediumPost, "date"> & { date: string })[];
    return posts.map((post) => ({ ...post, date: new Date(post.date) }));
  } catch (error) {
    console.warn(`[medium] Could not read snapshot: ${errorMessage(error)}`);
    return [];
  }
};

const fetchFeed = async (feed: string) => {
  const response = await fetch(feed, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();

  // Cloudflare challenge pages can come back as 200 HTML, so an empty feed is a failure too.
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  if (!items.length) throw new Error("no <item> entries in response");
  return items.map((match) => parseItem(match[1])).filter((post): post is MediumPost => !!post);
};

const fetchPosts = async (): Promise<MediumPost[]> => {
  const { feed, limit, exclude } = siteConfig.writing;
  if (!feed || limit <= 0) return [];

  const select = (posts: MediumPost[]) =>
    newestFirst(posts.filter((post) => !exclude.includes(post.id))).slice(0, limit);

  try {
    const posts = await fetchFeed(feed);
    saveSnapshot(posts);
    return select(posts);
  } catch (error) {
    // A Medium outage (or a blocked CI IP) should never fail the deploy or empty the section.
    console.warn(`[medium] Could not load ${feed}: ${errorMessage(error)}; falling back to src/data/medium.json`);
    return select(loadSnapshot());
  }
};

// Header and the Writing section both need the posts; fetch once per build.
let cached: Promise<MediumPost[]> | undefined;
export const getMediumPosts = () => (cached ??= fetchPosts());
