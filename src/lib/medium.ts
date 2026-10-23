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

const fetchPosts = async (): Promise<MediumPost[]> => {
  const { feed, limit, exclude } = siteConfig.writing;
  if (!feed || limit <= 0) return [];

  try {
    const response = await fetch(feed, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();

    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .map((match) => parseItem(match[1]))
      .filter((post): post is MediumPost => !!post && !exclude.includes(post.id))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  } catch (error) {
    // A Medium outage should never fail the deploy; the section just hides.
    console.warn(`[medium] Could not load ${feed}: ${error instanceof Error ? error.message : error}`);
    return [];
  }
};

// Header and the Writing section both need the posts; fetch once per build.
let cached: Promise<MediumPost[]> | undefined;
export const getMediumPosts = () => (cached ??= fetchPosts());
