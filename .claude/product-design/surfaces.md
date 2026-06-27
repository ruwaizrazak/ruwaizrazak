# Surfaces & States

A static content site enters far fewer states than an app — so map only the states this site can actually reach, but don't stop at the populated success case. Skipping empty/long/error states is the most common quality gap here.

## Surfaces on this site

- **Pages/routes** — collection indexes (`/notes`, `/essays`, `/works`, `/series`, `/live`, `/playground`, `/garden`), single entries (`[...slug]`), `/about`, home `/`, `/tags/[tag]`, embeds, OG images.
- **Overlays** — lightbox (`mdxComponents/Image`), `WorkModal`, tooltips (`Link` previews, `tooltip`).
- **Persistent chrome** — `Header`, `Footer`, `Navigation`, `DotNav`, `TocPill`, `CustomCursor`, `ThemeToggle`.
- **Transitions** — Astro View Transitions between pages; GSAP entrance/scroll sequences.
- **Feeds** — `/rss.xml`, sitemap.

For each surface, inventory: entry points, regions, overlays it can open, transitions in/out, and exits/return paths.

## Reachable states (map these)

| State | Where it shows up | Don't forget |
| --- | --- | --- |
| **Loading** | Lazy images, hydrated islands (garden canvas, charts), webmentions, tooltip fetches, View Transition in-flight | Reserve space (no layout shift); use a stable affordance, not a jump |
| **Empty** | A collection/tag with zero published entries; `/live` with no updates; related-notes with no matches | Honest empty message, not a blank region or broken grid |
| **Sparse** | Index with 1–2 items; a work with no `heroImage`; a note with no tags | Layout must not look broken or imply missing content |
| **Populated** | The normal case | — |
| **Long content** | Long titles, long descriptions, long tag lists, very long posts | Truncate or wrap gracefully — see `resilience.md` |
| **Error / missing** | Missing image asset, failed webmention/OG fetch, missing remote image domain | Degrade gracefully; never a broken-image icon or blank card |
| **Disabled / unpublished** | `publish: false`, `maturity: seed` drafts | Confirm intended visibility; don't leak drafts |
| **Responsive** | <768px vs ≥768px vs 3xl wide | Both ends, not just the design width |
| **Dark mode** | Every surface | A real state, not an afterthought — test it |
| **No-JS / pre-hydration** | Progressive enhancements (cursor, TOC, dot-nav, garden) | Core content/navigation must work before/without JS |

## States this site does NOT have

Don't design for app states the site can't enter: billing, permissions/auth gates, optimistic updates, stale-while-revalidate, multi-user concurrency, destructive irreversible mutations. If a task seems to need one, that's a signal to re-check scope with `product-judgment.md`.

## State coverage check

Before calling a surface done, confirm you've considered: loading, empty, sparse, populated, long-content, error/missing-asset, responsive (both ends), dark mode, and no-JS. List the ones that don't apply and why.
