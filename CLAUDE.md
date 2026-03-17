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
- **Icons** — uses `astro-icon` with `@iconify-json/simple-icons` for brand/social icons.
- **Font** — IBM Plex Mono (monospace), imported via `@fontsource` in `index.astro`.

### Theming

Dark mode is the default. Theme is toggled via a fixed button (bottom-right) and persisted in localStorage. The `body.dark` class swaps CSS custom properties defined in `global.css`.

### Adding content

To add or modify portfolio content, edit `src/config.ts`. The TypeScript structure is self-documenting — follow existing patterns for experience entries, education, skills, etc.
