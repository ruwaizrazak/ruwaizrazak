# Product Judgment

Use this before building or redesigning anything that changes what a reader sees, reads, or does. It produces the decision; the other references produce the execution.

## The internal brief

For any Shape/Implement/Harden task, answer these before touching layout:

- **Reader** — who lands on this surface? (search visitor on a single note, someone browsing `/works`, a recruiter on `/about`, an RSS reader, you reviewing your own garden)
- **What they came for** — read one thing, scan many, decide what to read next, contact you, see proof of work.
- **Content object** — which collection and entry? (essay, note, work, series part, live update, playground, garden card)
- **Current behavior** — what does the surface do today, verified in source + render?
- **Desired outcome** — the reading or action you want to make easy.
- **Success signal** — how you'd know it worked (reader reaches the content without friction, the next read is obvious, the page reads at a glance on mobile).
- **Non-goals** — what this change explicitly does *not* try to fix.
- **Open decisions** — material choices not yet settled; surface these, don't bury them.

## Material vs mechanical

Spend judgment on **material** decisions; move fast on mechanical ones.

**Material** (model it, compare alternatives, name the tradeoff):
- Which content is primary on a page and what the reader does next.
- Information architecture: how collections, tags, and series relate and how the reader moves between them.
- Whether a surface should be a page, an inline section, a tooltip, a lightbox, or a modal.
- The reading order and hierarchy of a hero, a card, or an index.
- Whether new UI/config is justified vs a stronger default.

**Mechanical** (just do it well):
- Swapping a raw `<img>` for the `Image` MDX component or Astro `<Image />`.
- Replacing a hardcoded hex with the matching token.
- Choosing a `ContentCard` variant that already fits.
- Tightening spacing to the existing scale.

## Smallest coherent intervention

Before adding UI, in order:

1. **Better default** — can the existing component/page just do the right thing? (e.g. set `maturity`, `featured`, or a real `description` rather than building a new badge.)
2. **Reuse** — does `ContentCard`, `PageHero`, `Tag`, `Button`, `Callout`, or a `mdxComponents/*` already cover this?
3. **Hierarchy** — can spacing, type scale, and alignment solve it without a new container?
4. **New component** — only when the above genuinely don't fit, and then it belongs in `src/components/` (PascalCase) or `src/components/mdxComponents/` if it's an MDX layout pattern.

## Decide-before-decorate checklist

For each non-mechanical change, be able to answer:

- What reader problem does this solve?
- Why is this component/surface the right one (cite `component-guide.md`)?
- What does the page need to make obvious, and does the design do it?
- Which evidence supports the decision (`CLAUDE.md`, a token, an adjacent page)?
- What is the smallest coherent change that ships it end to end?

## When to stop and ask

Ask the user (don't guess) when a material decision changes the **information architecture** (new collection, new top-level nav, changing how series/tags work) or the **brand read** (new accent, new type treatment, new motion language). These are reversible only at cost and are the user's call.

## Bad / good

**Bad:** "The works page feels empty, I'll add filter chips, a sort dropdown, and a view toggle." — solves an unverified problem by adding three controls the reader must learn.

**Good:** "The works page feels empty because only 3 of 9 works have `publish: true` and none have `heroImage`. Strongest intervention: surface the missing heroImages and confirm which works should publish — no new UI." — traces to content reality, smallest coherent fix.
