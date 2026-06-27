# Component Guide

Reach for an existing component before writing markup. This maps the reader's intent to the right component in `src/components/`. Verify the component's current props by reading its source — this is a routing map, not an API contract.

## Navigation vs action

- **Navigation** (go somewhere): `HeaderLink`, `Navigation`, `Link` / `mdxComponents/Link`, `ContentCard` (the whole card links), `DotNav`, `TocPill`. Render as anchors.
- **Action** (do something): `Button`, `ThemeToggle`, `WorkModal` triggers, lightbox open in `mdxComponents/Image`. Render as buttons.
- Don't style a `<button>` to look like a link to navigate, or an `<a>` as a button to act. It breaks keyboard, middle-click, and screen-reader semantics.

## Content listing & cards

| Intent | Component | Notes |
| --- | --- | --- |
| List items in a collection | `ContentCard` | `variant`: `card` (image top), `compact` (text + bottom border), `wide` (image beside text). Pass `maturity`, `collection`, `url`. |
| Featured work on home | `SelectedWorksSection`, `WorkCard`, `WorkCardCompact` | |
| Other/secondary works | `OtherWorksSection` | |
| Series listing | `SeriesCard`, `SeriesPostCard` | Series index uses its own schema, not baseSchema. |
| Garden (knowledge map) | `garden/*`, `GardenPreview` | Canvas + GSAP; heavy, keep it scoped to the garden routes. |
| Tag chip | `Tag` | Use for taxonomy, not for actions. |
| Maturity (seed/plant/tree) | `MaturityBadge` | Reflects content schema, not decoration. |

## Page chrome

- `BaseHead` — required on every page for meta/OG/JSON-LD. Pass unique `title` + `description`; pass `schema` for page-specific JSON-LD.
- `Header`, `Footer`, `Main`, `Navigation` — global chrome.
- `PageHero` / `NotePostHero` / `IntroSection` — page and post heroes.
- `CustomCursor`, `DotNav`, `toc/TocPill` — progressive enhancements; must degrade gracefully without JS.

## MDX content components

In `.mdx` content, import from `src/components/mdxComponents/` instead of duplicating Tailwind:

- **Imagery:** `Image` (lightbox + zoom; thumbnail uses Astro `<Image />`), `AnnotatedImage`, `PolaroidImage`, `ImagesLeft`, `BeforeAfter`, `sideBySide`, `WorkImageGrid`, `VideoBreakout`.
- **Asides:** `Callout`, `SideNote`, `SmallText`, `references`.
- **Structure:** `WorkSection`, `ProjectOverview`, `ProcessTimeline`, `MetricsRow`, `EngagementBarChart`, `PostMeta`, `ToSinglePost`.
- **Links:** `Link` (internal/external + tooltip previews), `ExternalLink`.
- **Indicators:** `draftsIndicator`, `lowConfidenceIndicator`, `targetedAudience`.

If an MDX file is repeating Tailwind classes for a layout pattern, that pattern belongs in a new `mdxComponents/*` component (per `CLAUDE.md` Modularization Rules).

## Surface persistence — match importance

- **Inline / in-flow** — default. Primary content and most disclosure (`Callout`, `SideNote`, expandable sections).
- **Tooltip** (`tooltip`, `Link` previews) — peripheral, hover/focus, low-commitment.
- **Lightbox** (`mdxComponents/Image`) — full-res image zoom/pan only.
- **Modal** (`WorkModal`) — a focused secondary task; the heaviest, most interruptive surface. Justify it; prefer inline first.

## React vs Astro

- Default to `.astro` (zero JS shipped).
- Use `.tsx` only for genuine client interactivity, and always with a hydration directive (`client:visible` preferred for below-the-fold, `client:idle`, or `client:load`).
- Client-side logic for `.astro` belongs in `src/scripts/` as an init module wired via `initOnLoad()` — never inline >10 lines.

## Red flags

- Building a card/list layout by hand when a `ContentCard` variant fits.
- A raw `<img>` in MDX instead of the `Image` component (loses optimization + lightbox).
- A new modal for something that reads fine inline.
- A React island for static content.
