# Interface Quality

The execution bar for any implementation or material visual change. Read after the decision is settled (`product-judgment.md`) and the component is chosen (`component-guide.md`).

## Implement the smallest coherent change, end to end

- Ship one complete, coherent change — not a half-built surface plus unrelated cleanups absorbed along the way.
- Reuse before you build. If you build, put it where it belongs (`src/components/`, `src/components/mdxComponents/`, scripts in `src/scripts/`).
- Match the surrounding code: PascalCase components, `is*` boolean prefix, `import type` for types, centralized types in `src/types.ts`, constants in `src/consts.ts`, utils in `src/utils/` (check before creating a new one).

## Structure before style

1. Semantic HTML first: `<article>`, `<nav>`, `<main>`, `<section>`, `<header>`, `<footer>`. The element carries meaning and accessibility for free.
2. Correct component (navigation vs action — see `component-guide.md`).
3. Hierarchy via type scale + spacing.
4. Only then: tokens, color, motion, copy.

## Finish details that separate "works" from "done"

- **Tokens, not literals** — colors, fonts, spacing from `design-guidelines.md`.
- **Dark mode** — verify both themes; a token without a `.dark` value is a defect.
- **No layout shift** — explicit image dimensions; reserve space for async/lazy content.
- **Alignment & rhythm** — consistent with adjacent sections; optical alignment where it reads better than mathematical.
- **State labels stable** — don't make controls jump or relabel mid-interaction.
- **Focus & keyboard** — see `web-interface-guidelines.md`.
- **Resilience** — long titles, missing images, sparse data — see `resilience.md`.

## Learning comments

Per `CLAUDE.md`, add `// LEARN:` comments explaining *why* a non-obvious choice was made (perf, Astro concept, SEO impact), 1–2 lines, not on obvious code.

## Don't

- Don't hand-roll markup a component already provides.
- Don't ship client JS for static content, or inline >10 lines of script in an `.astro` file (extract to `src/scripts/` + `initOnLoad()`).
- Don't animate layout-triggering properties (width/height/top/left) — use `transform`/`opacity`.
- Don't leave a default/placeholder `title` or `description`.

## Definition of done

Build passes (`npm run build`), the primary job is unmistakable, every materially changed state is handled, it reads correctly at 375px and 1280px in both themes, keyboard/focus works, motion respects `prefers-reduced-motion`, and no layout shift was introduced.
