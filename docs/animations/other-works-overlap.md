# Other Works Overlap Animation

**File:** `src/scripts/other-works-overlap.ts`

The simplest animation in the project — the "Other works" section slides up 200px to overlap the article content above it, creating a layered card-stack effect.

---

## The Full Code

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initOtherWorksOverlap() {
  // Respect accessibility preferences
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Guard against duplicate initialization
  const wrapper = document.querySelector<HTMLElement>('[data-other-works-wrapper]');
  if (!wrapper || wrapper.dataset.overlapInited === '1') return;
  wrapper.dataset.overlapInited = '1';

  gsap.to(wrapper, {
    y: -200,
    ease: 'none',
    scrollTrigger: {
      trigger: wrapper,
      start: 'top bottom',
      end: 'top 60%',
      scrub: true,
    },
  });
}
```

---

## Accessibility: `prefers-reduced-motion`

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
```

This is the **most important line in the file** and should be in every animation file. Some users have a system-level setting that says "I prefer less motion" — this could be due to vestibular disorders, motion sickness, or personal preference.

`window.matchMedia('(prefers-reduced-motion: reduce)')` checks this OS-level setting. If enabled, we skip the animation entirely.

**How to enable it (for testing):**
- **macOS:** System Settings > Accessibility > Display > Reduce Motion
- **iOS:** Settings > Accessibility > Motion > Reduce Motion
- **Windows:** Settings > Accessibility > Visual Effects > Animation Effects
- **Chrome DevTools:** Rendering panel > Emulate CSS media feature `prefers-reduced-motion`

**Real-world rule:** Always respect this preference for:
- Parallax scrolling effects
- Auto-playing animations
- Transitions that involve significant movement

You can skip the check for:
- Hover microinteractions (small, user-initiated)
- Opacity fades (generally safe)
- One-time, small transitions triggered by user action

---

## The Animation

```ts
gsap.to(wrapper, {
  y: -200,
  ease: 'none',
  scrollTrigger: {
    trigger: wrapper,
    start: 'top bottom',
    end: 'top 60%',
    scrub: true,
  },
});
```

As the "Other works" section scrolls into view, it moves up by 200px. This makes it visually overlap the article content above, like a card being pushed up from below.

**`start: 'top bottom'`** — Begins when the section's top enters the viewport.
**`end: 'top 60%'`** — Completes when the section's top reaches 60% of the viewport.

The animation range (from viewport bottom to 60%) is relatively short, meaning the overlap happens quickly as the section enters view.

---

## Patterns Worth Noting

### Data Attribute Guard

```ts
if (!wrapper || wrapper.dataset.overlapInited === '1') return;
wrapper.dataset.overlapInited = '1';
```

Same pattern as related-notes. Prevents double initialization. This is a defensive coding pattern that every animation init function should have.

### Attribute Selector

```ts
document.querySelector<HTMLElement>('[data-other-works-wrapper]');
```

Using `data-*` attributes instead of CSS classes to select animation targets is a good practice:
- **Classes** are for styling and can be renamed during CSS refactors
- **Data attributes** are for JavaScript behavior and signal intent clearly

When someone sees `data-other-works-wrapper` in the HTML, they know JavaScript is targeting it. When they see a class, it's ambiguous — is it for styles, scripts, or both?

---

## This File as a Template

This is the simplest GSAP + ScrollTrigger pattern in the project. Use it as a starting template for new scroll animations:

```ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function initMyAnimation() {
  // 1. Respect accessibility
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 2. Find and guard the element
  const el = document.querySelector<HTMLElement>('[data-my-element]');
  if (!el || el.dataset.myInited === '1') return;
  el.dataset.myInited = '1';

  // 3. Animate
  gsap.to(el, {
    y: -100,           // change this to your desired property
    ease: 'none',
    scrollTrigger: {
      trigger: el,
      start: 'top bottom',
      end: 'top 60%',
      scrub: true,
    },
  });
}
```

Change `y: -100` to any property (`opacity`, `scale`, `rotation`, `x`, etc.) and adjust `start`/`end` to control when the animation happens.
