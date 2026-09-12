# Tests

Nothing here has been run yet. First run needs one setup step:

```bash
npx playwright install
```

That downloads the browser binaries (~400MB, once per machine). The unit and
integrity suites need no setup.

## Running

```bash
npm run test:unit        # fast, no build, no browser
npm run test:integrity   # builds first, then asserts against dist/
npm run test             # both of the above
npm run test:e2e         # builds with TEST_FIXTURES=1, serves on :4322
npm run test:all         # everything
```

`npm run test:e2e -- --project=chromium` narrows to one browser while iterating.
`npm run test:e2e:ui` opens Playwright's UI mode.

## Layout

- **`unit/`** — pure functions in node; DOM behaviour in jsdom (opted in per file
  with a `// @vitest-environment jsdom` docblock).
- **`integrity/`** — reads the built `dist/`. Routes, SEO rules, sitemap, RSS, OG
  images, internal links, content frontmatter.
- **`e2e/`** — Playwright. Interactions only; `routes.ts` names every page used
  and says why that page was chosen.
- **`helpers/`** — `astro-content-stub` (aliased over the virtual `astro:content`
  module), `dist` (parse built HTML), `content` (read frontmatter off disk),
  `seo-policy` (the rules and their exemptions, defined once).

## Things worth knowing

**Scroll-spy timing.** Both TOC implementations use a ~10% tall
IntersectionObserver band. A single large scroll jump can move a heading clean
over it between samples and the observer never fires. `e2e/helpers.ts` exports
`scrollSmoothlyTo`, which steps in small increments yielding two frames each —
use it rather than `page.mouse.wheel` for anything that asserts on scroll-spy.

**Webmentions fixtures.** `playwright.config.ts` builds with `TEST_FIXTURES=1`,
which makes `Webmentions.astro` read `fixtures/webmentions.sample.json` instead
of the empty real cache. The fixture targets
`https://ruwaizrazak.com/notes/whythissite/` — if that note is renamed, update
both the fixture's `wm-target` values and `ROUTES.pageWithWebmentions`.

**The integrity suite needs a build.** It reads `dist/` and fails with a clear
message if there is none.
