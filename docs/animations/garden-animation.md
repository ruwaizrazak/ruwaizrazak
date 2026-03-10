# Garden Animation

**File:** `src/scripts/garden/gardenAnimation.ts`

The garden page features an interactive curved strip with plants, trees, flowers, procedural grass, and a character that walks/runs along the curve as the user scrolls. This is the most complex animation in the project.

---

## Table of Contents

1. [Setup & Plugin Registration](#setup--plugin-registration)
2. [Responsive Scaling](#responsive-scaling)
3. [Strip Shrink & Curve Flatten (Scroll-Driven)](#strip-shrink--curve-flatten)
4. [Sticky Bar Visibility](#sticky-bar-visibility)
5. [Character Walking Along the Curve](#character-walking-along-the-curve)
6. [Curve Math (curveUtils)](#curve-math-curveutils)
7. [Procedural Grass (grassCanvas)](#procedural-grass-grasscanvas)

---

## Setup & Plugin Registration

Every GSAP animation file in this project follows the same boilerplate:

```ts
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
```

**Why `registerPlugin`?** GSAP uses a modular architecture. ScrollTrigger is a separate plugin that hooks into GSAP's core. You must register it before using any `scrollTrigger` config in your animations. If you skip this, ScrollTrigger silently does nothing.

**Real-world analogy:** Think of it like plugging in a USB device. GSAP is the computer, ScrollTrigger is the device. You need to "plug it in" (register) before it works.

---

## Responsive Scaling

```ts
const BASE_HEIGHT = 220;
const BASE_B = 110;

function getScale(): number {
  return Math.min(BASE_HEIGHT, window.innerHeight * 0.5) / BASE_HEIGHT;
}
```

The garden strip is designed for a base height of 220px. On smaller viewports (where 50% of the screen height is less than 220), everything scales down proportionally.

**How it works:**
- On a 900px tall screen: `Math.min(220, 450) / 220 = 1.0` (full size)
- On a 400px tall screen: `Math.min(220, 200) / 220 = 0.91` (slightly smaller)

This scale factor (`s`) is then applied to:
- The strip height: `BASE_HEIGHT * s`
- The curve radius: `BASE_B * s`
- The character height: `BASE_CHAR_HEIGHT * s`

**Real-world example:** This is the same technique responsive games use. Instead of writing media queries for every element, you calculate one scale factor and multiply everything by it.

---

## Strip Shrink & Curve Flatten

This is the hero animation of the garden page. As the user scrolls past the intro section, the curved green strip shrinks and flattens:

```ts
ScrollTrigger.create({
  id: 'intro-strip',
  trigger: '.intro-section',
  start: 'top top',
  end: 'bottom top',
  scrub: true,
  onUpdate(self) {
    const p = self.progress; // 0 at start, 1 at end

    gsap.set('.garden-strip', {
      height: baseH - (baseH - minH) * p,
      borderRadius: `${50 * (1 - p)}% ${50 * (1 - p)}% 0 0 / ${bMax * (1 - p)}px ...`,
    });

    gsap.set('.garden-description', { opacity: 1 - p });
  },
});
```

### Key Concepts

**`scrub: true`** — This is the magic. Instead of playing the animation once, `scrub` ties the animation progress directly to scroll position. Scroll halfway = animation is 50% complete. Scroll back up = animation reverses. It makes the animation feel like the user is "controlling" it with their scroll.

**`self.progress`** — A value from 0 to 1 representing how far through the scroll range you are. We use this to interpolate between start and end values.

**`gsap.set()` vs `gsap.to()`** — `set()` applies values immediately (no animation). We use `set()` here because ScrollTrigger is already providing the "animation" through scroll progress. We just need to update the values at each scroll frame.

**`start: 'top top'`** — Means "when the TOP of the trigger element reaches the TOP of the viewport". The format is always `'triggerPosition viewportPosition'`.

**`end: 'bottom top'`** — Means "when the BOTTOM of the trigger reaches the TOP of the viewport" (i.e., the element has fully scrolled past).

**The border-radius trick:**

```
borderRadius: 50% 50% 0 0 / 110px 110px 0 0
```

This creates an elliptical curve on the top edge of the strip. The `/` separates horizontal and vertical radii. As `p` goes from 0 to 1, both values shrink to 0, making the curve flatten into a straight line.

**Real-world example:** Think of Apple's product pages where a hero image scales, fades, or transforms as you scroll. The same technique — `scrub: true` + `onUpdate` — powers those effects.

---

## Sticky Bar Visibility

```ts
ScrollTrigger.create({
  trigger: '.garden-cards-section',
  start: 'top center',
  end: 'top top',
  onEnter: () => {
    stickyBar.classList.remove('opacity-0', 'pointer-events-none');
    stickyBar.classList.add('opacity-100');
  },
  onLeaveBack: () => {
    stickyBar.classList.add('opacity-0', 'pointer-events-none');
    stickyBar.classList.remove('opacity-100');
  },
});
```

This uses ScrollTrigger as a **scroll-position detector** rather than an animation driver. No `scrub`, no `gsap.to()` — just callbacks.

**`onEnter`** fires when you scroll INTO the trigger zone. **`onLeaveBack`** fires when you scroll BACK OUT of it (upward). Together they create a toggle: show the sticky bar when cards are visible, hide it when you scroll back up.

**Why CSS classes instead of GSAP?** The sticky bar uses Tailwind's `opacity-0` / `opacity-100` and CSS transitions. Since the transition is a simple binary toggle (not scroll-driven), CSS handles it more cleanly.

**Real-world example:** This pattern is everywhere — navigation bars that appear/disappear based on scroll position, "back to top" buttons, floating action buttons.

---

## Character Walking Along the Curve

The most creative animation: a sprite character that walks or runs along the garden's curved strip as you scroll through the cards section.

```ts
ScrollTrigger.create({
  trigger: '.garden-cards-section',
  start: 'top 50%',
  end: 'bottom bottom',
  onUpdate(self) {
    const p = self.progress;
    const targetX = 10 + p * (vw - 110); // left edge → right edge

    const currentX = gsap.getProperty(character, 'x') as number;
    const distance = Math.abs(targetX - currentX);

    if (distance < 5) return; // dead zone to prevent jitter

    // Choose walk or run based on how far behind the character is
    character.dataset.facingRight = String(targetX > currentX);
    const isRunning = distance > RUN_THRESHOLD; // 250px
    character.dataset.motion = isRunning ? 'run' : 'walk';

    if (walkTween) walkTween.kill(); // cancel previous animation

    const speed = isRunning ? RUN_SPEED : WALK_SPEED;
    const duration = Math.max(0.3, Math.min(2, distance / speed));

    walkTween = gsap.to(character, {
      x: targetX,
      duration,
      ease: 'none',
      onUpdate() {
        // Keep character on the curve as it moves horizontally
        const cx = gsap.getProperty(character, 'x') as number;
        gsap.set(character, {
          y: curveY(20 + cx, vw, b) - charHeight,
        });
      },
      onComplete() {
        character.dataset.motion = 'idle';
      },
    });
  },
});
```

### How it works, step by step

1. **Scroll progress maps to a target X position.** At 0% scroll, the character should be at the left. At 100%, at the right.

2. **Dead zone.** If the character is already within 5px of the target, do nothing. This prevents micro-jittering from tiny scroll events.

3. **Walk vs run.** If the character needs to cover more than 250px, it runs (faster sprite animation). Otherwise it walks. This is set via `data-motion` attributes that CSS uses to switch sprite sheet animations.

4. **Kill previous tween.** If the user scrolls again before the character finishes moving, we cancel the old animation and start a fresh one toward the new target. This makes the movement feel responsive.

5. **Duration from distance.** `distance / speed` gives a realistic duration — farther = longer. Clamped between 0.3s and 2s to prevent extremes.

6. **`onUpdate` — stay on the curve.** As the character moves horizontally (`x`), we continuously recalculate its vertical position using `curveY()` so it follows the curved strip surface.

7. **`onComplete` — go idle.** When the character reaches its target, switch back to the idle sprite frame.

**Real-world example:** This is similar to how platformer games work — a character follows terrain geometry. The scroll position acts as a "controller input" that sets where the character should move to.

---

## Curve Math (curveUtils)

**File:** `src/scripts/garden/curveUtils.ts`

### curveY — Point on an ellipse

```ts
export function curveY(x: number, stripWidth: number, b: number): number {
  const t = 2 * (x / stripWidth) - 1; // normalize x to [-1, 1]
  const inner = 1 - t * t;
  return inner <= 0 ? b : b * (1 - Math.sqrt(inner));
}
```

This calculates the Y position on an elliptical curve. The strip's top edge is shaped like the top half of an ellipse.

**The math:**
- An ellipse equation: `(x/a)^2 + (y/b)^2 = 1`
- Solving for y: `y = b * sqrt(1 - (x/a)^2)`
- We normalize x to `[-1, 1]` so the ellipse spans the full strip width
- `b` is the curve height (vertical radius). When `b = 110`, the curve dips 110px. When `b = 0`, it's flat.

**Real-world example:** This is how you'd draw any arch or dome shape in code — the same math that describes the St. Louis Gateway Arch (which is actually a catenary, but close enough!).

### curveNormalAngle — Angle perpendicular to the curve

```ts
export function curveNormalAngle(x: number, w: number, b: number): number {
  const t = 2 * (x / w) - 1;
  const inner = 1 - t * t;
  const dydx = (2 * b / w) * t / Math.sqrt(inner); // derivative
  return Math.atan2(-1, dydx);
}
```

This calculates the angle perpendicular to the curve at any point. Used by the grass canvas to orient grass blades so they point "outward" from the curve surface.

**Why the derivative?** The normal (perpendicular direction) at any point on a curve is rotated 90 degrees from the tangent. The tangent direction is the derivative `dy/dx`. `atan2(-1, dydx)` gives the angle pointing outward.

### positionAlongCurve — Place elements on the curve

```ts
export function positionAlongCurve(strip, b, selector, transform) {
  const elements = strip.querySelectorAll(selector);
  elements.forEach((el, i) => {
    const x = ((i + 1) / (n + 1)) * w; // evenly space along width
    const y = curveY(x, w, b);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = transform;
  });
}
```

Distributes elements (plants, trees, flowers) evenly along the curve. As the curve flattens during scroll, `repositionAll()` is called to move everything to their new positions.

---

## Procedural Grass (grassCanvas)

**File:** `src/scripts/garden/grassCanvas.ts`

### Seeded Random

```ts
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}
```

**Why not `Math.random()`?** Regular random gives different results every call. If we used it, the grass would look different on every frame/redraw, causing visual flickering. A seeded random gives the **same result for the same input**, so the grass is deterministic — it looks the same every time you redraw it.

**The technique:** Multiply the seed by a large prime-like number, take the sine, multiply by another large number, and take the fractional part. This is a common trick from shader programming (GLSL) where you need cheap pseudo-random numbers.

### Drawing Grass Blades

```ts
for (let x = 0; x < stripWidth; x += 4) {
  const baseY = maxBladeH + curveY(x, stripWidth, b);

  for (let j = 0; j < bladeCount; j++) {
    // Each blade has deterministic height, lean, width, color
    ctx.beginPath();
    ctx.moveTo(x - width / 2, baseY);               // blade base left
    ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);      // left edge to tip
    ctx.quadraticCurveTo(cpX + w, cpY, x + w/2, baseY); // tip to base right
    ctx.closePath();
    ctx.fill();
  }
}
```

Every 4 pixels across the strip, 2-3 grass blades are drawn:

1. **Base position** follows the curve using `curveY()`
2. **Blade angle** follows the curve normal using `curveNormalAngle()`, plus some random lean
3. **Shape** is drawn with two quadratic bezier curves (one for each side of the blade), meeting at the tip
4. **Color** is randomly picked from 5 shades of dark green

**Quadratic bezier curves** take 3 points: start, control point, end. The control point "pulls" the curve toward it, creating a natural grass blade shape that's wider at the base and tapers to a point.

```
        tip (end point)
       /
      / <- curve pulled by control point
     /
    /
base (start point)
```

**Real-world example:** This is the same technique used in procedural terrain generation in games. Minecraft's grass, No Man's Sky's flora — they all use some form of seeded randomness + procedural drawing.

---

## Cleanup Pattern

Every animation file kills its own ScrollTriggers before re-initializing:

```ts
ScrollTrigger.getAll().forEach(st => st.kill());
```

This is critical for **Astro view transitions**. When navigating between pages, the old page's ScrollTriggers would otherwise persist and conflict with the new page's animations. Killing them on init ensures a clean slate.
