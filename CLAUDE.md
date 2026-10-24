# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio site for Yousuf Khan, Deployed to GitHub Pages at https://ratul0.github.io.

## Commands

- `npm run dev` — Start dev server (localhost:4321)
- `npm run build` — Production build (output in `dist/`)
- `npm run preview` — Preview production build locally

No test runner or linter is configured.

## Architecture

**Astro 5 + Tailwind CSS v4** static site. Single-page layout with no routing beyond `index.astro`.

### Key patterns

- **All site content lives in `src/config.ts`** — a single `siteConfig` export controls every section (personal info, skills, experience, education, projects, references). Sections with empty arrays are hidden automatically.
- **`src/pages/index.astro`** — the sole page, composes all section components and contains the dark/light theme toggle logic (JS using `body.dark` class + localStorage).
- **`src/components/*.astro`** — one component per portfolio section (Hero, About, Projects, Experience, Education, References, Header, Footer). Each reads from `siteConfig`.
- **`src/styles/global.css`** — Tailwind v4 `@theme` block defines CSS custom properties for light/dark palettes. Dark mode works by overriding `--theme-*` variables on `body.dark`. The accent color (`--color-deep-teal`) is set here, not via `siteConfig.accentColor`.
- **Writing section** — `src/lib/medium.ts` fetches `siteConfig.writing.feed` (Medium RSS) at build time; `Writing.astro` renders the latest posts. Each successful fetch rewrites the committed snapshot `src/data/medium.json` (all parsed posts, only when content changed); if the fetch fails or returns no items (Medium sometimes blocks CI IPs) the build logs a `[medium]` warning and falls back to that snapshot, and only hides the section/nav link if the snapshot is missing too. Commit snapshot changes after a build. `deploy.yml` rebuilds every 6 hours to pick up new posts.
- **Project proof** — shown inside each project card's link-preview box (opt in with `proof` on a project in `config.ts`; Kuma host/status page live in `siteConfig.proof`). `src/lib/proof.ts` fetches at build time: the App Store iTunes lookup (version, release date, rating shown at 5+ ratings) for apps, and for websites the Uptime Kuma 30-day uptime/response badges, the newest 48 heartbeats, and an outside `fetch` of the site (a site is "down" only if the outside check fails and Kuma's last heartbeat is down; if neither answers, the project falls back to its snapshot). Each fetch rewrites the snapshot `src/data/proof.json`; on failure each project (and each field) falls back to its own snapshot entry with a `[proof]` warning. Sites render a 48-bar heartbeat strip plus a meta row (status, 30d uptime, avg response, `checked Xs ago`); apps render a release pulse (version pill, ticking `shipped 2d 14h 03m ago`, rating). Both are complete HTML at build time; the script in `Projects.astro` then polls Kuma's CORS-enabled heartbeat endpoint from the visitor's browser every 60s (paused in hidden tabs), animates new bars, and ticks the counters every second. A newest beat older than 10 minutes shows a grey "no recent data" dot. `deploy.yml` rebuilds every 6 hours to keep the snapshot fresh.
- **Icons** — uses `astro-icon` with `@iconify-json/simple-icons` for brand/social icons.
- **Font** — IBM Plex Mono (monospace), imported via `@fontsource` in `index.astro`.

### Theming

Dark mode is the default. Theme is toggled via a fixed button (bottom-right) and persisted in localStorage. The `body.dark` class swaps CSS custom properties defined in `global.css`.

### Adding content

To add or modify portfolio content, edit `src/config.ts`. The TypeScript structure is self-documenting — follow existing patterns for experience entries, education, skills, etc.
