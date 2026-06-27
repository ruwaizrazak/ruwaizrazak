# Design Guidelines

The visual system for ruwaizrazak.com. Source of truth is `src/styles/global.css` (`@theme` block) — read it before deciding values. Never hardcode hex or font names that a token already covers; every visual choice must survive light **and** dark mode.

## Typography

Defined in the `@layer base` of `global.css`, responsive at the 768px breakpoint:

- **Display (serif):** `h1`, `h2`, and body `p` use `--font-serif` (IBM Plex Serif). This is the brand's reading voice.
- **Sans:** `h3`–`h6` use `--font-sans` (Saira Condensed) — condensed, for subheads and UI labels.
- **Mono:** `--font-mono` (IBM Plex Mono) — code and metadata.
- **Handwriting:** `--font-handwriting` (Caveat) — accents only (annotations, polaroids), never body.

Rules:
- One `<h1>` per page; never skip levels (`h2`→`h3`, not `h2`→`h4`). The type scale already encodes hierarchy — don't fake a heading with bold body text.
- Don't restyle base heading sizes per-page; if a page needs a different rhythm, question whether it's really a different heading level.
- Body copy is serif and large by design (`--text-lg`/`--text-xl`). Respect the generous reading measure; don't cram.

## Color

Tokens (see `@theme` and the `.dark` override in `global.css`):

- `--accent` `#295757` — primary brand accent.
- `--color-konpeki` `#004A8F` (light) — deep blue; used for `blockquote` border, emphasis.
- `--color-syoro` `#003535` — dark teal text/ink.
- `--color-link` `#1A86FF` — links.
- `--color-cardbg` / `--color-card-border` — card surfaces.
- `--color-backgroundcolor`, `--color-text-primary`, `--color-cursor` — base surfaces.

Rules:
- Use tokens via Tailwind (`text-konpeki`, `bg-cardbg`, etc.) or `var(--…)`. Hardcoded hex is a P2 finding.
- **Dark mode is first-class.** Every token has a `.dark` value; a new color must define both or it will break one theme. Test both before claiming done.
- Don't introduce a new accent or semantic color without user sign-off — that's a brand decision (`product-judgment.md`).
- Maintain legible contrast (WCAG AA: 4.5:1 body, 3:1 large text) in both themes.

## Spacing, layout & containers

- Use Tailwind's spacing scale; keep rhythm consistent with adjacent sections rather than inventing one-off margins.
- **Hierarchy and spacing before containers.** Reach for whitespace and alignment before adding a border, card, or box. A card is a commitment that the content is a discrete, scannable unit.
- Respect the existing content measure — long-form text should not run full-bleed on wide screens.
- Breakpoints: mobile-first; the codebase uses `768px` as the main desktop breakpoint and defines `--breakpoint-3xl: 120rem` for very wide screens.

## Imagery

- New images: Astro `<Image />` (auto WebP + srcset). In MDX: the `Image` component.
- Always set `width`/`height` (or aspect ratio) to prevent layout shift — `img { border-radius: 8px }` is global.
- Above-the-fold hero: eager. Below the fold: `loading="lazy"`.
- Remote domains must be in `astro.config.mjs` `image.domains`.
- Every image needs a descriptive `alt`. Decorative-only images get `alt=""`.

## The bar

A change is visually done when: it uses tokens and the type scale, holds up at 375px and 1280px, reads correctly in dark mode, adds no layout shift, and earns any new container it introduces.
