# Tailwind translation phase 2 — decisions

Companion to `tailwind-translation-phase2-2026-09-14-1851-plan.md`.
Written for an agent picking this up cold.

---

## Fix the unlayered-rules root cause first

**Decision.** Move the eight element rules in `global.css` (`textarea`, `input`, `table`, `img`, `code`, `pre`, `blockquote`, `hr`) into `@layer base`, as an isolated commit, before any translation.

**Why.** Unlayered author styles beat every layered one, and Tailwind lives entirely in layers. So `img { height: auto }` defeats `size-3.5` — width applies, height does not, and the image renders at its intrinsic ratio. This is the root cause behind three of the seven traps in `AGENTS.md`, and it already forced CSS to stay in `ContentCard` and `NotePostHero` during phase 1. It will block `WebmentionsView` (avatar sizing) and `NoteMain` (maturity icon) here.

**Why it is safe to attempt.** The harness turns it into a controlled experiment rather than a guess. An empty diff proves nothing currently depends on those rules outranking a utility. A non-empty diff names every site where precedence flips, and each can be judged individually — most will be latent bugs this fixes.

**Rejected: work around it per file.** Every future design import would hit the same wall, and the workaround (a scoped descendant selector) reintroduces exactly the scoped CSS this project is removing.

**Rejected: `!important` utilities.** Wins the cascade and loses the plot — it makes the utility unoverridable everywhere else.

---

## Batch the 9 clean files, isolate the 3 hard ones

**Decision.** One commit for the nine trap-free files; one commit each for `WebmentionsView`, `RelatedNotesView`, `NoteMain`.

**Why.** A full harness cycle is ~7 minutes (baseline capture, build, after capture, diff). Twelve cycles is roughly an hour of wall clock for work where nine of the files are independent, trap-free, and should end at zero lines. A failing batch diff is still cheap to attribute — revert one file at a time.

The three hard files each carry a distinct hazard and each will keep a residue, so they stay separable in the history.

---

## 147 is an upper bound, not a target

The measuring script flags a declaration "replaceable" when its rule has no hard selector and no un-utility-able property. **It cannot see the cascade.** ContentCard is the evidence: the script called 149 declarations easy, and 59 remain — legitimately, because they override unlayered global rules, use two-token `color-mix()`, or need per-property transitions with differing durations *and* easings.

Expect the same proportion here. A declaration left untranslated for a documented reason is a success. Never force one with `!important`.

---

## `/embed/works/` had to be added to the harness

`src/pages/embed/works/[...slug].astro` renders on a route the harness never visited, so translating it would have produced a **vacuous PASS** — a green diff that proves nothing because the component never rendered.

This is not hypothetical. It happened in phase 1: a `SeriesPostCard` translation "passed" against seven routes, none of which rendered `SeriesPostCard`. Two routes were added and the baseline recaptured.

Every other component in this batch was checked against the existing nine routes and is covered. Verify per file anyway — grep the built HTML for a class you just introduced.

---

## Branch note for whoever runs this

Phase 1 lived on `translating-to-tailwind` and was fast-forwarded into `main` on 2026-09-14. A first attempt at phase 2 was run against `main` *before* that merge — a tree with no harness, no phase-1 translation, and no phase-2 plan on disk — and consequently changed nothing. **Confirm `tests/tools/style-snapshot.mjs` exists and scoped CSS totals 1569 lines before starting.**
