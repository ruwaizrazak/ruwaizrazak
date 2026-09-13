# Tailwind translation — architecture

Companion to `tailwind-translation-2026-09-13-2003-plan.md`.

---

## Styling ownership after this change

| Concern | Home |
|---|---|
| Layout, spacing, colour, typography, responsive, state | Tailwind utilities |
| Design tokens + `.dark` overrides | `global.css` `@theme` / `@layer theme` |
| Repeated multi-declaration idioms | `@utility` in `global.css` (`full-bleed`) |
| Shared card shell (`.card-shell`, `.card-band`, `.card-eyebrow`, …) | `global.css` |
| Prose roles | `proseClasses.ts` (two exports; consumers named at the top of the file) |
| Selectors/properties Tailwind cannot write, `@keyframes`, two-token `color-mix` | component-scoped `<style>` |

## The cascade, and where it bites

```
unlayered author styles        <- global.css `img`, `table`, `code`, `blockquote`, `hr`
  beats everything below
@layer theme / base / components / utilities   <- Tailwind
component-scoped <style>       <- also unlayered, plus higher specificity
```

Two consequences, both load-bearing:

- A bare element rule in `global.css` **outranks every utility**. Check before translating anything on `img`, `table`, `code`, `blockquote`, `hr`.
- Scoped Svelte rules are unlayered *and* specific, which is why the pre-refactor CSS "just worked" and why some of it cannot simply become utilities.

## Tokens added

`--text-label: 10px`, `--text-micro: 13px`, `--text-eyebrow: 15px`, `--text-note: 17px`, `--tracking-meta: 0.1em`, `--tracking-eyebrow: 0.16em`, `--leading-body: 1.65`, `--spacing-section: 72px`.

Each was chosen from a frequency count of arbitrary values (the rule's threshold is three occurrences), not invented. Tailwind v4 generates `text-eyebrow`, `tracking-meta`, `leading-body`, `pt-section` from these namespaces — verified emitting. Note the custom `--text-*` entries emit **font-size only**, with no paired line-height, which is what makes them safe substitutes for a bare `font-size` declaration.

## The verification harness

`tests/tools/style-snapshot.mjs` — a tool, not a spec, kept out of `tests/e2e/` so Playwright never collects it.

```
node tests/tools/style-snapshot.mjs <outDir> [baseURL]
node tests/tools/style-snapshot.mjs --diff <dirA> <dirB>
```

9 routes x 3 viewports x 2 themes = 54 captures, ~23,000 elements. Element identity is a **structural path** (tag + `nth-of-type`), never a class — classes are the thing being rewritten.

Three things make it trustworthy:

- **Determinism was proven before use.** A first run flagged 26 differences against itself: GSAP writes inline transforms every frame, and CSS transitions were caught mid-flight. Elements under `.garden-strip` / `.character` are excluded by ancestor, and any element with a running animation is skipped via `getAnimations()`. A control run now diffs clean.
- **Known-equivalent notations are normalised** — colours resolved through a canvas so oklab and srgb compare equal, `border-radius >= 999px` collapsed to `pill`, and comma-repeated `transition-*` lists collapsed. Each was verified pixel-identical before being normalised; nothing is hidden on a hunch.
- **Coverage is checked, not assumed.** A component that renders on no captured route produces a vacuous PASS.

Pass condition is an empty diff. A non-empty diff is a bug or a deliberate change that must be named in the commit message.
