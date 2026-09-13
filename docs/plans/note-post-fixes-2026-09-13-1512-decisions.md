# Note Post fixes — decisions

Companion to `note-post-fixes-2026-09-13-1512-plan.md`.
Written for an agent picking this up cold: what was decided, what was rejected, and why.

---

## F1 — hero geometry lives on a wrapper, not on the image's own class

**Decision.** Wrap `OptimizedPictureView` in a `<figure class="hero-figure">` that `NotePostHero` owns, put the geometry on that wrapper, and reach the inner element with `.hero-figure :global(img)`.

**Rejected: `:global(.hero-picture)`.** It works, but it publishes a bare, generic class name into the global stylesheet where any other component can collide with it. The wrapper form scopes the `.hero-figure` half normally and globalises only the descendant, so nothing leaks.

**Rejected: giving `ui/OptimizedPicture.svelte` its own `<style>`.** CLAUDE.md forbids it — a style block there makes Svelte stamp a scoping class onto the `<img>`, which is the exact thing that component exists to avoid.

**Why it broke.** `NotePostHero` passed `class="hero-picture"` down as a prop, but the element carrying that class is declared in `OptimizedPicture`'s template, so it never received `NotePostHero`'s scoping hash. Svelte compiled the rule to `.hero-picture.svelte-ue2eo6`, matched nothing, and commented the block out with a `css_unused_selector` warning. The hero image shipped with no ratio, radius, border, margin or `object-fit`.

**Generalisation.** The known rule was "those two components must stay `<style>`-free." The corollary — *a parent's scoped styles cannot reach into them either* — was not written down. It now is, in CLAUDE.md under "Astro/Svelte boundaries."

---

## F2 — hero padding follows `main`'s ladder, not the design's flat 28px

**Decision.** `.note-post-hero-inner` gets `padding-inline: 24px → 48px (md) → 80px (lg)`.

**Deviation from the design, on purpose.** `Note Post.dc.html` specifies a flat `28px`. But the hero is a `100vw` breakout out of `<main class="px-6 md:px-12 lg:px-20">`, and matching `main`'s own ladder keeps the hero title's left edge aligned with the page content beneath it. A flat 28px would leave the title 4px off the body copy at every breakpoint.

The bug being fixed is separate and not a judgement call: the base style was `padding: 48px 0`, so hero text ran edge-to-edge on a phone.

---

## F6 — capitalise the first letter only

**Decision.** Restore `tag.charAt(0).toUpperCase() + tag.slice(1)`, which the hero rewrite dropped in favour of raw `{tag}`.

**Known shortfall.** This renders "Gsap", not the design's "GSAP". Making acronyms render correctly needs either an acronym allow-list (a maintenance burden that grows with the tag vocabulary) or the content to spell them that way in frontmatter. Capitalise-first is what the site shipped before the rewrite and needs no content migration; the `href` lowercases independently, so frontmatter can be changed to `GSAP` later with no code change.

---

## F10 — the Quote fixture is an editorial content edit

`<Quote>` appears in exactly one content file, `src/content/playground/sample.mdx`, which is `publish: false` — so no page is built and the e2e assertion guarded by `if (await quote.count())` silently passes against nothing. The restyle is untested.

**Decision.** Add a `<Quote>` to `src/content/essays/DeconstructionofCODM.mdx` — already published, already `ROUTES.pageWithToc`, already carries the `<SideNote>` the suite uses. One route covers both components.

**This changes published writing.** The quotation must genuinely belong in the essay and the exact insertion must be surfaced for the author's review, never chosen silently.

**Rejected fallback:** flipping `sample.mdx` to `publish: true`. It would publish a placeholder page titled "Sample Playground Item" to a live site and into the sitemap and RSS feed.

---

## Accepted as-is — do not "fix"

**`/about` keeps the old `proseClasses`.** An earlier plan said one prose scale across the long-form routes. `/about` does not go through `notesPost.astro` — it has its own hero and layout (`about.astro:103,133`), so it is not a note post and the old scale is correct there. `/embed/works/[...slug]` and `/live` likewise. A comment at the top of `proseClasses.ts` now names each export's consumers so the split reads as intentional rather than as drift.

**`--color-muted` is in `@theme`.** Verified before relying on `text-muted` and `prose-figcaption:text-muted`; both resolve. Dark mode swaps via the `.dark` class variant, not `prefers-color-scheme`.

**`post.body` is populated.** Verified in `.astro/data-store.json` before trusting `readingTime(post.body ?? '')` — otherwise every post would silently read "1 min read".
