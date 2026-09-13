# Note Post — fix the design drift and the hero-image bug

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)
Design source: Claude Design project `c106a88e-29b7-40e2-a4b8-eca5d077bb3f`, file `Note Post.dc.html`.
Follows the note-post implementation currently sitting uncommitted in the working tree.

---

## Context

The note-post design landed but nine values drifted from `Note Post.dc.html`, and one is an outright bug rather than a drift. An audit compared every specified value against the working tree; this plan fixes what it found. Nothing here is a redesign — every change moves an implemented value back onto its specified one.

The bug is worth understanding before touching anything else, because it is a rule about this codebase, not a typo.

### F1 root cause — a Svelte scoping boundary

`NotePostHero.svelte:217-226` defines `.hero-picture` in its scoped `<style>` and passes `class="hero-picture"` down to `OptimizedPictureView`. But the `<img>` carrying that class lives in **`ui/OptimizedPicture.svelte`'s** template, so it never receives NotePostHero's scoping hash. Svelte therefore compiles the rule to `.hero-picture.svelte-ue2eo6`, finds nothing it can match, and comments the whole block out. Compiling the component confirms it:

```
css_unused_selector | Unused CSS selector ".hero-picture"
/* (unused) .hero-picture { … aspect-ratio: 16 / 7; … }*/
```

The hero image consequently ships with **no** styling: no 16:7 ratio, no `12px 12px 0 0` radius, no border, no 44px margins, no width cap, no `object-fit`. The `:global(.note-post-hero picture)` rule at line 228 is the author hitting this and patching only the symptom.

This is the mirror of the CLAUDE.md rule: `OptimizedPicture` / `OptimizedImage` must stay `<style>`-free so *they* stamp no scoping class onto the `<img>` — and the corollary, not yet written down, is that a **parent's scoped styles cannot reach into them either**. Add that corollary to CLAUDE.md's "Astro/Svelte boundaries" section as part of this work.

It is invisible today only because the main test route `/notes/whythissite/` has `heroImage: ''` and every published note does too — only the three essays carry a hero image.

---

## Fixes

### F1 — Hero image gets its geometry back *(bug)*

In `src/components/NotePostHero.svelte`:

- Wrap `<OptimizedPictureView>` in a `<figure class="hero-figure">` that NotePostHero owns, and **move it inside `.note-post-hero-inner`** so it shares the 1180px container with the text (the design has the image inside the same padded container, not as a sibling of it).
- Put the geometry on the wrapper, which is in NotePostHero's own template and so is scoped correctly: `aspect-ratio: 16 / 7`, `margin: 44px 0`, `border: 1px solid var(--color-card-border)`, `border-bottom: 0`, `border-radius: 12px 12px 0 0`, `overflow: hidden`.
- Style the inner element with the `.wrapper :global(child)` pattern, which scopes the wrapper half and leaves only the descendant global — so nothing leaks:
  ```css
  .hero-figure :global(img),
  .hero-figure :global(picture) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  ```
- Delete the now-dead `.hero-picture` rule and the standalone `:global(.note-post-hero picture)` rule it was propping up.
- Render the figure only when `picture` is non-null, so a note with `heroImage: ''` does not leave an empty bordered box.

Then add the corollary to CLAUDE.md as described above.

### F2 — Hero has no horizontal padding below 768px

`.note-post-hero` is `width: 100vw` with a negative-margin breakout and `padding: 48px 0` at base, so hero text runs edge-to-edge on a phone.

Give `.note-post-hero-inner` a `padding-inline` ladder of **24px → 48px (md) → 80px (lg)**. This deliberately uses `main`'s own `px-6 md:px-12 lg:px-20` values rather than the design's flat 28px: the hero breaks out of `main`, and matching `main`'s ladder keeps the hero title's left edge aligned with the page content beneath it. Record that as a decision, not an oversight.

Keep the vertical values on `.note-post-hero` and reconcile them toward the design: `56px … 0` at md rather than the current `64px`, plus the design's `padding-bottom: 10px` on the band.

### F3 — Maturity pill belongs in the eyebrow row

The design's first row is `Notes · ●  [seed pill]`; the implementation put the pill at the head of the meta row instead.

- Introduce a `.hero-eyebrow-row` flex wrapper holding the collection `<a>`, the dot, and the pill. The pill must sit **outside** the anchor — it is not part of the link.
- Remove the pill and its trailing dot from `.hero-meta-row`, leaving `date · Updated · N min read · hairline · tags`.

### F4 — Hero type constraints

- h1: add `letter-spacing: -0.025em`; **remove** `max-width: 80%` (the design has none — `text-wrap: balance` does that job).
- Lead: `max-width: 62ch` instead of `80%`.

### F5 — Meta hairline

- Colour: `color-mix(in srgb, var(--color-syoro) 12%, transparent)` — the design's `rgba(0,53,53,0.12)`. Today it uses `--color-card-border` (`#FAF3E5`), a cream that is near-invisible against the `syoro/5` band.
- Move it **out** of the `{#if tags.length > 0}` block so a tagless post still gets the rule closing its meta row.

### F6 — Tag capitalisation

Restore the capitalisation the previous hero shipped — `tag.charAt(0).toUpperCase() + tag.slice(1)` — which the rewrite dropped in favour of raw `{tag}`. The `href` already lowercases independently, so this is display-only.

Caveat to note in the decisions file: this yields "Gsap", not the design's "GSAP". Acronyms need the content to spell them that way in frontmatter; capitalise-first-letter is the no-migration fix and matches what the site shipped before.

### F7 — h2 tracking

`proseClasses.ts:40` sets `prose-headings:tracking-normal`, which cancels the design's h2 `letter-spacing: -0.01em`. Drop the blanket `tracking-normal` and add `prose-h2:tracking-[-0.01em]`; h3 stays normal per the design.

### F8 — Tokenise the dot

`#b9c6c6` is hard-coded at `NotePostHero.svelte:200` in an otherwise fully tokenised component, so it will not shift in dark mode (`.dark` overrides, `global.css:71-79`). Replace with `color-mix(in srgb, var(--color-muted) 45%, transparent)`.

### F9 — `readingTime` accuracy

`src/utils/readingTime.ts` currently replaces `-` and `_` with spaces, so "state-of-the-art" counts as four words, and it leaves link URLs intact so `https`, `example`, `com` and every path segment count as words. Both inflate the estimate.

- Strip markdown link targets — `\]\([^)]*\)` — and bare autolinks `<https?://[^>]*>` **before** the syntax pass.
- Strip inline code spans (`` `…` ``) the way fenced blocks already are.
- Remove `-` and `_` from `MARKDOWN_SYNTAX_RE` so hyphenated and snake_case words stay single tokens.

Order matters: URL stripping must run before bracket/paren stripping, or the link target is already orphaned.

### F10 — `<Quote>` has no test coverage

Its only content usage is `src/content/playground/sample.mdx`, which is `publish: false` — so no page is built and the assertion at `tests/e2e/note-post.spec.ts:74` is wrapped in `if (await quote.count())` and silently no-ops. The Quote restyle is entirely unverified.

Add a `<Quote>` to `src/content/essays/DeconstructionofCODM.mdx`. That entry is published, already backs `ROUTES.pageWithToc`, and already carries the `<SideNote>` the suite uses — so one route covers both components and needs no new fixture.

**This is an editorial change to published content.** Pick a quotation that genuinely belongs in a Call of Duty deconstruction and surface the exact insertion for review rather than choosing silently. If that is unwelcome, the fallback is flipping `sample.mdx` to `publish: true`, which publishes a placeholder page — worse, but reversible.

### F11 — No hero-image assertion

This is why F1 survived. `ROUTES.pageWithToc` (`/essays/deconstructionofcodm/`) has `heroImage: '/essays/DeconstructingCODM/codm.webp'`, so it already works as the fixture — add a named alias `pageWithHeroImage` in `tests/e2e/routes.ts` pointing at it, with the usual comment explaining what property it was chosen for.

### F12 — Multi-paragraph blockquote trap

`global.css` gained `.prose blockquote p { display: inline }`. No content has a multi-paragraph markdown blockquote today, so nothing is broken — but the first one written will silently run together. Narrow it to `.prose blockquote p:only-of-type` so multi-paragraph quotes degrade to stacked blocks instead.

### Accepted as-is — do not "fix"

- **`/about` still uses the old `proseClasses`.** The original plan said one scale across the long-form routes, but `/about` does not go through `notesPost.astro` — it has its own hero and layout (`about.astro:103,133`). Leaving it is correct. Add a comment at the top of `proseClasses.ts` naming which pages use which export, so the split reads as intentional.
- **`/embed/works/[...slug]` and `/live`** likewise keep `proseClasses`.

---

## Tests

Write these. **Do not run the full suite** (`npm run test:all`, or the complete Playwright matrix).

### `tests/unit/readingTime.test.ts` — extend

- A hyphenated word counts as one (`state-of-the-art` ×200 → 1 min, not 4)
- A snake_case word counts as one
- A markdown link's URL is not counted: 200 prose words plus 50 long links still reads 1 min
- An inline code span is excluded
- Existing cases still pass

### `tests/e2e/note-post.spec.ts` — extend and tighten

- **Hero image** (new, on `ROUTES.pageWithHeroImage`): the figure renders, and its bounding box ratio is 16:7 within a pixel or two. Assert on geometry, not on a class — that is what makes it catch F1 recurring. Also assert a non-zero `border-top-left-radius`.
- **Maturity pill placement**: the pill is a descendant of `.hero-eyebrow-row` and **not** of `.hero-meta-row` (F3). The current test finds the pill anywhere and would pass either way.
- **Hairline without tags**: on a post with no tags, `.hero-meta-line` is still present (F5).
- **Tag capitalisation**: the first tag's text starts with an uppercase letter (F6).
- **Quote** (F10): drop the `if (await quote.count())` guard — once the essay carries a `<Quote>` the element must exist, and an unconditional assertion is the point.
- **Mobile padding** (F2): at a 375px viewport, the h1's bounding box `x` is ≥ 20px from the viewport edge.

Run on **chromium and webkit**. Not optional — the collection eyebrow and maturity glyphs use `-webkit-mask`.

### Optional regression guard

F1 was caught by the Svelte compiler, not by a test. A small unit spec that compiles every `.svelte` under `src/components/` and fails on any `css_unused_selector` warning would catch the whole class of bug:

```js
const out = compile(source, { filename, css: 'external' });
const unused = out.warnings.filter(w => w.code === 'css_unused_selector');
```

Worth adding if it comes up clean on the existing tree; if it surfaces a pile of pre-existing warnings, note the count and skip it rather than expanding this plan into a cleanup.

---

## Verification

```bash
npm run dev
```
Open `/essays/deconstructionofcodm/` (hero image, SideNote, Quote, TOC) and `/notes/whythissite/` (no hero image — confirm no empty bordered box) at 1280, 1024, 768 and 375. Check the eyebrow row reads `Notes · ● [tree]`, the meta hairline is visible against the band, and hero text clears the screen edge on mobile. Check both themes; the dot and hairline should now shift with the palette.

```bash
npx vitest run tests/unit/readingTime.test.ts
```

```bash
npx playwright test tests/e2e/note-post.spec.ts --project=chromium --project=webkit
```

The measure change already landed, so re-run the two specs that assert against long-form layout:

```bash
npx playwright test tests/e2e/toc-pill.spec.ts tests/e2e/related-notes.spec.ts --project=chromium
```

```bash
npm run build && npx vitest run tests/integrity/seo.test.ts
```

The build is also where a recurrence of F1 would announce itself — watch for `css_unused_selector` in the output, and confirm these components still ship zero JS:

```bash
grep -c '<astro-island' dist/notes/*/index.html
```

---

## Files touched

| File | Fix |
|---|---|
| `src/components/NotePostHero.svelte` | F1 figure wrapper + `:global` descendants; F2 padding ladder; F3 eyebrow row; F4 tracking + max-widths; F5 hairline; F6 capitalisation; F8 dot token |
| `src/utils/proseClasses.ts` | F7 h2 tracking; comment naming each export's consumers |
| `src/utils/readingTime.ts` | F9 URL / inline-code / hyphen handling |
| `src/styles/global.css` | F12 `p:only-of-type` |
| `src/content/essays/DeconstructionofCODM.mdx` | F10 — **editorial, surface for review** |
| `tests/e2e/routes.ts` | F11 `pageWithHeroImage` alias |
| `tests/e2e/note-post.spec.ts` | new + tightened assertions |
| `tests/unit/readingTime.test.ts` | new cases |
| `CLAUDE.md` | the parent-scoped-CSS corollary under "Astro/Svelte boundaries" |

Add `// LEARN:` comments per CLAUDE.md — on why the hero geometry lives on a wrapper rather than on the image's own class, why the hero padding follows `main`'s ladder instead of the design's flat value, and why `readingTime` strips URLs before markdown syntax.
