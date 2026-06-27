# Copy & Accessible Names

Covers UI/product copy and accessible names — labels, headings, button text, link text, `alt`, empty-state messages, meta titles/descriptions. **Prose voice** (essays, notes, case-study body) is owned by `ruwaiz-writing-style` — defer to it for anything reader-facing and long-form.

## Scope of Copy mode

Edit user-facing language, accessible names, and the JSX/markup directly required to do so. Report structural blockers (e.g. "this heading is wrong because the IA is wrong") without silently broadening into a redesign.

## Principles

- **Name the object and the action.** A link/button says what it does and to what: "Read the case study", "Open image", "Back to notes" — not "click here", "more", "→".
- **Lead with the noun the reader scans for.** Card titles and headings front-load the topic, not throat-clearing.
- **Honest empty states.** "No notes published yet." beats a blank region or a fake skeleton. Say what's true and, if useful, what comes next.
- **Consistent terminology.** Match the site's existing words (notes, essays, works, series, garden, live). Don't introduce synonyms for the same thing.
- **Tone matches the brand** — thoughtful, plain, unhyped. If in doubt on voice, check `ruwaiz-writing-style`.

## Accessible names

- Every actionable element has an accessible name: visible text, or `aria-label` when it's icon-only (`ThemeToggle`, social icons, close buttons, lightbox controls).
- `alt` describes the image's content/purpose; decorative images get `alt=""`. Don't start with "image of".
- Icon + text: don't double up (don't `aria-label` a button that already has visible text saying the same thing).
- Link text must make sense out of context (screen-reader users tab link-to-link).

## Meta copy (SEO-facing but user-visible in results)

- Every page: unique `title` and `description` via `BaseHead`. Never ship the default.
- `description` under ~160 chars, specific to the page, no keyword stuffing — it's the snippet a human reads in search/social.

## Micro-rules

- Sentence case for UI labels and headings unless the brand does otherwise; match existing pages.
- No trailing punctuation on button labels; do use it in sentences and empty-state messages.
- Numbers and dates: use the site's `formatDate` util output; don't hand-format inconsistently.

## Bad / good

- ❌ `<a href="/works/x">click here</a>` → ✅ `<a href="/works/x">Read the {project} case study</a>`
- ❌ `alt="image"` → ✅ `alt="Dashboard redesign — before and after the navigation change"`
- ❌ Empty `/live` renders nothing → ✅ "No updates this month yet."
