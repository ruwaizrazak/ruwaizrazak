# <Title — what changes, in one line>

<!--
TEMPLATE for a plan Codex will execute. Copy to docs/plans/<base>-<YYYY-MM-DD-HHMM>-plan.md, alongside
-decisions.md, -architecture.md and -runlog.md. Workflow: docs/plans/codex-execution-workflow-2026-09-17-0655-plan.md (Phase B).

The step grammar below is parsed by scripts/agents/check-scope.sh, so it is a contract:
  - heading      `### S<n> — <title>`            (IDs are never renumbered once a run has started; append S<n+1>)
  - `- files:`   comma-separated repo paths on ONE line, plain text (not bold). `(new)` / `(edit)` annotations are
                 ignored. Globs only for new files in a new directory. Protected paths (package.json, lockfile,
                 CLAUDE.md, AGENTS.md, docs/plans/**, src/content/**) must be listed literally, never by glob.
  - `- acceptance:` one `AC<n>.<m>` per line, each verifiable from the diff or a command. "Looks right" is not one.
                 Prefix `must-fail-before:` for a test the reviewer must see fail on the baseline SHA.

Before handing this to Codex, every choice with more than one reasonable answer is decided here and argued in
-decisions.md: design values, which component owns a style, which route/fixture a test uses, variant vs change to a
shared export. Undecided choices are where drift comes from.

Delete this comment block in the real plan.
-->

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)
Companions: `<base>-decisions.md` · `<base>-architecture.md` · `<base>-runlog.md`

---

## Context

<The problem, with measured evidence where there is any. What is true in the repo today, cited as file:line.>

## Outcome

<What is observably different when this is done — for a reader and for the test suite.>

---

## Phases

Each phase ≤ ~5 steps / ~8 files and leaves the build green. Codex implements one phase per run.

| Phase | Steps | Boundary check (reviewer) |
|---|---|---|
| 1 | S1, S2 | build + unit + integrity green |
| 2 | S3 | + e2e `<spec>.spec.ts` on chromium and webkit |

---

## Steps

### S1 — <imperative title>
- files: src/components/Example.svelte (edit), src/lib/example/* (new)
- depends-on: none
- acceptance:
  - AC1.1 <observable, checkable outcome — e.g. `Example.svelte` renders `<nav aria-label="…">` as its root>
  - AC1.2 <e.g. no `<style>` block added; spacing uses `gap-3`>
- verify: build; `grep -c '<astro-island' dist/<route>/index.html` = 0
- out-of-scope: <the tempting adjacent change, named explicitly — e.g. restyling `ExampleCard.svelte`>

### S2 — <imperative title>
- files: tests/unit/example.test.ts (new)
- depends-on: S1
- acceptance:
  - AC2.1 <what the test asserts, and on which fixture>
  - AC2.2 must-fail-before: the test fails on the baseline SHA
- verify: `npx vitest run tests/unit/example.test.ts`
- out-of-scope: <…>

### S3 — <imperative title>
- files: tests/e2e/example.spec.ts (edit)
- depends-on: S1
- acceptance:
  - AC3.1 <geometry or behaviour asserted, on a route whose entry actually exercises it>
- verify: e2e example.spec.ts (chromium, webkit) — run by the reviewer; Codex cannot bind ports
- out-of-scope: <…>

---

## Known baseline failures

<Filled at B1 from the runlog; passed to Codex so it does not chase them. e.g.
`tests/integrity/seo.test.ts › images › gives content images a descriptive, non-empty alt`>

---

## Amendments

<Dated. Any change to scope, a step, or an AC after the first Codex run — with who approved it.
Never rewrite a step silently once a run has started.>
