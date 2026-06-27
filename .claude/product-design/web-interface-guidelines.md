# Web Interface Guidelines

Interaction quality: keyboard, focus, motion, View Transitions, and performance. Applies to any interactive or animated surface.

## Keyboard & focus

- Everything actionable is reachable and operable by keyboard in a logical tab order (DOM order ≈ visual order).
- Visible focus indicator on every interactive element in both themes — never remove outlines without an equal-or-better replacement.
- Use real semantics: `<a>` for navigation, `<button>` for actions (see `component-guide.md`). `ThemeToggle`, modal triggers, lightbox opens must be buttons.
- Overlays (`WorkModal`, lightbox) must trap focus while open, restore focus to the trigger on close, and close on `Esc`.
- Tooltips (`Link` previews) must be reachable/dismissible by keyboard, not hover-only.

## Forms & inputs

- Minimal on this site, but: inputs are `16px` (global) to prevent iOS zoom — keep it. Associate labels; preserve typed input through any client-side validation.

## Motion

- **Tool choice:** CSS transitions for simple state/hover/entrance; GSAP only for complex, sequenced, or scroll-driven motion (garden, hero scroll, intro text). Don't pull in GSAP for a fade.
- **`prefers-reduced-motion`** — honor it. Scroll-jacking, parallax, and large entrance sequences must reduce to a near-instant or simple fade. This is an accessibility requirement, not a nicety.
- Animate `transform`/`opacity` only; never width/height/top/left (layout thrash).
- Motion should clarify state, continuity, or brand — not decorate. Keep durations short; don't block reading.
- The motion-design-for-the-web skill covers patterns (unified timing, expand/collapse, morphs) if a sequence gets complex.

## View Transitions

- Use `transition:name` for element continuity across navigations (e.g. a card → its post hero).
- Keep transitions off layout-triggering properties; keep them fast.
- Re-init client behavior on `astro:page-load`, not just `DOMContentLoaded` — use `initOnLoad()` so scripts survive View Transition navigations.
- Test that scroll-spy, TOC, cursor, and dot-nav still work after navigating between pages, not just on hard load.

## Pointer & touch

- Tap targets ≥ ~44px. Don't rely on hover for essential info (tooltips are enhancement, content is in-page).
- `CustomCursor` is an enhancement — the site must be fully usable with a normal cursor / touch.

## Performance

- Static-first: no client JS unless interactivity requires it. Hydrate islands with `client:visible`/`client:idle` below the fold.
- Protect LCP: eager hero, lazy everything else, explicit image dimensions.
- Preconnect to font/analytics origins; analytics `async`; fonts `display=swap`.
- Don't import a whole library for one function.

## Check

Tab through it, navigate away and back, toggle `prefers-reduced-motion`, toggle dark mode, and shrink to 375px. If keyboard, focus return, or reduced-motion fails, it's a P1.
