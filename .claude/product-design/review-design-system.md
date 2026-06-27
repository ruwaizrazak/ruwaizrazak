# Review (Design System)

Run for structural visible changes and audits. Inspect **both** source and the rendered surface — never claim visual verification from code alone. Report findings with the priorities in `SKILL.md` (P0–P3).

## What to inspect

1. **Source** — the component/page diff: semantics, component choice, tokens, props, accessibility attributes.
2. **Rendered** — `npm run dev`, then the actual surface at ~375px and ~1280px, in light **and** dark mode.
3. **States** — exercise each reachable state from `surfaces.md` that the change touches.

## Checklist

**Structure & semantics**
- [ ] One `<h1>`; heading levels sequential.
- [ ] Semantic landmarks (`article`/`nav`/`main`/`section`/`header`/`footer`) used correctly.
- [ ] Navigation is anchors, actions are buttons.
- [ ] Existing component used where one fits; new markup justified.

**Visual system**
- [ ] Colors/fonts/spacing from tokens + type scale — no stray hex or font literals.
- [ ] Correct in dark mode (every new token has a `.dark` value).
- [ ] Hierarchy carried by spacing/type, not unnecessary containers.
- [ ] No layout shift; images have dimensions.

**Interaction & a11y**
- [ ] Keyboard reachable, logical tab order, visible focus (both themes).
- [ ] Overlays trap/restore focus and close on `Esc`.
- [ ] Motion respects `prefers-reduced-motion`; animates transform/opacity only.
- [ ] Descriptive `alt` on images; descriptive anchor text.

**States & resilience**
- [ ] Loading, empty, sparse, long-content, missing-image handled (`resilience.md`).
- [ ] Works at 375px and 1280px; no horizontal scroll on mobile.
- [ ] Core content/nav works without/before JS.

**SEO & meta (visible-adjacent)**
- [ ] Unique `title` + `description` via `BaseHead`; no defaults left.
- [ ] `heroImage` set for OG where relevant; `schema` passed if a new layout.

**Build**
- [ ] `npm run build` passes.

## Finding format

For each finding: **[P#]** — file/line or rendered location · verification (source / rendered) · canonical source (`CLAUDE.md` / token / component) · reader consequence · smallest concrete fix.

Lead with the highest-priority finding. Don't pad with P3s if there's a P0/P1. Don't promote a single screenshot into a universal rule.
