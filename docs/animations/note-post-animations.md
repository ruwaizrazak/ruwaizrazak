# Note Post Animations

**File:** `src/scripts/note-post-animations.ts`

Three coordinated scroll-driven animations that create a layered parallax effect on note detail pages: the content overlaps the hero, the hero fades out, and the hero background zooms.

---

## Overview

When you open a note post, the hero section shows the title and a background image. As you scroll down:

1. The main content slides **up** to overlap the hero (like a card sliding over it)
2. The hero text **fades out**
3. The hero background **zooms out** from 1.15x to 1x

All three happen simultaneously but independently, creating a rich layered effect.

---

## Animation 1: Content Overlaps Hero

```ts
gsap.to(mainWrapper, {
  y: -120,
  ease: 'none',
  scrollTrigger: {
    id: 'note-hero-overlap',
    trigger: mainWrapper,
    start: 'top bottom',
    end: 'top 40%',
    scrub: true,
  },
});
```

### What's happening

The `.note-main-wrapper` (the white content area below the hero) moves **up by 120px** as you scroll. This creates the illusion of the content "sliding over" the hero image.

**`y: -120`** — Negative Y moves the element up. GSAP's `y` maps to `transform: translateY(-120px)`. Using transforms instead of `top`/`margin-top` is important because transforms are GPU-accelerated and don't trigger layout recalculation.

**`start: 'top bottom'` / `end: 'top 40%'`** — The animation starts when the wrapper's top edge reaches the viewport bottom and completes when it reaches 40% from the top. This means the overlap effect finishes relatively early in the scroll, so the content is already overlapping the hero by the time the user starts reading.

```
Viewport:
┌──────────────────────┐ 0% (top)
│                      │
│   [hero fading out]  │ 40% ← overlap complete here
│                      │
│  ┌────────────────┐  │
│  │  content area  │  │ ← sliding up 120px
│  │                │  │
└──┴────────────────┴──┘ 100% (bottom) ← overlap starts here
```

### The `id` Pattern

```ts
scrollTrigger: {
  id: 'note-hero-overlap',
  ...
}
```

Each trigger gets a unique ID. This allows surgical cleanup:

```ts
['note-hero-overlap', 'note-hero-fade', 'note-hero-zoom'].forEach(id => {
  ScrollTrigger.getById(id)?.kill();
});
```

Instead of killing ALL triggers on the page, we only kill the ones we own. This is critical because the same page might have `initRelatedNotes()` running its own ScrollTriggers. Killing everything would break those.

**Real-world tip:** Always use IDs when multiple animation systems coexist on the same page. It's like namespacing your animations.

---

## Animation 2: Hero Content Fade

```ts
gsap.to(heroContent, {
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    id: 'note-hero-fade',
    trigger: heroContent,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});
```

The hero text fades from fully visible to invisible as the hero scrolls out of view.

**`start: 'top top'`** — Begins when the hero content reaches the top of the viewport (the user has scrolled to the hero).

**`end: 'bottom top'`** — Ends when the bottom of the hero content exits the viewport top (hero fully scrolled past).

This means the fade spans the entire height of the hero content. Scroll halfway through the hero = 50% opacity.

---

## Animation 3: Hero Background Zoom

```ts
gsap.to(heroBg, {
  scale: 1.0,
  ease: 'none',
  scrollTrigger: {
    id: 'note-hero-zoom',
    trigger: heroBg,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});
```

The hero background image starts at `scale: 1.15` (set in CSS) and zooms out to `scale: 1.0` on scroll. This creates a subtle "breathing" effect that adds depth.

**Why start at 1.15 in CSS?** The initial scale is set via CSS so the image appears zoomed in before any JavaScript runs. GSAP then animates FROM whatever the current value is (1.15) TO the specified value (1.0).

**Note:** This uses `gsap.to()` (not `fromTo`) because the starting value is already set in CSS. GSAP reads the current computed style as the "from" value.

---

## The Combined Effect

All three animations run on the same scroll range (roughly the hero section), creating a layered transition:

| Scroll Position | Content Overlap | Hero Text | Hero Background |
|-----------------|----------------|-----------|-----------------|
| Hero entering | Starting to slide up | Fully visible | Scale 1.15 |
| Mid-scroll | Halfway overlapped | 50% opacity | Scale ~1.07 |
| Hero exiting | Fully overlapped (-120px) | Invisible | Scale 1.0 |

**Real-world example:** This exact combination is used by:
- Notion's marketing pages
- Stripe's documentation pages
- Many editorial/magazine sites (The Verge, Wired)

The key insight is that layering multiple simple animations (overlap + fade + zoom) creates a much richer effect than any single complex animation.

---

## Common Patterns to Learn From

### Scrub-based parallax
```ts
gsap.to(element, {
  y: -100,           // how far to move
  ease: 'none',      // linear for scroll-driven
  scrollTrigger: {
    trigger: element,
    scrub: true,      // tie to scroll position
  },
});
```
This is the foundation of 90% of scroll animations. Change `y` to `opacity`, `scale`, `rotation`, or any CSS property.

### Multiple animations, same trigger range
You don't need one ScrollTrigger per animation. But using separate triggers gives you:
- Individual IDs for cleanup
- Different `start`/`end` ranges per animation
- Easier debugging (you can comment out one without affecting others)
