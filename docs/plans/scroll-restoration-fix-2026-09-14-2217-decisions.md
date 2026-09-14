# Scroll restoration fix — decisions

Companion to `scroll-restoration-fix-2026-09-14-2217-plan.md`.

---

## Delete the CSS rather than work around it

**Decision.** Remove `class="scroll-smooth"` from `<html>` in the three layouts that had it.

**Rejected: neutralise it during navigation** — a listener on `astro:before-swap` setting `scrollBehavior='auto'` on `event.newDocument`, restoring `smooth` afterwards. This is what proved the diagnosis, and it works, but it keeps a broken default and adds a lifecycle hook whose ordering has to stay correct forever.

**Why deleting costs nothing.** `scroll-smooth` on the root was load-bearing for nothing:

- `TocPill.svelte:73` — the site's main smooth-scroll affordance — already calls `scrollIntoView({ behavior: 'smooth' })` **explicitly**.
- The other `scroll-smooth` occurrences are on inner scroll containers (`TocPill.svelte:227`, `TocPillDemoView.svelte:154,207`) and are unaffected by the root element.

It was also ungated, contradicting CLAUDE.md's "always gate motion on `prefers-reduced-motion`".

---

## The reported scope was narrower than the bug

Reported as "only from related notes". Measurement showed restoration fails on **every** client-side back navigation — a header-nav navigation from the same scroll offset failed identically. Related notes are simply the one place you are 93,000px down a 116,395px document when you navigate, so losing the position is dramatic there and invisible elsewhere.

Worth recording because the narrow framing points at the `nav-from-related` slide mechanism, which turned out to be innocent.

---

## Two diagnostic traps worth remembering

**1. Overriding `scrollBehavior` on the outgoing document proves nothing.** A first attempt set it inline and appeared to *disprove* the hypothesis. ClientRouter swaps the document, so the override was discarded before restoration ran. It must be set on `event.newDocument` during `astro:before-swap`.

**2. The bug needs distance.** A first version of the behavioural test passed with *and* without the fix. In Playwright the lazy images never load, so the document stays short, and a short smooth scroll completes fine. The test now promotes images to eager, waits for them, and asserts the setup reached >20,000px before trusting the result — a pass below that threshold would be meaningless.

Both are instances of the same rule: a test or probe that cannot fail on the broken code is not evidence.

---

## Out of scope — found while diagnosing

Both real, neither reported. Raised separately rather than widening this change.

1. **`work-scale-in` fires on Back.** `notesPost.astro` applies `::view-transition-new(<name>){animation:work-scale-in …}` and `<main>` carries `transition:name`. Each post has a different name, so old and new never pair and the incoming page scales 0.92→1 on a **backward** navigation — it "zooms in" as though opening something new. Fixing it means keying off `event.direction`.

2. **The `nav-from-related` slide appears to be dead code.** `RelatedNotesView.svelte:29` sets a sessionStorage flag; `notesPost.astro` reads it from an `is:inline` head script. Probing a real navigation showed the flag cleared and **no slide style present at any point** — the head script runs relative to the swap such that its injected `<style>` never applies. `related-notes.spec.ts` already suspects this in a comment. Either wire it to ClientRouter's lifecycle or delete it.
