# Fix scroll restoration on Back — remove `scroll-behavior: smooth` from `<html>`

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)

---

## Context

Reported symptom: opening a related note and pressing browser Back loses the scroll position / scrolls oddly.

**The report's scope is narrower than the bug.** It was reported as "only from related notes", but measurement shows restoration fails on **every** client-side back navigation. Related notes are simply where it is visible: they sit at the bottom of a 116,395px essay, so returning to the top is dramatic there and invisible everywhere else, where you were already near the top.

### Root cause, measured

Astro's `ClientRouter` sets `history.scrollRestoration = 'manual'` and restores scroll itself. Its bookkeeping is **correct** — the problem is purely that the restore never lands:

```
after Back:  history.state.scrollY = 50000   <- ClientRouter recorded it correctly
             document.scrollHeight  = 116395  <- the page is tall enough
             window.scrollY         = 0       <- but nothing moved
```

`src/layouts/notesPost.astro:58` renders `<html lang="en" class="scroll-smooth">`. That makes ClientRouter's restoring `scrollTo(0, 50000)` a **smooth animation of 50,000 pixels** instead of an instant jump. It either never completes or is cancelled — and while it runs it sweeps the document, which is the "scrolls oddly" half of the report.

Proven by patching the incoming document during the swap:

```js
document.addEventListener('astro:before-swap', (e) => {
  e.newDocument.documentElement.style.scrollBehavior = 'auto';
});
// -> scrolledTo: 50000, storedByAstro: 50000, restoredTo: 50000, RESTORED: true
```

An earlier attempt to test this by setting `scrollBehavior` inline **appeared to disprove it** — because the override was applied to the outgoing document, which ClientRouter swaps away. The property has to be set on the incoming one. Worth knowing before re-testing.

### The fix is a deletion

`scroll-smooth` on `<html>` is load-bearing for nothing:

- **`TocPill.svelte:73`** — the site's main smooth-scroll affordance — already calls `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })` **explicitly**. It does not read the CSS.
- The other `scroll-smooth` occurrences are on **inner scroll containers** (`TocPill.svelte:227`, `TocPillDemoView.svelte:154,207`), which are unaffected by the root element.

It is also ungated, which contradicts CLAUDE.md's "always gate motion on `prefers-reduced-motion`" — a second reason it should not stay as-is.

---

## The change

Remove `class="scroll-smooth"` from the `<html>` element in three layouts:

| file | line |
|---|---|
| `src/layouts/notesPost.astro` | 58 |
| `src/layouts/WorkLayout.astro` | 44 |
| `src/pages/works/index.astro` | 17 |

Leave every other `scroll-smooth` alone — those are inner containers.

Add a short `// LEARN:` note at one of the sites recording why it must not come back: `scroll-behavior: smooth` on the scrolling element turns ClientRouter's scroll restoration into an animation over the full document height, so Back silently fails to restore.

**If in-page anchor smoothness is wanted later**, it must not go back on `<html>`. Give the specific trigger an explicit `scrollIntoView({ behavior: 'smooth' })`, the way `TocPill` already does.

---

## Test

`tests/e2e/view-transitions.spec.ts` covers interactivity, the TOC pill and theme across navigations, but nothing asserts scroll restoration. Add a test there — this is a silent regression with no visual error, so nothing else would catch it coming back:

```
test('restores scroll position on browser back')
  - goto ROUTES.pageWithToc  (/essays/deconstructionofcodm/ — 116k px tall)
  - scroll to a deep offset (e.g. 80% of scrollHeight), read it back
  - click a related-notes link, wait for the new route
  - page.goBack()
  - expect.poll(scrollY) to be within ~800px of the original offset
```

Use `expect.poll` rather than a fixed wait — restoration happens after the swap. The tolerance absorbs late-loading images changing layout slightly; the failure mode being guarded against is landing at 0, which is unambiguous.

Run it on **chromium and webkit** — scroll restoration and `scroll-behavior` differ between engines, and webkit is already required by this suite.

---

## Out of scope — found while diagnosing, deliberately not fixed here

Both are real, neither is what was reported. Raise them separately rather than widening this change.

1. **`work-scale-in` fires on Back.** `notesPost.astro:34` applies `::view-transition-new(<name>){animation:work-scale-in …}` and `<main>` carries `transition:name`. Because each post has a *different* name, old and new never pair, so the incoming page scales 0.92→1 on a **backward** navigation too — semantically it "zooms in" as though opening something new. Fixing it means keying the animation off `event.direction` in `astro:before-preparation`.

2. **The `nav-from-related` slide may be dead code.** `RelatedNotesView.svelte:29` sets the flag and `notesPost.astro:63-74` reads it from an `is:inline` head script. Probing a real navigation showed the flag cleared and **no slide style present at any point** — the head script runs relative to the swap such that its injected `<style>` never applies. The `related-notes.spec.ts` comment already suspects this ("the slide transition may leak into the next navigation"). Either wire it to ClientRouter's lifecycle events properly or delete it; it currently costs a sessionStorage write and an inline script for no visible effect.

---

## Verification

```bash
npm run build
npx astro preview --port 4399
```

Manually: open `/essays/deconstructionofcodm/`, scroll to the related notes at the bottom, click one, press the browser Back button. You should land back at the related-notes section, instantly, with no travel through the document. Confirm the TOC pill still scrolls smoothly to a heading when a row is clicked — that is the behaviour most at risk from this change.

```bash
npx playwright test tests/e2e/view-transitions.spec.ts tests/e2e/toc-pill.spec.ts --project=chromium --project=webkit
```

The computed-style harness is not the right tool here — `scroll-behavior` is not in its property list and the bug is behavioural, not visual. The e2e test is the guard.

**Known pre-existing failures, do not fix here:** `smoke.spec.ts`'s `<footer>` landmark assertion (intentionally failing, documented in the spec), and `related-notes.spec.ts` "flags the slide transition" when run alongside `view-transitions.spec.ts`.

---

## Files touched

| File | Change |
|---|---|
| `src/layouts/notesPost.astro` | drop `scroll-smooth` from `<html>` |
| `src/layouts/WorkLayout.astro` | same |
| `src/pages/works/index.astro` | same |
| `tests/e2e/view-transitions.spec.ts` | new scroll-restoration test |
