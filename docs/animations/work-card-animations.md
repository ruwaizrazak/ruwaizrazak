# Work Card Animations

**File:** `src/scripts/work-card-animations.ts`

A simple but effective parallax zoom effect on work card hero images. Images start zoomed in at 1.5x and scale down to 1x as they scroll through the viewport.

---

## The Full Code (it's only 28 lines!)

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initWorkCardAnimations() {
  // Clean up previous triggers (view-transition safe)
  ScrollTrigger.getAll()
    .filter(st => st.vars.trigger && (st.vars.trigger as Element).classList?.contains('work-card-image'))
    .forEach(st => st.kill());

  document.querySelectorAll('.work-card-image').forEach(img => {
    gsap.fromTo(img, { scale: 1.5 }, {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: img,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    });
  });
}
```

---

## How It Works

### `gsap.fromTo()` — Explicit Start and End

```ts
gsap.fromTo(element, { scale: 1.5 }, { scale: 1, ... });
```

There are three main GSAP animation methods:

| Method | From | To | Use when |
|--------|------|----|----------|
| `gsap.to()` | Current CSS value | You specify | You know the end state |
| `gsap.from()` | You specify | Current CSS value | You know the start state |
| `gsap.fromTo()` | You specify | You specify | You know both |

Here we use `fromTo` because we want to guarantee the image starts at exactly 1.5x scale and ends at exactly 1x, regardless of what CSS says.

### `scrub: true` — Scroll-Linked Animation

```ts
scrollTrigger: {
  trigger: img,
  start: 'top bottom',    // when image top hits viewport bottom
  end: 'bottom top',      // when image bottom hits viewport top
  scrub: true,
}
```

**`start: 'top bottom'`** — The animation begins the moment the image's top edge enters the viewport from below.

**`end: 'bottom top'`** — The animation ends when the image's bottom edge exits the viewport at the top.

This means the animation spans the **entire time the image is visible**. The image gradually scales from 1.5 to 1.0 as it travels through the viewport.

```
  ┌────────────────────┐
  │                    │ ← viewport top (end)
  │                    │
  │    [  image  ]     │ ← image scrolling up, scale decreasing
  │                    │
  │                    │ ← viewport bottom (start)
  └────────────────────┘
```

**`scrub: true`** means the animation is directly tied to scroll position. No playback — just pure scroll mapping.

### Why `ease: 'none'`?

```ts
ease: 'none'
```

With `scrub: true`, the easing function controls how the animation maps to scroll progress. `'none'` means linear — 50% scrolled = 50% animated. If you used `'power2.out'`, the scale would change quickly at first and slow down at the end.

For scroll-driven parallax effects, `'none'` feels most natural because the user is in direct control. Non-linear easing can feel "slippery" or disconnected when scrubbing.

### Selective Cleanup

```ts
ScrollTrigger.getAll()
  .filter(st => st.vars.trigger && (st.vars.trigger as Element).classList?.contains('work-card-image'))
  .forEach(st => st.kill());
```

Instead of killing ALL ScrollTriggers (which would break other animations on the page), this filters for only the ones attached to `.work-card-image` elements. This is important because:

1. **View transitions** in Astro re-run scripts. Without cleanup, you'd get duplicate triggers.
2. **Other animations** (like related-notes) might be running on the same page and shouldn't be affected.

**Real-world example:** This parallax zoom is a very common pattern. You see it on:
- Medium article hero images
- Apple product showcase pages
- Portfolio sites with project cards

The effect creates depth — the image feels like it's on a different layer than the rest of the page, subtly zooming as you scroll past it.

---

## Making It Your Own

Want to try different effects? Here are some variations:

**Parallax slide (image moves slower than scroll):**
```ts
gsap.fromTo(img, { y: -50 }, {
  y: 50,
  scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
});
```

**Rotate on scroll:**
```ts
gsap.fromTo(img, { rotation: -5 }, {
  rotation: 5,
  scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
});
```

**Fade in as it enters:**
```ts
gsap.fromTo(img, { opacity: 0 }, {
  opacity: 1,
  scrollTrigger: { trigger: img, start: 'top 80%', end: 'top 50%', scrub: true }
});
```
