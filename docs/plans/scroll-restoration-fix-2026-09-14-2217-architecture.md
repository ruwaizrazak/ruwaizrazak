# Scroll restoration fix — architecture

Companion to `scroll-restoration-fix-2026-09-14-2217-plan.md`.

---

## How scroll restoration works under ClientRouter

Astro's `ClientRouter` takes restoration away from the browser:

```
history.scrollRestoration = 'manual'      <- browser will NOT restore
         |
on navigate:  replaceState({ index, scrollX, scrollY })   <- records the position
         |
on popstate:  swap the document, then window.scrollTo(0, state.scrollY)
```

Its bookkeeping was never the problem. Measured on a real Back navigation:

```
history.state.scrollY   = 50000    <- recorded correctly
document.scrollHeight   = 116395   <- tall enough to get there
window.scrollY          = 0        <- but nothing moved
```

## Why `scroll-behavior` defeats it

`scrollTo()` obeys the scrolling element's `scroll-behavior`. With `smooth` on `<html>`, the restoring call becomes an **animation across 50,000px** rather than a jump. It does not complete, and while it runs it sweeps the document — which is the "scrolls oddly" half of the symptom.

**The rule: the scrolling element must not carry `scroll-behavior: smooth` when a router restores scroll programmatically.** Smooth scrolling belongs on the specific call that wants it (`scrollIntoView({ behavior: 'smooth' })`), not as a global default — that way the router's restoring `scrollTo()` stays instant.

Inner scroll containers (`overflow-y-auto scroll-smooth`) are unaffected: the router never scrolls those.

## Where smooth scrolling lives now

| Surface | Mechanism |
|---|---|
| TOC pill → heading | `TocPill.svelte:73`, explicit `scrollIntoView({ behavior: 'smooth' })` |
| TOC pill's own list | `overflow-y-auto scroll-smooth` on the `<ul>` (inner container) |
| TocPillDemo panes | same, inner containers |
| The document root | **nothing** — deliberately |

## The guards

Two tests in `tests/e2e/view-transitions.spec.ts`, both verified to fail on the unfixed code:

- **Direct** — `getComputedStyle(document.documentElement).scrollBehavior !== 'smooth'` on a post and a work page. Cheap, deterministic, and catches anyone re-adding the class.
- **Behavioural** — scroll deep, follow a related note, `goBack()`, assert the position returns. This one only bites once the document is tall, so it promotes lazy images to eager, waits for them, and asserts the setup exceeded 20,000px before trusting its own result.

The computed-style harness is the wrong tool here: `scroll-behavior` is not in its property list and the failure is behavioural, not visual.
