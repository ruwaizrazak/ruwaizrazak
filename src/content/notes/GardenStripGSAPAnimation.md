---
title: 'How I Animated the Garden Strip with GSAP'
description: 'A walkthrough of the GSAP-powered garden strip animation on this site — scroll-driven curves, procedural grass, and a character that walks on its own.'
pubDate: 'Mar 08 2026'
tags: ['tech', 'learning', 'animation']
featured: false
maturity: 'seed'
publish: false
---

# How I Animated the Garden Strip with GSAP

If you've scrolled through this site, you've probably noticed the black strip at the bottom with grass, trees, flowers, and a tiny character that walks around. That whole thing is powered by GSAP and a fair amount of math I didn't know I'd need.

This post is me documenting what I learned while building it, the concepts, the gotchas, and the code that makes it tick. I'm writing this mostly for future me, but if you're trying to learn GSAP or build something similar, I hope this helps.

## What is GSAP?

GSAP (GreenSock Animation Platform) is a JavaScript animation library. Think of it as a way to move things on screen with precise control over timing, easing, and sequencing. It's been around for a long time and it's battle tested.

There are really only two core methods you need to understand first. Everything else builds on top of these:

```typescript
import gsap from 'gsap';

// Instantly set properties (no animation)
gsap.set('.box', { x: 100, opacity: 0.5 });

// Animate to new values over time
gsap.to('.box', { x: 300, duration: 1, ease: 'power2.out' });
```

### gsap.set() — The Teleport

`gsap.set()` is like saying "put this here, right now." No transition, no animation. It just moves the element instantly.

You might wonder, why not just use `element.style.transform = ...` directly? Two reasons:
1. GSAP keeps an internal record of where things are. Later, when you call `gsap.getProperty(element, 'x')`, it knows the current value. Plain CSS doesn't give you that.
2. GSAP handles cross-browser transforms cleanly. Setting `x`, `y`, `rotation`, `scale` separately without worrying about transform string concatenation is a relief.

```typescript
// These are equivalent, but GSAP tracks the values for you:
gsap.set(character, { x: 100, y: 50 });

// vs raw CSS (GSAP won't know about this):
character.style.transform = 'translate(100px, 50px)';
```

### gsap.to() — The Animation

`gsap.to()` says "go from wherever you are now, to these values, over this duration."

```typescript
gsap.to('.box', {
  x: 300,           // where to go
  duration: 1,      // how long (seconds)
  ease: 'power2.out' // how it accelerates/decelerates
});
```

The `ease` parameter is worth understanding. It controls the *feel* of the motion:

- `'none'` — constant speed, like a conveyor belt. Good for walking characters.
- `'power2.out'` — starts fast, slows down at the end. Like rolling a ball that gradually stops.
- `'power2.in'` — starts slow, speeds up. Like a car accelerating.
- `'power2.inOut'` — slow start, fast middle, slow end. Feels natural for UI transitions.
- `'elastic'` — overshoots and bounces. Fun but use sparingly.

The naming pattern: `power1` is gentle, `power4` is dramatic. The suffix (`.in`, `.out`, `.inOut`) controls which end gets the easing. I think of `.out` as "ease into the landing" — the end is smooth.

### gsap.to() returns a Tween

This is important and I didn't realize it at first. `gsap.to()` returns a *tween object* that you can control:

```typescript
const tween = gsap.to('.box', { x: 300, duration: 2 });

tween.kill();     // stop it immediately
tween.pause();    // pause it
tween.resume();   // continue from where it paused
tween.progress(); // how far along (0 to 1)
```

I used `tween.kill()` heavily in the character movement. Every time the scroll target changes, I kill the old tween and create a new one. Without this, you'd have two animations fighting over the same element, and it looks terrible.

### gsap.getProperty() — Reading Current Values

When GSAP is animating something, you need GSAP to tell you where it currently is:

```typescript
const currentX = gsap.getProperty(character, 'x') as number;
```

This gives you the live value mid-animation. If the character is tweening from x=100 to x=400 and you check halfway, you'd get ~250. This is essential for calculating distances, which I'll get to in the character section.

## ScrollTrigger: Tying Animation to Scroll

This is where things got exciting for me. GSAP has a plugin called ScrollTrigger that lets you fire or drive animations based on scroll position.

```typescript
import ScrollTrigger from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
```

You always need to register plugins before using them. I forgot this once and spent an embarrassing amount of time wondering why nothing worked. GSAP doesn't throw an error, it just silently does nothing.

### Understanding start and end

Every ScrollTrigger needs to know *when* to activate. That's what `start` and `end` define:

```typescript
ScrollTrigger.create({
  trigger: '.some-section',
  start: 'top center',
  end: 'bottom top',
});
```

The format is `'[trigger position] [viewport position]'`. So `'top center'` means "when the **top** of the trigger element reaches the **center** of the viewport."

Here's a mental model that helped me:

```
Viewport (what you see on screen):
┌──────────────────────┐  ← 'top' of viewport
│                      │
│                      │  ← 'center' of viewport
│                      │
└──────────────────────┘  ← 'bottom' of viewport

Trigger element (somewhere in the page):
┌──────────────────────┐  ← 'top' of trigger
│    .some-section     │
└──────────────────────┘  ← 'bottom' of trigger
```

So `start: 'top center'` fires when you scroll enough that the top edge of `.some-section` aligns with the middle of your screen.

You can also use pixel offsets: `start: 'top 80%'` means "when the top of the trigger reaches 80% down the viewport."

### Two Flavors of ScrollTrigger

There are two fundamentally different ways to use ScrollTrigger, and confusing them caused me bugs. Let me be explicit:

**Flavor 1: Event-based** — "Do something when I scroll past a point"

```typescript
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

This fires once when you cross a threshold. It's like a tripwire. I used this for the sticky nav bar — show it when the cards section enters view, hide it when you scroll back up.

The four callbacks: `onEnter` (scrolling down past start), `onLeave` (scrolling down past end), `onEnterBack` (scrolling up past end), `onLeaveBack` (scrolling up past start).

**Flavor 2: Scrub-based** — "Drive a value continuously as I scroll"

```typescript
ScrollTrigger.create({
  trigger: '.intro-section',
  start: 'top top',
  end: 'bottom top',
  scrub: true,
  onUpdate(self) {
    const p = self.progress; // 0 at start, 1 at end
  },
});
```

With `scrub: true`, `onUpdate` fires continuously as you scroll. `self.progress` gives you a value from 0 to 1 representing how far through the scroll range you are.

This is the powerful one. You can map that 0-to-1 progress to *anything*:

```typescript
// progress 0 → height 220, progress 1 → height 30
const height = 220 - 190 * p;

// progress 0 → opacity 1, progress 1 → opacity 0
const opacity = 1 - p;

// progress 0 → curve radius 110, progress 1 → curve radius 0
const curveB = 110 * (1 - p);
```

The formula is always: `startValue + (endValue - startValue) * progress`. Or if you're going from high to low: `startValue * (1 - progress)`.

**The critical rule: use `gsap.set()` inside scrub, not `gsap.to()`.**

Since scroll is already driving the animation frame-by-frame, you just need to *set* values at each point. If you used `gsap.to()`, you'd be creating a new animation every scroll frame that fights with the scroll position. I made this mistake early on — the strip would lag behind the scroll and overshoot. Switching to `gsap.set()` fixed it instantly.

```typescript
// CORRECT — set values directly from progress
onUpdate(self) {
  gsap.set('.garden-strip', { height: 220 - 190 * self.progress });
}

// WRONG — creates competing animations
onUpdate(self) {
  gsap.to('.garden-strip', { height: 220 - 190 * self.progress, duration: 0.3 });
}
```

### scrub: true vs scrub: 1

There's a subtle but useful difference:

- `scrub: true` — animation follows scroll exactly, frame by frame. No smoothing.
- `scrub: 1` — animation follows scroll with 1 second of smoothing/lag. Feels softer.

I used `scrub: true` for the strip morphing (I wanted it to feel locked to scroll) and initially used `scrub: 1` for the character (to add slight lag). But later I removed scrub entirely for the character and went with a different approach, which I'll explain below.

### Referencing ScrollTriggers by ID

You can give a ScrollTrigger an `id` and reference it from elsewhere. This was essential for my setup because two ScrollTriggers need to share state:

```typescript
// Create with an ID
ScrollTrigger.create({
  id: 'intro-strip',
  trigger: '.intro-section',
  // ...
});

// Read its progress from anywhere
const introTrigger = ScrollTrigger.getById('intro-strip');
const b = introTrigger ? B_MAX * (1 - introTrigger.progress) : B_MAX;
```

The character's ScrollTrigger reads the intro trigger's progress to know how flat the curve currently is. Without this, the character wouldn't know the curve shape and would float in the wrong position.

## The Elliptical Curve Math

The garden strip has an elliptical curve at the top. Everything, the trees, flowers, grass, and character, needs to sit *on* this curve. The math is simpler than it looks.

### How an Ellipse Works

An ellipse is like a squished circle. It has two radii: horizontal (`a`) and vertical (`b`). In our case, `a` is half the strip width (so the curve spans the full screen) and `b` controls how tall the bump is.

The standard ellipse equation is: `y = b * sqrt(1 - (x/a)^2)`

But we need to flip it because we want the curve to go *up* from the strip (lower y values mean higher on screen). Here's the actual code:

```typescript
export function curveY(x: number, stripWidth: number, b: number): number {
  if (stripWidth <= 0 || b <= 0) return 0;
  const t = 2 * (x / stripWidth) - 1; // normalize x to -1..1
  const inner = 1 - t * t;
  return inner <= 0 ? b : b * (1 - Math.sqrt(inner));
}
```

Let me walk through what each line does:

1. **`const t = 2 * (x / stripWidth) - 1`** — converts the x position (0 to stripWidth) into a range of -1 to 1. At the left edge, t = -1. At center, t = 0. At right edge, t = 1. This centers the ellipse.

2. **`const inner = 1 - t * t`** — this is the `1 - (x/a)^2` part of the ellipse equation. At the center (t=0), inner = 1. At the edges (t=±1), inner = 0.

3. **`b * (1 - Math.sqrt(inner))`** — at the center, sqrt(1) = 1, so y = 0 (highest point). At the edges, sqrt(0) = 0, so y = b (lowest point). This gives us a curve that's highest in the middle.

The beauty of parameterizing with `b` is that during scroll, I animate `b` from 110 to 0. When b = 0, curveY returns 0 for everything — the curve is flat. When b = 110, you get a big hill shape.

```
b = 110 (start of page):           b = 0 (after scrolling):
         ___                        ___________________
       /     \
     /         \
   /             \
  /               \
```

### Positioning Elements on the Curve

Once you have `curveY()`, placing elements is straightforward:

```typescript
export function positionAlongCurve(strip, b, selector) {
  const w = strip.offsetWidth;
  const elements = strip.querySelectorAll(selector);
  const n = elements.length;

  elements.forEach((el, i) => {
    const x = ((i + 1) / (n + 1)) * w;  // evenly space across width
    const y = curveY(x, w, b);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translate(-50%, -100%)';
  });
}
```

The spacing formula `(i + 1) / (n + 1)` distributes elements evenly *with padding* at both edges. For 3 elements across a 900px strip: positions would be at 225px, 450px, 675px. If I used `i / (n - 1)` instead, the first and last elements would sit exactly at the edges, which looked cramped.

The `translate(-50%, -100%)` is a CSS trick to anchor elements from their bottom-center point. Without it, the top-left corner of each tree would be on the curve, making everything look like it's floating above the line instead of growing from it.

## The Character: Walk, Run, and Idle

This is the part that went through the most iterations and where I learned the most. The character is a CSS sprite sheet with two rows: walk cycle (top) and run cycle (bottom), each with 9 frames.

### How Sprite Sheets Work

A sprite sheet is a single image containing all animation frames side by side. Instead of loading 9 separate images and swapping them, you load one image and shift which portion is visible. It's like a film strip — you move the strip behind a window to show different frames.

The container acts as the window:

```css
.character-sprite {
  width: 28.2px;        /* window width — shows exactly one frame */
  height: 50px;         /* window height */
  background-image: url('/siteAssets/characterSpriteSheet.png');
  background-size: 900% 200%;  /* scale: 9 columns, 2 rows */
  background-position: 0 0;    /* start at first frame, first row */
  background-repeat: no-repeat;
}
```

`background-size: 900% 200%` is the key. It means "make the background image 9 times wider and 2 times taller than the container." Since the container is 28.2px wide, the image becomes 253.8px wide — and since the sheet has 9 frames, each frame ends up exactly 28.2px wide in the container. Same logic vertically: 2 rows at 50px each = 100px.

### Why steps() Matters

CSS has an `animation-timing-function` called `steps()` that was basically designed for sprite sheets:

```css
@keyframes sprite-walk {
  to { background-position-x: -254px; }
}

.character[data-motion="walk"] .character-sprite {
  animation: sprite-walk 1s steps(9) infinite;
}
```

Without `steps(9)`, the background would slide smoothly from 0 to -254px. You'd see the character's body smearing across the screen — two half-frames blending together. It looks broken.

`steps(9)` divides the animation into exactly 9 discrete jumps:

```
Without steps (smooth — BAD for sprites):
Frame: |=============================>|
        sliding continuously...

With steps(9) (snapping — GOOD for sprites):
Frame: |--|--|--|--|--|--|--|--|--|
        0  1  2  3  4  5  6  7  8
        Each jump = -28.2px
```

Each step snaps `background-position-x` by exactly one frame width. Frame 0 at 0px, frame 1 at -28.2px, frame 2 at -56.4px, and so on.

### The Percentage Trap (A Bug That Taught Me a Lot)

I initially wrote the keyframe like this:

```css
/* DON'T DO THIS */
@keyframes sprite-walk {
  to { background-position-x: 100%; }
}
```

This looked logical — go from 0% to 100% of the image. But I was seeing the character double up on the last frame, like two characters overlapping.

The problem: CSS `background-position` percentages don't mean what you'd think. `background-position-x: 100%` means "align the **right edge** of the background image with the **right edge** of the container." It does NOT mean "shift the image by its full width."

Think of it this way:

```
Container:  [    ]     (28.2px wide)
Image:      [1][2][3][4][5][6][7][8][9]   (253.8px wide)

position: 0%   → [1] is visible (left edges align)
position: 100% → [9] is visible (right edges align)

The total shift is only (253.8 - 28.2) = 225.6px, not 253.8px!
```

With `steps(9)` dividing this 225.6px shift into 9 steps, each step is 25.07px — but each frame is actually 28.2px wide. The steps don't land on frame boundaries. Hence the double-image glitch.

The fix: use pixel values. They mean exactly what they say.

```css
/* DO THIS */
@keyframes sprite-walk {
  to { background-position-x: -254px; }  /* 9 × 28.2 ≈ 254px */
}
```

Now each of the 9 steps is exactly 28.2px. Every frame lands perfectly.

### Two Rows: Walk and Run

The sprite sheet has two rows. The walk cycle is on top (y = 0) and the run cycle is below (y = -50px, since each row is 50px tall).

```css
/* Walk: row 1 (top) */
@keyframes sprite-walk {
  to { background-position-x: -254px; }
}

/* Run: row 2 (bottom) — notice both x AND y are set */
@keyframes sprite-run {
  from { background-position: 0 -50px; }
  to { background-position: -254px -50px; }
}
```

For the walk, I only animate `background-position-x` because `background-position-y` stays at 0 (default). For the run, I need to explicitly set y to -50px in both `from` and `to`, otherwise it would snap to row 1 at the start of each loop.

The run animation plays faster (0.6s vs 1s) because, well, running is faster than walking:

```css
.character[data-motion="walk"] .character-sprite {
  animation: sprite-walk 1s steps(9) infinite;
  background-position-y: 0;
}

.character[data-motion="run"] .character-sprite {
  animation: sprite-run 0.6s steps(9) infinite;
}
```

### Data Attributes as State

I'm using HTML data attributes to manage character state:

```html
<div class="character" data-motion="idle" data-facing-right="true">
  <div class="character-sprite"></div>
</div>
```

Three states for `data-motion`: `idle`, `walk`, `run`. CSS selects the right animation based on the attribute value. JS just sets the attribute and CSS reacts:

```typescript
// JS side — just set the state
character.dataset.motion = 'walk';    // triggers walk animation
character.dataset.motion = 'run';     // triggers run animation
character.dataset.motion = 'idle';    // shows static idle frame
character.dataset.facingRight = 'false'; // flips sprite
```

```css
/* CSS side — reacts to state */
.character[data-motion="walk"] .character-sprite { /* walk animation */ }
.character[data-motion="run"] .character-sprite { /* run animation */ }
.character[data-motion="idle"] .character-sprite { /* static frame */ }

.character[data-facing-right="false"] .character-sprite {
  transform: scaleX(-1);  /* mirror horizontally */
}
```

I like this pattern because it creates a clean separation. JS handles the logic ("should the character walk or run?"), CSS handles the visuals ("what does walking look like?"). Neither needs to know the details of the other.

### The Idle Frame

When the character isn't moving, I show a specific frame from the walk row. This is controlled via a CSS custom property:

```typescript
const IDLE_FRAME = 2; // 0-indexed, so the 3rd frame
character.style.setProperty('--idle-frame', String(IDLE_FRAME));
```

```css
.character[data-motion="idle"] .character-sprite {
  background-position-x: calc(var(--idle-frame, 0) * -28.2px);
  background-position-y: 0;  /* always from walk row */
}
```

The math: frame 2 at 28.2px per frame = `2 * -28.2 = -56.4px`. That shifts the background to show the third frame. Using a CSS variable means I can change the idle pose from JS without touching the stylesheet.

### Walk vs Run: Distance-Based Decision

This is the part where `gsap.set()` and `gsap.to()` work together, each doing what it's best at.

Instead of directly tying the character to scroll position (which felt robotic — the character would teleport), I made the scroll define a *target* position and let the character walk or run toward it independently.

```typescript
const RUN_THRESHOLD = 150; // px — if target is further than this, run
const WALK_SPEED = 200;    // px per second
const RUN_SPEED = 400;     // px per second
```

Here's the full logic, annotated:

```typescript
ScrollTrigger.create({
  trigger: '.garden-cards-section',
  start: 'top 50%',
  end: 'bottom bottom',

  // NOTE: no 'scrub' here! Scroll sets the target,
  // but the character moves independently via gsap.to()
  onUpdate(self) {
    const p = self.progress;
    const vw = window.innerWidth;

    // Where the character SHOULD be based on scroll
    const targetX = 10 + p * (vw - 110);

    // Where the character ACTUALLY is right now
    const currentX = gsap.getProperty(character, 'x') as number;
    const distance = Math.abs(targetX - currentX);

    // Dead zone: ignore tiny movements (prevents jitter)
    if (distance < 5) return;

    // Face the direction of travel
    character.dataset.facingRight = String(targetX > currentX);

    // Pick walk or run based on how far away the target is
    const isRunning = distance > RUN_THRESHOLD;
    character.dataset.motion = isRunning ? 'run' : 'walk';

    // IMPORTANT: kill any existing tween before creating a new one
    if (walkTween) walkTween.kill();

    // Calculate duration from distance and speed
    // Clamped: minimum 0.3s (never too fast), maximum 2s (never too slow)
    const speed = isRunning ? RUN_SPEED : WALK_SPEED;
    const duration = Math.max(0.3, Math.min(2, distance / speed));

    // Create the movement tween
    walkTween = gsap.to(character, {
      x: targetX,
      duration,
      ease: 'none',  // linear — walking has constant speed

      // While moving: keep y position on the curve
      onUpdate() {
        const cx = gsap.getProperty(character, 'x') as number;
        gsap.set(character, {
          y: curveY(20 + cx, vw, b) - CHAR_HEIGHT
        });
      },

      // When arrived: stop walking, go idle
      onComplete() {
        character.dataset.motion = 'idle';
        walkTween = null;
      },
    });
  },
});
```

Let me highlight the patterns that took me a while to internalize:

**The dead zone (`distance < 5`)**. Without this, tiny scroll movements create micro-tweens that make the character jitter. 5px is small enough to be invisible but large enough to filter out noise.

**`ease: 'none'` for walking**. I tried `'power2.inOut'` first and it felt wrong — the character would slow down before reaching the target, like they were cautiously approaching. Linear movement (`'none'`) feels like actual walking at a steady pace.

**Duration from distance**. `distance / speed` gives you the time in seconds. 200 pixels at 200px/s = 1 second. The `Math.max(0.3, Math.min(2, ...))` clamp prevents extremes — too fast looks like teleporting, too slow feels sluggish.

**`onUpdate` inside the tween is different from `onUpdate` on the ScrollTrigger**. The ScrollTrigger's `onUpdate` fires on scroll. The tween's `onUpdate` fires on every animation frame *of the tween*. This is where I use `gsap.set()` to keep the character's Y position glued to the curve as it walks horizontally.

**Why `gsap.set()` for Y but `gsap.to()` for X?** Because X is the thing being animated over time (the walk). Y is a *derived* value — it's always a function of X and the curve. You don't animate Y independently; you *calculate* it from the current X and set it immediately.

## Procedural Grass with Canvas

The grass isn't an image, it's drawn procedurally on a `<canvas>` element. Each blade follows the curve and uses seeded randomness so it looks the same every frame.

### Why Canvas Instead of SVG or Images?

I initially used an SVG for the grass. The problem was, the grass needed to follow an elliptical curve that changes shape during scroll. A static SVG can't do that. I'd need to regenerate the SVG on every scroll frame, which is awkward.

Canvas is built for this — you clear it and redraw every frame. It's fast and gives you full control over each blade's shape, position, and color.

### Seeded Randomness

Here's a trick that was new to me. Grass blades need to look random (different heights, angles, widths), but if you use `Math.random()`, you'd get different blades on every redraw. During scroll, the grass would shimmer and flicker chaotically because each frame generates new random values.

The solution is a seeded random function:

```typescript
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}
```

Give it the same seed and it returns the same "random" number every time. `seededRandom(42)` always returns 0.6548... no matter how many times you call it.

I derive seeds from the blade's position:

```typescript
for (let x = 0; x < stripWidth; x += 4) {
  const bladeCount = 2 + Math.floor(seededRandom(x * 0.73) * 2);

  for (let j = 0; j < bladeCount; j++) {
    const seed = x * 13.7 + j * 47.3;
    const bladeHeight = 6 + seededRandom(seed) * 9;
    const lean = (seededRandom(seed + 1) - 0.5) * 0.4;
    const width = 1.5 + seededRandom(seed + 2) * 2.5;
    // ...
  }
}
```

The blade at x=100 always has the same height, lean, and width, whether it's the first draw or the hundredth. The numbers `13.7`, `47.3`, `127.1`, `43758.5453` are just magic constants that produce well-distributed outputs — they're common in shader programming.

### Drawing Each Blade

Each blade is a leaf-like shape using quadratic bezier curves:

```typescript
// Calculate tip position using angle from curve normal
const tipX = x + Math.cos(bladeAngle) * bladeHeight;
const tipY = baseY + Math.sin(bladeAngle) * bladeHeight;

// Control point for the curve (60% up the blade)
const cpX = x + Math.cos(bladeAngle + lean * 0.5) * bladeHeight * 0.6;
const cpY = baseY + Math.sin(bladeAngle + lean * 0.5) * bladeHeight * 0.6;

ctx.beginPath();
ctx.moveTo(x - width / 2, baseY);            // base left
ctx.quadraticCurveTo(cpX, cpY, tipX, tipY);  // left side curves to tip
ctx.quadraticCurveTo(cpX + width * 0.3, cpY, x + width / 2, baseY); // right side back
ctx.closePath();
ctx.fill();
```

A `quadraticCurveTo` takes a control point and an end point. The control point "pulls" the curve toward it, creating the gentle bend of a grass blade. Two of these back-to-back create a leaf shape — wider at the base, narrowing to a tip.

The `baseY` comes from `curveY()`, so blades grow from the elliptical curve's surface. The angle comes from `curveNormalAngle()`, which calculates the perpendicular direction at that point on the curve. This means blades at the edges of the strip lean outward, not just straight up — it looks far more natural.

### DPI Scaling

One gotcha with Canvas: on retina displays, everything looks blurry unless you account for device pixel ratio:

```typescript
export function sizeGrassCanvas(canvas, ctx, stripWidth) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = stripWidth * dpr;       // actual pixels
  canvas.height = CANVAS_H * dpr;
  canvas.style.width = `${stripWidth}px`; // CSS display size
  canvas.style.height = `${CANVAS_H}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);                   // scale drawing commands
}
```

The trick: make the canvas element larger (by dpr multiplier), but display it at the normal size via CSS. Then scale the drawing context so your drawing code uses the same coordinates as before. On a 2x display, the canvas is actually 2x the pixels, giving you sharp rendering.

## Cleanup and Re-initialization

Because this site uses Astro's View Transitions, pages don't fully reload. That means old ScrollTriggers persist and pile up. Every time you navigate to a new page and back, a new set of triggers would be added on top of the old ones.

The fix: kill everything at the start of initialization:

```typescript
ScrollTrigger.getAll().forEach(st => st.kill());
```

And recalculate all positions at the end:

```typescript
ScrollTrigger.refresh();
```

`refresh()` tells ScrollTrigger to re-measure all trigger elements and recalculate when they should fire. Without this, the triggers might use stale measurements from before the page transition.

The initialization runs on multiple events to cover all navigation patterns:

```typescript
document.addEventListener('DOMContentLoaded', init);    // first page load
document.addEventListener('astro:page-load', init);     // Astro view transitions
window.addEventListener('pageshow', init);              // browser back/forward
```

Each event covers a different way the user might arrive at the page. `DOMContentLoaded` is the classic one. `astro:page-load` is Astro-specific, it fires after a view transition completes. `pageshow` catches the case where the browser restores a page from its back-forward cache.

## Putting It All Together

Here's the full flow of what happens when you scroll through this site:

1. **Page loads** → `initGarden()` runs, kills old triggers, creates new ones, places everything on the initial curve.

2. **Scrolling through intro** → The `intro-strip` ScrollTrigger fires continuously. Progress goes from 0 to 1. The strip height shrinks (220 → 30px), the curve flattens (b: 110 → 0), the description fades out. All plants, trees, flowers, and grass are repositioned every frame.

3. **Reaching the cards section** → The character's ScrollTrigger activates. It calculates a target X position from scroll progress. If the target is far (>150px), the character runs. If close, it walks. A `gsap.to()` tween moves the character toward the target at a constant speed. During the tween, `onUpdate` keeps the character's Y glued to the curve.

4. **Stopping scroll** → The character finishes its walk/run tween, `onComplete` fires, motion state goes to `idle`, and the sprite shows the static idle frame.

5. **Scrolling backward** → Same logic but `facingRight` becomes `false`, the sprite flips via `scaleX(-1)`, and the character walks/runs left.

## What I Learned

Building this taught me a few things that I think apply beyond just this project:

1. **`gsap.set()` vs `gsap.to()` is the most important distinction.** Use `set` when something else (like scroll) is driving the value frame by frame. Use `to` when you want the animation to run independently over time. Mixing these up is the source of most GSAP bugs I hit.

2. **Pixel values over percentages for sprite sheets.** CSS `background-position` percentages are genuinely misleading. `100%` doesn't mean what you think it means. Pixel values are predictable and debuggable. I learned this the hard way.

3. **Kill your tweens.** If you're creating new tweens in a scroll handler or any rapid-fire event, always kill the previous one first. Competing tweens on the same property cause jittery, unpredictable movement.

4. **Seeded randomness is how you make procedural things look stable.** Any time you're generating visuals procedurally and redrawing them (canvas, WebGL, etc.), `Math.random()` will cause flickering. A seeded function gives you the same "random" output for the same input, every time.

5. **Data attributes as state keeps JS and CSS responsibilities clean.** JS decides *what* state the character is in. CSS decides *how* each state looks. Neither needs to know the details of the other. It's a simple pattern but it scales well.

6. **Derive values, don't animate them independently.** The character's Y position isn't animated — it's calculated from X and the curve function. Anytime a value is a function of another, calculate it rather than trying to animate it separately. Two independent animations rarely stay in sync.

The garden strip started as a simple idea, a decorative bar at the bottom, and turned into the most technically interesting part of this site. Every layer, the curve math, the canvas grass, the sprite animation, the scroll-driven morphing, taught me something I didn't know before. And that's exactly why I build things.
