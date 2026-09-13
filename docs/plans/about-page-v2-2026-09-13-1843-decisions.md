# About Page v2 — decisions

Companion to `about-page-v2-2026-09-13-1843-plan.md`.
Written for an agent picking this up cold: what was decided, what was rejected, and why.

---

## From the Garden — a variant prop, not a rewrite

**Decision.** `GardenPreview.astro` / `GardenPreviewView.svelte` gain `variant: 'cards' | 'list'`, defaulting to `'cards'`. `/about` passes `'list'`.

**Why it needed deciding.** `GardenPreview` is the one component in this plan with two consumers: `about.astro` and `index.astro:63`. `About Page v2` flattens the section into hairline rows, but the homepage has no design covering that change.

**Rejected: change both pages.** Simplest code, but it redesigns the homepage off the back of an About mock — a change nobody could check against a design.

**Rejected: a separate `GardenList.astro` + view.** Cleanest separation, but it duplicates the essays-only filter and the `optimizeImage()` pass, which is exactly the kind of drift the resolver/view split exists to prevent.

**Load-bearing detail.** The `'cards'` branch must keep today's markup byte-for-byte. If it is "tidied" while the variant is added, the homepage moves silently — which is why the test suite asserts the homepage still renders `.card-shell` in that section.

---

## Logo chips — `public/about/*.png`

**Decision.** The ledger's 44×44 chips draw from `public/about/{nordeus,zynga,glu}.png`, which is what the design references.

**What changes.** `about.astro` currently passes `/works/{nordeus,zynga,glu}.jpeg`. Both sets exist in the repo.

**Why.** The design puts a 30×30 logo centred on a **white 44×44 chip with a 1px border**. A JPEG cannot be transparent, so each logo would carry its own background rectangle inside that chip and the border would frame a colour block rather than a mark. PNGs are the only set that can sit on the chip.

**Rejected: `src/assets/works/*.jpeg`.** Bundled, so they would get `astro:assets` optimisation — but the transparency problem is the same.

---

## StickyExperience — deleted, not kept

**Decision.** Delete `StickyExperience.astro` and `StickyExperienceView.svelte`.

**Why it is safe.** Verified: `about.astro` is the only importer of either file.

**Why not keep them.** A dead component that still type-checks invites someone to revive a treatment the design deliberately replaced. The ledger's e2e spec asserts `position: static` on the rows for the same reason.

**Carry these forward before deleting** — both are non-obvious and documented in the files being removed:

1. `StickyExperience.astro` resolves `resolveTooltipMeta()` + `buildTooltipHTML()` per entry for the "Visit website" link. The design draws a plain link, but tooltip-bearing external links are the site's established idiom, so the behaviour is preserved.
2. That file's `<script>` imports `../scripts/linkTooltips.ts`. **Whatever renders a tooltip must also load the binder.** Its own comment records the last time this was missed: Footer and IntroSection stopped rendering `Link.astro`, kept emitting `data-tippy-content`, and silently lost the binding script. Astro dedupes the import, so carrying it into the ledger costs nothing.

---

## Main.svelte can be retargeted in place

**Decision.** Change `Main.svelte` from `<main class="w-full px-20">` to the design's `max-width: 1280px` / `padding: 0 28px` container, instead of breaking the About page out of it.

**Why it is safe.** `Main.svelte` is imported only by `AboutLayout.astro`, which is imported only by `about.astro`. The "shared component" reading is wrong here — the chain is single-consumer end to end.

**Rejected: the `w-screen ml-[calc(50%-50vw)]` breakout.** It is the established idiom (`PageHero`, `.note-main-wrapper`) and would work — but it exists to escape a container that other pages need. Nothing else needs this one, and a breakout inside a wrapper you already control is a workaround with no problem to solve.

**Bonus fix.** `px-20` is a flat 80px at every width, phones included. The replacement gets a proper small-screen padding.

---

## Prose: the history section leaves `proseClasses` behind

The design gives "A Little History" fixed roles — serif 20 / 1.65, `max-width: 68ch` — rather than the responsive Tailwind ladder `proseClasses` supplies. So the section stops using that utility.

**Do not "fix" `proseClasses` to match.** It is still consumed by `live/index.astro` and `embed/works/[...slug].astro`. The note-post work already established that the repo intentionally carries more than one prose scale, with each export's consumers named at the top of `src/utils/proseClasses.ts`.

---

## Portrait is the LCP element

The rail image is above the fold on a page whose whole layout is built around it. Resolve it with `optimizePicture()` and render it **eager** — the same treatment the note-post hero gets — rather than the lazy default that suits below-the-fold card images.
