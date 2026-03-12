# Related Notes Animation

**File:** `src/scripts/related-notes.ts`

A two-phase animation: first the container height reveals itself (scroll-driven), then cards pop in with a shuffled stagger effect (triggered once). This file also handles the horizontal scroll carousel arrows.

---

## Phase 1: Height Reveal (Scroll-Driven)

```ts
// Measure the natural height, then collapse it
reveal.style.height = 'auto';
const fullHeight = reveal.offsetHeight;
reveal.style.height = '0px';

// Animate height from 0 to fullHeight on scroll
gsap.to(reveal, {
  height: fullHeight,
  ease: 'none',
  scrollTrigger: {
    trigger: section,
    start: 'top 90%',
    end: 'top 50%',
    scrub: true,
  },
});
```

### The "measure then collapse" trick

This is a classic technique for animating to an unknown height:

1. **Set height to `auto`** — the browser calculates the natural height
2. **Read `offsetHeight`** — capture that calculated value (e.g., 340px)
3. **Collapse to `0px`** — hide the element
4. **Animate to the captured value** — GSAP can now tween from 0 to 340px

**Why not just animate `height: auto`?** CSS (and GSAP) can't interpolate between a number and `auto`. You need two concrete numbers: `0px` and `340px`. The browser can't tween between `0px` and `auto` because `auto` isn't a number — it's an instruction to calculate.

**`start: 'top 90%'`** — The reveal begins when the section's top edge is at 90% of the viewport height (near the bottom). This means the container starts growing before it's fully in view, so by the time the user sees it, it's already partially revealed.

**`end: 'top 50%'`** — Fully revealed when the section reaches the middle of the viewport.

```
Viewport:
┌──────────────────────┐ 0%
│                      │
│                      │ 50% ← fully revealed
│                      │
│                      │
│                      │ 90% ← starts revealing
└──────────────────────┘ 100%
```

---

## Phase 2: Card Pop-In (Timeline)

```ts
const cardTl = gsap.timeline({
  paused: true,
  onComplete() { reveal.style.height = 'auto'; },
  onReverseComplete() { reveal.style.height = fullHeight + 'px'; },
});

const shuffled = [...cards].sort(() => Math.random() - 0.5);

cardTl.fromTo(shuffled,
  { opacity: 0, scale: 0.8, y: 20 },
  { opacity: 1, scale: 1, y: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.4)' }
);

ScrollTrigger.create({
  trigger: section,
  start: 'top 50%',
  onEnter: () => cardTl.play(),
  onLeaveBack: () => cardTl.reverse(),
});
```

### Timelines

```ts
const tl = gsap.timeline({ paused: true });
```

A **timeline** is a container for sequenced animations. Unlike standalone tweens, timelines let you:
- Chain multiple animations in order
- Control the whole sequence (play, pause, reverse, seek)
- Add labels for jumping to specific points

Here, `paused: true` means the timeline won't play automatically — we control when it starts.

### The Shuffle Trick

```ts
const shuffled = [...cards].sort(() => Math.random() - 0.5);
```

Instead of cards animating in left-to-right (boring), they're shuffled randomly. Combined with stagger, this creates a natural "popping in" feel where cards appear in a seemingly random order.

**How `sort(() => Math.random() - 0.5)` works:** The sort comparator randomly returns positive or negative, effectively shuffling the array. It's not a perfectly uniform shuffle (use Fisher-Yates for that), but it's good enough for animation ordering.

### Stagger

```ts
{ stagger: 0.12 }
```

**Stagger** adds a delay between each element's animation start. With 5 cards and 0.12s stagger:
- Card 1: starts at 0.00s
- Card 2: starts at 0.12s
- Card 3: starts at 0.24s
- Card 4: starts at 0.36s
- Card 5: starts at 0.48s

Each card takes 0.4s to animate, so they overlap. This creates a cascading "wave" effect rather than all cards appearing at once.

### The `back.out(1.4)` Ease

```ts
ease: 'back.out(1.4)'
```

This is what gives the cards their satisfying "bounce." The `back` ease overshoots the target and springs back:

```
value
  1.0 ─────────── ╭─╮ ───── target
                  ╱   ╲
                 ╱     ╰──
                ╱
  0.0 ─────────╱
              time →
```

The `1.4` parameter controls the overshoot intensity. Higher = more bounce. Default is `1.7`.

Compare common eases:
- `'none'` — linear, robotic
- `'power2.out'` — smooth deceleration, professional
- `'back.out(1.4)'` — playful overshoot, energetic
- `'elastic.out(1, 0.3)'` — springy wobble, fun/cartoonish
- `'bounce.out'` — literal bouncing ball

### The fromTo Properties

```ts
{ opacity: 0, scale: 0.8, y: 20 }    // FROM: invisible, small, shifted down
{ opacity: 1, scale: 1,   y: 0  }    // TO:   visible, full size, in place
```

This combination creates a "pop up and in" effect:
1. Cards start invisible, 80% size, and 20px below their final position
2. They fade in, scale up to 100%, and slide up to their natural position
3. The `back.out` ease makes them slightly overshoot (scale briefly past 1.0)

### Reversibility

```ts
onEnter: () => cardTl.play(),
onLeaveBack: () => cardTl.reverse(),
```

If the user scrolls back up, `onLeaveBack` fires and the timeline **reverses** — cards pop back out in reverse order. This creates a polished feel where animations aren't "one and done."

**`onComplete` / `onReverseComplete`:**
```ts
onComplete() { reveal.style.height = 'auto'; },
onReverseComplete() { reveal.style.height = fullHeight + 'px'; },
```

After cards finish appearing, the container height is set to `auto` so it can respond to layout changes (window resize, etc.). When reversed, it goes back to the fixed pixel value so the scroll-driven height animation can take over again.

---

## Arrow Scroll Handlers

```ts
function updateArrows() {
  const overflows = container.scrollWidth > container.clientWidth;
  leftBtn.style.display = overflows ? 'flex' : 'none';
  rightBtn.style.display = overflows ? 'flex' : 'none';
}

leftBtn.addEventListener('click', () =>
  container.scrollBy({ left: -340, behavior: 'smooth' })
);
rightBtn.addEventListener('click', () =>
  container.scrollBy({ left: 340, behavior: 'smooth' })
);
```

This isn't GSAP — it's vanilla JS. The arrows only show when there are more cards than fit in the viewport (`scrollWidth > clientWidth`). Click scrolls by 340px (roughly one card width) using native smooth scrolling.

**Real-world example:** Netflix's content rows, Spotify's album carousels, and YouTube's recommendation shelves all use this pattern — horizontal scroll with arrow navigation and overflow detection.

---

## Duplicate Prevention

```ts
if ((section as HTMLElement).dataset.relatedInited === '1') return;
(section as HTMLElement).dataset.relatedInited = '1';
```

A `data-related-inited` attribute acts as a guard against running the init function twice. This can happen with:
- Astro view transitions re-executing scripts
- Hot module replacement during development
- Race conditions with multiple event listeners

**Pattern:** Use a data attribute on the DOM element as a "has this been initialized?" flag. Check it at the top of your init function and bail early if already done.
