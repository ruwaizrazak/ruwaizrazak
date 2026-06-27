---
name: product-design
description: >-
  Use when work on ruwaizrazak.com changes what a visitor sees, reads,
  understands, or does: shaping a page or flow; building or redesigning
  components, layouts, collection index pages, content cards, navigation,
  heroes, or MDX components; reviewing a URL, screenshot, or diff; improving
  hierarchy, information architecture, component choice, copy, accessibility,
  responsive behavior, motion, or loading/empty/error states. Trigger on
  design, UX, UI, usability, flow, layout, hierarchy, polish, simplify, audit,
  review, "make it production-ready", or "is this right". Not for backend/build
  config with no visible effect, pure content authoring covered by the
  ruwaiz-website skill, or writing prose covered by ruwaiz-writing-style.
---

# ruwaizrazak.com Product Design

Make the interface correct for the visitor, the content, and the brand. Working code is not enough: choose the right structure and component, make the page legible at a glance, cover the states the site can actually enter, and verify the rendered result — not just the source.

This is the **design-judgment and product-quality** layer for the site. It decides *whether* and *how* something should work and *whether it reads right*. For the mechanics of adding content, schemas, routes, and SEO wiring, that ground is held by the `ruwaiz-website` skill; for prose voice, by `ruwaiz-writing-style`.

## Operating Contract

- **Start with the reader, not the pixels.** Identify who lands here, what they came to read or do, which piece of content or surface is involved, and what the page should make easy.
- **Define the outcome before the output.** Establish the current problem, the desired reading/interaction, the success signal, and the non-goals before choosing a layout or component.
- **Use evidence, not taste.** Trace decisions to `CLAUDE.md`, design tokens in `src/styles/global.css`, an existing pattern in `src/components/`, or a verified adjacent page — not to a vibe.
- **Separate facts from decisions.** Mark assumptions and open product choices explicitly; don't bury them in implementation.
- **Treat shipped code as evidence, not precedent.** It proves what exists, not that it's right. Check it against current components and tokens.
- **Choose the smallest coherent intervention.** Prefer a better default, reuse of an existing component, or stronger hierarchy before adding new UI.
- **Decide before decorating.** Resolve information architecture, component semantics, and state behavior before styling, motion, or copy.
- **Design every reachable state.** A static content site has fewer states than an app — but loading, empty, sparse, long-content, and responsive variants are all real. Don't stop at the happy populated case.
- **Verify the real surface.** Source inspection establishes behavior; `npm run dev` / `npm run build` + a rendered viewport establishes visual and interaction quality. Never claim visual verification from code alone.

## Request Modes

Resolve the mode from the user's verb and artifact before acting.

| Mode      | Typical request                                                              | Required behavior                                                                                                                                                  |
| --------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shape     | "Design this section", "how should this page work?", a brief without settled UI | Frame the problem and evidence, compare real alternatives, then define the layout, states, acceptance criteria, and open decisions. Don't edit unless asked.       |
| Implement | "Build", "fix", "improve", "make it production-ready"                        | Resolve the material design decisions, then implement the smallest coherent end-to-end change within scope. Don't absorb unrelated findings.                       |
| Review    | "Audit", "critique", "what's wrong with this page?"                          | Inspect source and rendered evidence, then report prioritized findings. Don't edit unless asked.                                                                   |
| Copy      | "Fix the copy", "tighten this heading"                                       | Edit user-facing language and accessible names only; defer voice to `ruwaiz-writing-style`. Report structural blockers without silently broadening scope.          |
| Harden    | "Polish", "handle edge cases", "make it solid on mobile"                     | Preserve the settled direction while fixing state, responsive, accessibility, motion, and finish defects.                                                          |

When intent is ambiguous, use the narrowest mode the verb supports. A URL, route, or component identifies scope; it does not by itself authorize edits.

A **material decision** changes the reader's task, the default, scope, navigation, the chosen surface, or the reachable states. Token swaps, established component substitutions, and copy mechanics usually are not material.

## Decision Authority

Resolve conflicts in this order:

1. The user's explicit goal and constraints.
2. Verified reader/content reality and how the page actually renders.
3. Repository-canonical guidance: `CLAUDE.md`, the `ruwaiz-website` skill, design tokens in `src/styles/global.css`.
4. Existing components in `src/components/` and established patterns on adjacent pages.
5. The routed references in this skill.
6. General interface heuristics.

## Workflow

### 1. Set scope and mode
Name the target surface (route, component, or section) and the request mode.

### 2. Load context
Before proposing UI, read the relevant parts of `CLAUDE.md`, the `ruwaiz-website` skill, and the actual component(s) and content involved. Know the collection, schema, and layout the surface uses.

### 3. Model the decision
For Shape, Implement, Harden, or any material change, read `product-judgment.md` and write a compact internal brief: reader, what they came for, current behavior, desired outcome, success signal, non-goals, the content object, scope, and open decisions.

### 4. Map the surface and states
Inventory entry points, regions, overlays (lightbox, modal, tooltip), transitions, and exits. Map only reachable states. See `surfaces.md`.

### 5. Load the routed references

| Need | Load |
| ---- | ---- |
| Whether/how something should work; component choice | `product-judgment.md` + `component-guide.md` |
| Implementation or a material visual change | `interface-quality.md` |
| Copy or accessible names | `copy.md` (defer voice to `ruwaiz-writing-style`) |
| Layout, typography, color, spacing, tokens | `design-guidelines.md` |
| Keyboard, focus, motion, View Transitions, performance | `web-interface-guidelines.md` |
| Overflow, long content, missing images, responsive, RTL | `resilience.md` |
| Structural review of a visible change | `review-design-system.md` |

### 6. Decide, then implement
For each non-mechanical change, be able to answer: what reader problem does this solve, why is this component right, what does the page need to make obvious, which evidence supports it, and what is the smallest coherent change?

### 7. Verify
1. Confirm the primary job and acceptance criteria.
2. Run `npm run build` — it must pass with no errors.
3. Inspect a compact (~375px) and a wide (~1280px) viewport via `npm run dev`.
4. Exercise every materially changed state (loading, empty, long content, dark mode).
5. Check keyboard order, focus visibility, and that motion respects `prefers-reduced-motion`.
6. Test long titles, missing `heroImage`, and a sparse collection.
7. For structural visible changes, run `review-design-system.md`.

## Product Design Standards

- Make the reader's primary thing — the content, the next read, the contact path — unmistakable.
- Preserve the reader's context and mental model unless changing it solves a verified problem.
- Use semantic HTML and existing components (`ContentCard`, `Button`, `Link`, `PageHero`, …) before custom markup or one-off Tailwind.
- Use hierarchy, spacing, and alignment before adding containers, borders, or cards.
- Match heading hierarchy to the type scale in `global.css` (serif display for h1/h2, sans for h3+). One `<h1>` per page.
- Use design tokens (`--accent`, `--color-konpeki`, `--color-syoro`, `--font-serif`, …) instead of hardcoded hex or fonts; every change must hold up in dark mode.
- Prefer strong defaults and direct behavior over configuration the reader must learn.
- Prefer inline disclosure (SideNote, Callout, tooltip) before a modal or lightbox.
- Keep motion in service of structure or brand. GSAP only for complex sequences; CSS for simple state/hover. Respect `prefers-reduced-motion`.
- Use Astro's `<Image />` for new imagery; never ship layout shift — set width/height, lazy-load below the fold.
- Don't add decorative novelty, motion, or copy unless it clarifies structure, state, or brand intent.

## Review Output

Lead with findings, ordered by reader impact:

- **P0:** breaks the page, makes primary content unreadable/unreachable, or a severe accessibility failure.
- **P1:** likely to mislead or lose the reader, missing a critical state, or a major responsive/accessibility/dark-mode defect.
- **P2:** meaningful friction, weak hierarchy, inconsistency, or token/motion violation.
- **P3:** minor craft or consistency improvement.

For each finding include: file/line or rendered location, verification status (source vs rendered), canonical source, reader consequence, and the smallest concrete fix.

## Skill Integrity

- Add or change a rule only after verifying it against current source and getting the user's acceptance.
- Record scope, rationale, evidence, and a bad/good example.
- Keep deterministic checks mechanical (lint, build). Keep judgment in prose with its evidence.
- Never promote one screenshot or one shipped file into a universal rule by itself.
