import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { siteConfig } from "../config";

export interface AppProof {
  kind: "app";
  version: string;
  releasedAt: string;
  rating?: number;
  ratingCount?: number;
  fetchedAt: string;
}

export interface Beat {
  status: 0 | 1;
  time: string; // ISO, UTC
  ping: number | null;
}

// Slots in the heartbeat strip; the browser polls for the same window.
export const BEAT_COUNT = 48;

export interface SiteProof {
  kind: "site";
  status: "up" | "down";
  beats: Beat[]; // oldest to newest
  uptime30d?: number;
  avgResponseMs?: number;
  fetchedAt: string;
}

export type ProjectProof = AppProof | SiteProof;

interface ProofConfig {
  appStore?: { id: string; country: string };
  kumaMonitor?: number;
}

// cwd is the project root in Astro builds and dev; import.meta.url points into bundled output.
const SNAPSHOT_PATH = join(process.cwd(), "src/data/proof.json");

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const warn = (message: string) => console.warn(`[proof] ${message}`);

const fetchOk = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
};

// One retry, so a single flaky request from the build machine doesn't count as a failure.
const fetchWithRetry = async (url: string) => {
  try {
    return await fetchOk(url);
  } catch {
    return fetchOk(url);
  }
};

const loadSnapshot = (): Record<string, ProjectProof> => {
  try {
    return JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch (error) {
    warn(`Could not read snapshot: ${errorMessage(error)}`);
    return {};
  }
};

const saveSnapshot = (proofs: Record<string, ProjectProof>) => {
  try {
    const next = `${JSON.stringify(proofs, null, 2)}\n`;
    let current: string | undefined;
    try {
      current = readFileSync(SNAPSHOT_PATH, "utf8");
    } catch {}
    // Skip identical writes so builds don't dirty git or trigger dev-server reloads.
    if (current === next) return;
    mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
    writeFileSync(SNAPSHOT_PATH, next);
  } catch (error) {
    warn(`Could not write snapshot: ${errorMessage(error)}`);
  }
};

const fetchApp = async (appStore: NonNullable<ProofConfig["appStore"]>): Promise<AppProof> => {
  const response = await fetchOk(
    `https://itunes.apple.com/lookup?id=${appStore.id}&country=${appStore.country}`,
  );
  const data = await response.json();
  // An unknown id or storefront comes back as 200 with no results.
  const app = data.resultCount > 0 ? data.results?.[0] : undefined;
  if (!app?.version || !app.currentVersionReleaseDate) throw new Error("no app in lookup response");

  return {
    kind: "app",
    version: String(app.version),
    releasedAt: String(app.currentVersionReleaseDate),
    rating: typeof app.averageUserRating === "number" ? app.averageUserRating : undefined,
    ratingCount: typeof app.userRatingCount === "number" ? app.userRatingCount : undefined,
    fetchedAt: new Date().toISOString(),
  };
};

interface Heartbeat {
  status: number;
  time: string; // "2026-10-24 19:35:07.363", UTC without a zone
  ping?: number | null;
}

// Every site shares one status page, so fetch its heartbeats once per build.
let heartbeats: Promise<Record<string, Heartbeat[]>> | undefined;
const getHeartbeats = () =>
  (heartbeats ??= (async () => {
    const { kuma, statusPage } = siteConfig.proof;
    const response = await fetchOk(`${kuma}/api/status-page/heartbeat/${statusPage}`);
    return (await response.json()).heartbeatList ?? {};
  })());

// Kuma badges are SVGs; the value only exists in their <title>, e.g. "Uptime (720h): 99.98%".
const fetchBadge = async (monitor: number, kind: "uptime" | "avg-response", pattern: RegExp) => {
  const response = await fetchOk(`${siteConfig.proof.kuma}/api/badge/${monitor}/${kind}/720`);
  const value = (await response.text()).match(pattern)?.[1];
  if (value === undefined) throw new Error("badge title did not match");
  return Number(value);
};

const fetchSite = async (
  name: string,
  url: string,
  monitor: number,
  previous: ProjectProof | undefined,
): Promise<SiteProof> => {
  const old = previous?.kind === "site" ? previous : undefined;
  // Each source can fail on its own; a failed field keeps its snapshot value.
  const [outside, beats, uptime, response] = await Promise.allSettled([
    fetchWithRetry(url),
    getHeartbeats(),
    fetchBadge(monitor, "uptime", /<title>Uptime \(\d+h\): ([\d.]+)%<\/title>/),
    fetchBadge(monitor, "avg-response", /<title>Avg\. Response \(\d+h\): ([\d.]+)ms<\/title>/),
  ]);

  for (const [label, result] of [["heartbeat", beats], ["uptime badge", uptime], ["response badge", response]] as const) {
    if (result.status === "rejected") warn(`${name}: ${label} unavailable: ${errorMessage(result.reason)}`);
  }

  const heartbeatList = beats.status === "fulfilled" ? beats.value[String(monitor)] : undefined;
  const lastBeat = heartbeatList?.at(-1);
  const recentBeats = (heartbeatList ?? []).slice(-BEAT_COUNT).flatMap((beat): Beat[] => {
    const time = new Date(`${beat.time.replace(" ", "T")}Z`);
    if (Number.isNaN(time.getTime())) return [];
    return [{ status: beat.status === 1 ? 1 : 0, time: time.toISOString(), ping: typeof beat.ping === "number" ? beat.ping : null }];
  });

  // Neither check answered (e.g. the build has no network): that says nothing about the site,
  // so let fetchProofs fall back to the snapshot entry and its old fetchedAt.
  if (outside.status === "rejected" && !lastBeat) {
    throw new Error(`outside check failed (${errorMessage(outside.reason)}) and Kuma has no heartbeat`);
  }

  // Never show a false "down" from one flaky runner request: both checks must fail.
  let status: SiteProof["status"] = "down";
  if (outside.status === "fulfilled") {
    status = "up";
  } else if (lastBeat?.status === 1) {
    status = "up";
    warn(`${name}: ${url} unreachable from the build machine (${errorMessage(outside.reason)}) but Kuma reports up`);
  } else {
    warn(`${name}: ${url} unreachable (${errorMessage(outside.reason)}) and Kuma reports down`);
  }

  return {
    kind: "site",
    status,
    beats: recentBeats.length > 0 ? recentBeats : (old?.beats ?? []),
    uptime30d: uptime.status === "fulfilled" ? uptime.value : old?.uptime30d,
    avgResponseMs: response.status === "fulfilled" ? Math.round(response.value) : old?.avgResponseMs,
    fetchedAt: new Date().toISOString(),
  };
};

const fetchProofs = async (): Promise<Record<string, ProjectProof>> => {
  const snapshot = loadSnapshot();
  const proofs: Record<string, ProjectProof> = {};

  for (const project of siteConfig.projects) {
    const config: ProofConfig | undefined = project.proof;
    if (!config) continue;

    try {
      if (config.appStore) proofs[project.name] = await fetchApp(config.appStore);
      else if (config.kumaMonitor !== undefined) {
        proofs[project.name] = await fetchSite(project.name, project.link, config.kumaMonitor, snapshot[project.name]);
      }
    } catch (error) {
      // A flaky API should never fail the deploy or blank the line; keep that project's last known proof.
      warn(`Could not load ${project.name}: ${errorMessage(error)}; falling back to src/data/proof.json`);
      if (snapshot[project.name]) proofs[project.name] = snapshot[project.name];
    }
  }

  saveSnapshot(proofs);
  return proofs;
};

// Projects.astro is the only consumer today, but cache the promise like medium.ts: once per build.
let cached: Promise<Record<string, ProjectProof>> | undefined;
export const getProjectProof = () => (cached ??= fetchProofs());
