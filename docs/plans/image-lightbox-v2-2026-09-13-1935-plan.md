# ImageLightbox v2 — implementation plan

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)
Design source: Claude Design project `c106a88e-29b7-40e2-a4b8-eca5d077bb3f`, file `ImageLightbox.dc.html`.
**Executor: Codex, GPT-5.6 Sol, high reasoning effort.**

## Context

`src/components/mdxComponents/ImageLightbox.svelte` is the island behind every content image on the site — the CODM essay alone mounts 63 of them. It was migrated out of a `define:vars` script in `Image.astro` (which shipped one copy per image) and, on the way through, three bugs were fixed and pinned by `tests/e2e/lightbox.spec.ts`.

`ImageLightbox.dc.html` redesigns the **overlay only**. The thumbnail path is untouched. The overlay becomes:

- a CSS grid (`1fr auto`) — image stage on top, a caption + control bar pinned to the bottom
- a **control pill** with − / label / + buttons and an always-present Reset, replacing the range slider
- a 52px circular close button in the stage's top-right, replacing today's red square-ish button
- a left-aligned caption in the bottom bar, replacing today's centred `text-4xl` block

This is a visual and interaction rewrite of the open state. Everything the island does *around* that state — portalling, the grow-from-thumbnail entrance, reduced-motion, scroll lock, focus return, Escape, and the three pinned bug fixes — is not in the mock and must survive.

### Decisions already made — do not re-litigate

1. **Stepped ± buttons replace the range input**, per the design. `lightbox.spec.ts`'s zoom test is rewritten accordingly.
2. **The backdrop is tokenised**: `--color-backgroundcolor` at 94% + `blur(20px)`. White in light mode exactly as drawn, `#1a1a1a` in dark. Today's hard-coded `bg-white/95` flashes white over a dark page — an existing bug the mock is silent on.
3. **Touch is in scope: pointer events + pinch-to-zoom.** This is the one part of the work with no design to check against, so its interaction model is specified below rather than left to judgement.
4. `AGENTS.md` adopts GPT-5.6 Sol / high effort as the standing execution default.

### Non-goals

- **Pan is not clamped.** At high zoom the image can be dragged past the viewport edge. That matches both the current build and the mock; changing it is a design question, not a port.
- No wheel-to-zoom, no double-tap-to-zoom, no arrow-key panning. Not drawn, not asked for.
- The thumbnail branches (`picture` / passthrough / `image`) do not change.

## Design spec

Every colour in the mock has a token — use them, never the hex. `#003535` → `--color-syoro`, `#004A8F` → `--color-konpeki`, `#FAF3E5` → `--color-card-border`, `#ffffff` (surfaces) → `--color-cardbg`, `#EAF3FF` → `--color-chip`, `#CFE4FF` → `color-mix(in srgb, var(--color-link) 24%, var(--color-card-border))` (what `.card-shell:hover` already resolves to), `cubic-bezier(0.23,1,0.32,1)` → `var(--ease-snappy)`.

### Overlay

`position: fixed; inset: 0; z-index: 50; display: grid; grid-template-rows: 1fr auto; padding: 24px`, background `color-mix(in srgb, var(--color-backgroundcolor) 94%, transparent)` with `backdrop-filter: blur(20px)` and the `-webkit-` twin. Clicking the backdrop itself (`e.target === e.currentTarget`) closes.

The mock's `position: absolute` is canvas scaffolding — the real overlay stays `fixed` and keeps `use:portal`.

### Image stage (row 1)

`position: relative; min-height: 0`, flex-centred. Inside, the zoom container: `max-width: 1000px; width: 100%; height: 100%`, flex-centred, `overflow: hidden`, `border-radius: 12px`, cursor `grab` / `grabbing` / `default` by state.

The image: `max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 12px; border: 1px solid var(--color-card-border); box-shadow: 0 18px 50px color-mix(in srgb, var(--color-syoro) 14%, transparent); transform: scale(z) translate(panX/z, panY/z); transform-origin: center; will-change: transform; user-select: none`, `draggable="false"`. Transition `transform 260ms var(--ease-snappy)`, and **`none` while a gesture is active** — the existing `0.15s ease` fights the drag.

`min-height: 0` on the row is load-bearing: without it a grid row with `1fr` refuses to shrink below its content and the bottom bar is pushed off-screen.

### Close button

`position: absolute; top: 0; right: 0`, 52×52, flex-centred, `background: var(--color-cardbg)`, 1px card-border, `border-radius: 999px`, `color: var(--color-syoro)`, `box-shadow: 0 2px 10px color-mix(in srgb, var(--color-syoro) 6%, transparent)`. Transition `color`, `border-color`, `transform` 180ms. Hover → konpeki text, link-tinted border, **`rotate(90deg)`**. Icon: 20×20, `stroke-width: 1.8`, `M6 18L18 6M6 6l12 12`.

Today's is `bg-red-400` with a `stroke-width: 4` icon and `rotate(180deg)` — replace it entirely.

### Bottom bar (row 2)

`display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; flex-wrap: wrap; padding-top: 20px`.

**Caption** — `flex: 1 1 320px; min-width: 0; gap: 6px; max-width: 60ch`. Title serif 20 / 500 / syoro. Description serif 16 / 1.55. Render the block only when `title || description`, as today.

**Control pill** — `gap: 8px`, cardbg, 1px card-border, `border-radius: 999px`, `padding: 6px`, `box-shadow: 0 2px 14px color-mix(in srgb, var(--color-syoro) 7%, transparent)`, `flex-shrink: 0`.

| Element | Spec |
|---|---|
| Zoom out | 40×40 round, transparent, syoro, icon `M5 12h14` 18×18 stroke 1.8. `disabled` and `opacity: 0.3` at `zoom <= 1`. Hover bg `color-mix(in srgb, var(--color-syoro) 6%, transparent)` |
| Label | mono 13, `.06em`, syoro, `width: 52px`, centred, **`font-variant-numeric: tabular-nums`** so the pill does not resize as digits change |
| Zoom in | as above, icon `M12 5v14M5 12h14`. `disabled` / `opacity: 0.3` at `zoom >= 4` |
| Divider | 1px × 24px card-border, `margin: 0 2px` |
| Reset | height 40, `padding: 0 16px`, sans 15 / 500 / `.1em` / uppercase / konpeki, `border-radius: 999px`. Hover bg `var(--color-chip)`. **Always rendered** — today it appears only above 1× |

### Zoom model

```
step(dir): next = clamp(round2(zoom + dir * 0.25), 1, 4)
           if next === 1 → zoom = 1, panX = 0, panY = 0
           else          → zoom = next
label:     zoom.toFixed(2).replace(/0$/, '') + '×'
```

The label formatter yields `1.0×`, `1.25×`, `2.0×`, `4.0×` — compatible with the strings the current spec already asserts.

## Touch: pointer events + pinch-to-zoom

No design covers this, so here is the model to build. Replace `mousedown` / `svelte:window mousemove|mouseup` with pointer events on the zoom container.

Track active pointers in a `Map<pointerId, {x, y}>`.

- **`pointerdown`** — capture the pointer (`setPointerCapture`) and record it. With one pointer and `zoom > 1`, begin a pan, storing the start point and current pan. With a second pointer, begin a pinch: store the distance between the two pointers and the zoom at gesture start.
- **`pointermove`** — one pointer: pan exactly as the mouse path does today. Two pointers: `zoom = clamp(startZoom * (dist / startDist), 1, 4)`, and pan by the midpoint delta so the content tracks the fingers. Pinch zoom is **continuous**, not snapped to 0.25 — only the buttons step.
- **`pointerup` / `pointercancel`** — release capture, drop the pointer. When the count falls from 2 to 1, **re-anchor the surviving pointer's start values**, or the image jumps as the gesture degrades to a pan.
- Returning to `zoom === 1` by any route resets pan.

Two things that will silently break it if missed:

- **`touch-action: none` on the zoom container.** Without it the browser claims the gesture for native scroll/page-zoom and the handlers see almost nothing. Safe here — body scroll is already locked while the overlay is open.
- **The transform transition must be off during a gesture** (`isGesturing`), or every pointermove fights a 260ms animation.

Keep `pointerType` out of the branching — one code path serves mouse, touch and pen.

## Implementation order

1. `src/components/mdxComponents/ImageLightbox.svelte` — the whole change lives here. Rewrite the `{#if open}` block and its state; leave the thumbnail branches alone.
2. `tests/e2e/lightbox.spec.ts` — update and extend.
3. `AGENTS.md:20` — model/effort line.

### Must survive the rewrite — verify each

- `use:portal` → the overlay is a child of `<body>`.
- `transition:growFromTrigger` from the thumbnail's centre, plus `transition:fade` on the backdrop.
- `reduceMotion` read on open, zeroing both transition durations.
- `document.body.style.overflow` lock and its `$effect` cleanup.
- Escape closes; closing returns focus to the trigger.
- **`alt` is always present on the zoom image**.
- Window listeners stay bound via `<svelte:window>` / pointer capture, never hand-attached per image.
- The thumbnail renders with **no wrapper element**.

### One stale comment to fix

`ImageLightbox.svelte` claims `WorkImageGrid` keys off `> picture:only-of-type` / `> img:only-of-type`. It now keys off `> astro-island:only-of-type`. The no-wrapper rule still holds for other reasons; correct the stated one.

## Tests

Update `tests/e2e/lightbox.spec.ts`:

- Drive `[data-zoom-in]` / `[data-zoom-out]`; four + clicks reach `2.0×`, Reset returns to `1.0×`, and Reset remains present at rest.
- Assert zoom-out is disabled at 1× and zoom-in is disabled at 4×.
- Assert the close button has a non-zero border radius and an approximately 52px box.
- Assert a dark-theme backdrop is not white.
- Assert the control pill sits below the zoom image and inside the viewport.
- Assert pointer pan changes the image translate.
- On mobile Chrome, assert a two-pointer spread produces a continuous, non-stepped zoom value.

Keep `openFirst()`'s hydration gate. Run Chromium, WebKit, and mobile Chrome.

## Verification

On `/works/01Farmville3/` at desktop and mobile widths: open an image, step zoom to 4× and back, drag, reset, close with Escape, backdrop, and button. Confirm the bottom bar stays visible, captions wrap, the entrance respects reduced motion, and the backdrop follows both themes.

Run:

```bash
npx playwright test tests/e2e/lightbox.spec.ts --project=chromium --project=webkit --project=mobile-chrome
npm run build
grep -c '<astro-island' dist/works/01Farmville3/index.html
```

## Files touched

| File | Change |
|---|---|
| `src/components/mdxComponents/ImageLightbox.svelte` | overlay rewritten: grid shell, control pill, close button, caption bar, pointer/pinch gestures, tokenised backdrop; stale comment corrected |
| `tests/e2e/lightbox.spec.ts` | slider test rewritten for buttons; Reset assertion inverted; disabled states, close styling, themed backdrop, grid layout, pointer pan and pinch added |
| `AGENTS.md` | execution default updated to GPT-5.6 Sol, high effort |

`Image.astro` needs no change — it already passes `title`, `description`, `fullSrc` and `alt` and mounts the island with `client:visible`.

Add `// LEARN:` comments on why `touch-action: none` is required, why the surviving pointer is re-anchored when a pinch degrades to a pan, and why `min-height: 0` is load-bearing on the grid row.
