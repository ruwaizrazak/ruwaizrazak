# ImageLightbox v2 — decisions

## Settled decisions

1. Stepped −/+ controls replace the range slider.
2. The backdrop uses `--color-backgroundcolor` at 94% with a 20px backdrop blur, so it follows both themes.
3. Pointer events provide one interaction path for mouse, touch, and pen, including pinch-to-zoom.
4. Approved plan execution defaults to GPT-5.6 Sol at high reasoning effort when available.

## Gesture model

- Track active pointers by ID and capture each pointer on press.
- One pointer pans only when zoom is above 1×.
- Two pointers continuously scale from their starting distance and move the content with their midpoint.
- When a pinch becomes a one-pointer pan, re-anchor the remaining pointer to prevent a jump.
- Disable native touch gestures on the zoom stage and disable transform interpolation while a gesture is active.

## Preserved behavior

- Portal to `<body>` and fixed viewport positioning.
- Grow-from-thumbnail content entrance and fading backdrop.
- Reduced-motion durations, body scroll lock, Escape close, and trigger focus return.
- Full-size image alt attributes and direct, wrapper-free thumbnail branches.
- Pointer capture or Svelte-owned listeners rather than manually attached global listeners.
