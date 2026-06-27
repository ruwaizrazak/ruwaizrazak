# Resilience

Real content breaks happy-path layouts. These are the failure modes that actually occur on this site. Test against them before claiming a surface is done.

## Long & variable content

- **Long titles** — note/essay/work titles can be long. Cards, heroes, and nav must wrap or clamp without overlapping or pushing layout. Test a title ~3× the design length.
- **Long descriptions** — index cards and OG previews. Clamp (`line-clamp`) consistently; don't let one card tower over its row.
- **Long tag lists** — `Tag` chips must wrap, not overflow or force horizontal scroll.
- **Very long posts** — TOC, scroll-spy, and dot-nav must stay correct; reading rhythm must hold.
- **Short/sparse content** — a 1-line note or an index with 2 items must not look broken or leave dangling grid cells.

## Missing assets & data

- **Missing `heroImage`** — cards and post heroes must have a sensible no-image layout, not a blank box or stretched placeholder.
- **Remote images** — host must be in `astro.config.mjs` `image.domains`, or the build/image step fails. Check before using a new domain.
- **Failed fetches** — webmentions, OG previews, tooltip metadata: handle the empty/failed case quietly; never render a broken-image icon or error string to the reader.
- **Missing optional fields** — `role`, `location`, `updatedDate`, `excerpt` are optional; UI must not print empty labels or stray separators when they're absent.

## Responsive & viewport

- Verify both ends: ~375px and ~1280px (plus a glance at the `3xl` / 120rem wide case for full-bleed sections).
- No horizontal scroll on mobile. Tap targets ≥ ~44px. Body bumps to 18px under 720px (global rule) — respect it.
- Images: `max-width:100%; height:auto` is global; still set intrinsic dimensions to avoid shift.

## Internationalization / RTL

Content is English today, but: don't hardcode text directions, don't bake text into images, and prefer logical CSS properties (`margin-inline`, `padding-block`) where you're already touching the code. Low priority — note it, don't gold-plate it.

## Performance resilience

- Don't regress LCP: above-the-fold hero images eager, everything else lazy.
- Keep View Transitions off layout-triggering properties.
- Don't hydrate static content; prefer `client:visible` for below-the-fold islands (garden, charts).

## Quick test pass

Throw the worst realistic content at it: longest title, no image, empty collection, 30 tags, dark mode, 375px wide, JS disabled. If any of those breaks or looks broken, it's not done.
