# About Page v2 — implementation plan

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)
Design source: Claude Design project `c106a88e-29b7-40e2-a4b8-eca5d077bb3f`, file `About Page v2.dc.html`.
Companions: `about-page-v2-2026-09-13-1843-decisions.md`, `about-page-v2-2026-09-13-1843-architecture.md`.

---

## Context

`/about` today is a stack of full-width sections: a split hero that borrows the note-post scroll-overlap trick, then Work Experience as **sticky stacking cards**, then prose history, then a 3-card project grid, then the shared garden preview.

`About Page v2` restructures the whole page into a **two-column layout with a sticky portrait rail**, and flattens two of those sections:

- Work Experience: sticky stacking cards → a **flat ledger** of hairline-separated rows with a 44px logo chip.
- From the Garden: 3-card grid → a **flat list** of hairline-separated rows.

Selected Projects stays a card grid, and needs no component work — `WorkCardCompact.svelte` already renders on the shared `.card-shell` / `.card-band` / `.card-eyebrow` / `.card-meta` system the design draws.

The nav pill bar at the top of the mock is already implemented (`Navigation.svelte`). `support.js` is the Claude Design canvas runtime (`DCLogic`, `sc-for`, `style-hover`) — canvas scaffolding with no production equivalent; `sc-for` is just an `{#each}`, `style-hover` is just a `:hover` rule.

### Scope is unusually safe

Three ownership checks, all verified before planning:

- `StickyExperience.astro` / `StickyExperienceView.svelte` — imported **only** by `about.astro`.
- `AboutLayout.astro` — used **only** by `about.astro`. `Main.svelte` — used **only** by `AboutLayout`.
- `GardenPreview.astro` — used by `about.astro` **and** `index.astro:63`. This is the one shared surface; it gets a variant prop rather than a rewrite.

So everything except `GardenPreview` can be changed without touching another route.

### Decisions already made — do not re-litigate

1. **From the Garden: a `variant: 'cards' | 'list'` prop on `GardenPreview`, defaulting to `'cards'`.** `/about` passes `'list'`; the homepage is untouched. One resolver, no duplicated essays-filter or image logic.
2. **Logo chips use `public/about/{nordeus,zynga,glu}.png`** — what the design references. The page currently passes `/works/*.jpeg`; JPEGs cannot be transparent and would show their own background inside a white bordered chip.
3. **Delete `StickyExperience.astro` and `StickyExperienceView.svelte`.** Nothing else imports them.

---

## Design spec

Tokens exist for every colour in the mock — use them, never the hex. `#003535` → `--color-syoro`, `#004A8F` → `--color-konpeki`, `#FAF3E5` → `--color-card-border`, `#5c7070` → `--color-muted`, `#ffffff` → `--color-cardbg`, `rgba(0,53,53,0.05)` → `color-mix(in srgb, var(--color-syoro) 5%, transparent)`, `#CFE4FF` (hover border) → `color-mix(in srgb, var(--color-link) 24%, var(--color-card-border))`, which is what `.card-shell:hover` already resolves to. This is what makes dark mode follow for free.

### Page shell

Container `max-width: 1280px`, `margin: 0 auto`, `padding: 0 28px`. Grid `minmax(0, 30%) minmax(0, 1fr)`, `gap: 56px`, `align-items: start`, `padding-top: 48px`.

`Main.svelte` is currently `<main class="w-full px-20">` — a flat 80px at every width, including phones. Since it is About-only, retarget it to the design's container rather than breaking out of it.

Collapse to a single column below `lg`; the portrait rail stops being sticky and leads the page.

### Left rail — sticky, `top: 32px`, `max-width: 400px`, `gap: 20px`

| Part | Spec |
|---|---|
| Portrait | `src/assets/about/ruwaiz1.jpg`, `aspect-ratio: 4/5`, `object-fit: cover`, `border-radius: 16px`, 1px card-border |
| Facts rows | `label` mono 10 / `.16em` / uppercase / muted, left; `value` sans 17 / 500 / `.04em` / syoro, right-aligned; `padding: 12px 0`; `border-bottom: 1px card-border` |
| Email pill | sans 16 / 500 / `.1em` / uppercase / syoro; 1px card-border; `border-radius: 999px`; `padding: 12px 20px`; centred. Hover → konpeki text + link-tinted border |

Facts: `Now — Senior UX Designer, Nordeus` · `From — India` · `Working on — Player-facing systems`.

The portrait is above the fold and is the page's LCP candidate — resolve it with `optimizePicture()` and render it **eager**, matching how the note-post hero does it.

### Right column

**Intro** — gap 22px. Eyebrow "About" sans 15 / 500 / `.16em` / uppercase / konpeki. `h1` `clamp(52px, 6.4vw, 82px)` / `0.94` / 500 / `-0.03em` / syoro. Two lead paragraphs serif 21 / 1.65, `max-width: 62ch`, `text-wrap: pretty`.

**Section header** — repeats four times, so build it once: label sans 20 / 600 / `.16em` / uppercase / syoro, then a `flex: 1` 1px card-border hairline. "From the Garden" additionally carries a **Visit garden** pill on the same line (konpeki bg, white, `border-radius: 999px`, `padding: 11px 20px`, `flex-shrink: 0`).

**Work Experience** — `padding-top: 72px`. Rows: `grid-template-columns: 44px minmax(0, 1fr)`, `gap: 20px`, `padding: 26px 0`, `border-top: 1px card-border`.

- Logo chip: 44×44, `border-radius: 10px`, 1px card-border, cardbg background, logo contained at 30×30 centred.
- Header line, baseline-aligned and wrapping: role serif 22 / 500 / syoro · company sans 17 / 500 / `.12em` / uppercase / konpeki · `flex: 1` spacer · period sans 16 / `.1em` / uppercase / muted.
- Bullets: serif 17 / 1.6, `max-width: 68ch`, leading `·` in a muted tint, `gap: 12px`.
- "Visit website" link: sans 15 / `.08em` / uppercase.

**A Little History** — `padding-top: 72px`, `gap: 20px`. Body `max-width: 68ch`, `gap: 28px`, paragraphs serif 20 / 1.65, `text-wrap: pretty`.

**Selected Projects** — `padding-top: 72px`. Lead paragraph serif 20 / 1.65. Grid `repeat(auto-fit, minmax(260px, 1fr))`, `gap: 20px`. Cards are `WorkCardCompact` unchanged.

**From the Garden** — `padding: 72px 0 96px`. Rows: `grid-template-columns: minmax(0, 1fr) auto`, `gap: 20px`, `align-items: baseline`, `padding: 22px 0`, `border-top: 1px card-border`. Left column gap 8px: collection eyebrow (glyph + label, konpeki) → title serif 21 / 1.3 → description serif 16 / 1.5 / `#1f4444`. Right: date sans 15 / `.06em` / muted. Row hover → konpeki.

Reuse `.card-collection-icon` from `global.css:137` for the glyph — one mask implementation, not a second.

---

## Implementation order

1. **`src/components/about/SectionHeading.astro`** (new) — label + hairline, optional `action` slot for the Visit garden pill. Used 4×.
2. **`src/components/about/AboutRail.astro`** (new) — portrait (`optimizePicture`, eager) + facts + email pill. Facts as a prop so the copy stays in `about.astro` beside `experience`.
3. **`src/components/about/ExperienceLedger.astro`** + **`ExperienceLedgerView.svelte`** (new) — resolver/view split, because each row needs two things Svelte cannot do during render: `optimizeImage()` on the logo and an awaited `resolveTooltipMeta()` for the website link. Lift both from `StickyExperience.astro`, **including its `<script>` that imports `../scripts/linkTooltips.ts`** — whatever renders a tooltip must also load the binder, and that footgun is documented in the file being deleted.
4. **`src/components/GardenPreview.astro` + `GardenPreviewView.svelte`** — add `variant: 'cards' | 'list'`, default `'cards'`. `'list'` renders the hairline rows; `'cards'` keeps today's markup byte-for-byte so the homepage cannot move.
5. **`src/components/Main.svelte`** — `w-full px-20` → the design container (`max-w-[1280px] mx-auto px-7`, with a sane small-screen padding). About-only, verified.
6. **`src/pages/about.astro`** — rebuild as the two-column grid; drop the full-bleed hero, the `.note-main-wrapper` scroll-overlap block and its `<style>`; point `experience[].image` at `/about/*.png`; add the `facts` array; pass `variant="list"` to `GardenPreview`.
7. **Delete** `StickyExperience.astro` and `StickyExperienceView.svelte`.

`about.astro` currently imports `proseClasses` for the history section. The design gives that prose its own fixed roles (serif 20 / 1.65, 68ch) rather than the Tailwind ladder, so the history section no longer needs `proseClasses` — but **do not change `proseClasses` itself**; `/live` and `/embed/works` still consume it.

Everything here is static: no component in this plan takes a `client:*` directive.

---

## Tests

`/about` currently has almost no coverage — `smoke.spec.ts` asserts only that it renders a theme toggle and a heading. Add `tests/e2e/about.spec.ts`:

1. **Rail is sticky and stays in view.** At 1280×900, record the portrait's `y`, scroll the page 1200px, and assert the portrait is still within the viewport. This is the layout's whole premise, and a plain "element exists" check would not notice it breaking.
2. **Two-column at desktop, one at mobile.** At 1280 the rail and the intro `h1` share a row (rail's `x` < h1's `x`, and their vertical ranges overlap); at 375 the h1 sits entirely below the portrait.
3. **Experience ledger.** One row per entry; each row has a 44×44 logo chip with a non-`0px` border radius; the first row's company reads "Nordeus"; rows are separated by a border, not stacked with `position: sticky` — assert `getComputedStyle(row).position === 'static'` so a revival of the old treatment fails here.
4. **Garden list on /about, cards on the homepage.** `/about` renders the hairline rows and **no** `.card-shell` inside the From-the-Garden section; `/` still renders `.card-shell` there. This is the assertion that pins the variant default and protects the homepage.
5. **Selected Projects** still renders `.card-shell` cards that link to `/works/…`.
6. **Email pill** links to `mailto:hello@ruwaizrazak.com`.
7. **Exactly one `<h1>`** (guards the integrity suite's heading rule).
8. **No console errors** — use `watchPage` from `tests/e2e/helpers`.

Run on **chromium and webkit**; the collection glyph in the garden list uses `-webkit-mask`.

Add `/about/` to `tests/e2e/routes.ts` if it is not already aliased, and check whether `tests/integrity/seo.test.ts` and `internal-links.test.ts` still pass — the page's link set changes.

---

## Verification

```bash
npm run dev
```
Check `/about` at 1280, 1024, 768 and 375: the rail sticks and releases correctly, the ledger rows align on the 44px chip column, section hairlines reach the right edge, and the garden list rows are readable at narrow widths. Check the homepage still shows garden **cards**. Check both themes.

```bash
npx playwright test tests/e2e/about.spec.ts --project=chromium --project=webkit
```

```bash
npx playwright test tests/e2e/smoke.spec.ts --project=chromium
```

```bash
npm run build
```

The build is the SSR check and the place a scoped-CSS mistake announces itself — watch for `css_unused_selector`. Then confirm the page ships no unexpected islands:

```bash
grep -c '<astro-island' dist/about/index.html
```

---

## Files touched

| File | Change |
|---|---|
| `src/components/about/SectionHeading.astro` | **new** — label + hairline + optional action |
| `src/components/about/AboutRail.astro` | **new** — portrait, facts, email pill |
| `src/components/about/ExperienceLedger.astro` | **new** — resolver (logo + tooltip meta) |
| `src/components/about/ExperienceLedgerView.svelte` | **new** — ledger rows |
| `src/components/GardenPreview.astro` | `variant` prop passthrough |
| `src/components/GardenPreviewView.svelte` | `list` branch; `cards` branch unchanged |
| `src/components/Main.svelte` | container retargeted to the design (About-only) |
| `src/pages/about.astro` | rebuilt as the two-column layout; facts; `/about/*.png` logos |
| `src/components/StickyExperience.astro` | **deleted** |
| `src/components/StickyExperienceView.svelte` | **deleted** |
| `tests/e2e/about.spec.ts` | **new** |

Add `// LEARN:` comments per the repo conventions — on why the ledger is a resolver/view split, why `GardenPreview` took a variant instead of being rewritten, and why `Main.svelte` could be retargeted safely (single consumer).
