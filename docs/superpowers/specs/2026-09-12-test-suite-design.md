# Test suite for ruwaizrazak.com

**Date:** 2026-09-12
**Status:** implemented, not yet run

## Goal

A suite that catches regressions in the site's interactions, its pure logic, and
its published output — without becoming a maintenance tax that gets deleted in
six months.

## Stack

| Layer | Tool | Runs against |
|---|---|---|
| Unit | Vitest (node + jsdom) | `src/` modules directly |
| Integrity | Vitest (node) | the built `dist/` |
| E2E | Playwright | `astro preview` on port 4322 |

Three new devDependencies: `vitest`, `jsdom`, `@playwright/test`.

Everything runs against production output, not the dev server. It is an SSG
site: `dist/` is the artifact that ships, and the dev server adds a toolbar and
HMR client that exist nowhere in production. Preview binds 4322 rather than
Astro's 4321 so a running dev server can never be mistaken for the build.

Browsers: chromium, webkit, and a Pixel 7 viewport. Webkit is not optional —
`TocPill.astro` carries two iOS-Safari-specific workarounds (backdrop-filter
hit-testing, the `rounded-full` radius fallback) that chromium cannot regress on.

## Decisions

1. **Animation-heavy features get end-state assertions, not tween sampling.**
   Wait for animations to settle, then assert the resulting DOM. Tests the
   contract rather than the easing, so retuning a curve does not turn the suite
   red. No visual-regression baselines — the site's typography is retuned often
   enough that committed PNGs would be stale continuously.

2. **The CLAUDE.md SEO checklist is enforced as failing tests.** One h1 per page,
   no skipped heading levels, unique title and description, descriptions within
   160 characters, alt on every image, canonical and OG present, JSON-LD parses.

3. **`/embed/**` is exempt from the SEO rules.** It deliberately mirrors
   `/works/<slug>` for iframe embedding. It is still tested for rendering its
   content without site chrome. Its presence in the sitemap is a known,
   accepted duplication.

4. **The theme cycle is three states and that is correct.** `light → dark →
   system → light`, pinned in both unit and E2E tests. `system` has no distinct
   icon; the stored preference is the only place it is observable, and the tests
   assert it there.

5. **Webmentions are fixture-driven.** The real `src/data/webmentions.json` is
   empty, so the reply cap and Show more/less toggle never render and could
   never be tested. `Webmentions.astro` reads `process.env.TEST_FIXTURES === '1'`
   and swaps in `tests/fixtures/webmentions.sample.json` at build time. This runs
   in Node during the build; neither JSON reaches the browser.

## Layout

```
tests/
  unit/         pure logic (node) + DOM behaviour (jsdom, per-file docblock)
  integrity/    assertions against dist/
  e2e/          Playwright specs
  fixtures/     webmentions.sample.json
  helpers/      astro-content-stub, dist, content, seo-policy
```

`astro:content` is a virtual module that only exists inside an Astro build, so
`vitest.config.ts` aliases it to `tests/helpers/astro-content-stub.ts`. That lets
`collections.ts` and `resolveInternalLink.ts` be tested against fixture entries
rather than the real content directory.

## Scripts

```
npm run test            unit + integrity (builds first)
npm run test:unit
npm run test:integrity
npm run test:e2e
npm run test:all
```

## Deliberately not covered

GSAP tween interpolation values, grass-canvas pixels, flubber path morphing,
visual regression, axe/colour-contrast auditing, and reduced-motion branches
beyond the odometer's.

Also excluded as dead code: `WorkModal.astro` + `work-modal.ts` (nothing imports
the component; `initWorkModal()` is never called), and the select-dropdown
branches of `listingFilters.ts` (`.collection-filter`, `#tagDropdown`,
`#showMoreTags`, `#additionalTags` are rendered nowhere). The live tag-chip path
of `listingFilters.ts` is covered.
