# shellcheck shell=bash
# .agents/profile.sh — Astro + Svelte + Tailwind site. OWNED BY THIS PROJECT: edit freely and commit; the toolkit
# never reads its own copy of this file after onboarding (G-D3). API: ~/.agents/codex-workflow/lib/profile.sh
PROFILE_STACK=astro
PROJECT_NAME=ruwaizrazak
BRANCH_POLICY=branch            # branch: work on codex/<plan-base> · main: commit phases straight to DEFAULT_BRANCH
DEFAULT_BRANCH=main
PLAN_DIR=docs/plans

# All three run inside Codex's sandbox (verified: ~11s build, <1s unit, ~2s integrity).
codex_check "build (read the output for css_unused_selector warnings)" "npm run build"
codex_check "unit tests"      "npx vitest run tests/unit"
codex_check "integrity tests" "npx vitest run tests/integrity"

# Playwright cannot run in the sandbox (listen EPERM on the preview port), so E2E belongs to the reviewer.
reviewer_check "e2e specs the plan names" "npx playwright test <specs> --project=chromium --project=webkit" plan-names-e2e
reviewer_check "visual check" "browser pane: desktop and 375px, light and dark" plan-names-ui

protect "package.json" "package-lock.json" "src/content/*"

scan FAIL "tests/* *.spec.ts *.test.ts" '\.(skip|only)\('               "skipped or focused test"
scan FAIL "tests/* *.spec.ts *.test.ts" 'if \(await .*\.count\(\)\)'    "conditional coverage guard"
# Tailwind-shaped class: names — a variant colon, opacity slash, arbitrary value, decimal step or utility prefix.
# Plain hyphenated names (class:is-upcoming, class:card-shell-wide) are legitimate Svelte and stay clean.
scan FAIL "*.svelte" 'class:([a-z0-9-]*(:|/|\[|\.)|(bg|text|border|p[xytblrse]?|m[xytblrse]?|w|h|size|min-w|max-w|min-h|max-h|gap|space-[xy]|translate-[xy]|scale|rotate|opacity|z|top|left|right|bottom|inset|rounded|shadow|font|leading|tracking|items|justify|overflow|pointer-events|cursor|duration|delay|ease|animate|grid-cols|col-span|flex|order)-|(hidden|block|inline|flex|grid|contents|sr-only|invisible|visible|transition)[={ ])' \
                                                                         "Tailwind utility in class: directive — use the object form"
scan WARN "*.svelte *.astro"       '<style'                              "<style> block — must qualify under the styling rule"
scan WARN "*.svelte *.astro"       'client:visible'                      "client:visible drops a first interaction"
scan WARN "*.svelte *.astro *.css" '#[0-9a-fA-F]{3,8}\b'                 "raw hex — tokens, never hex"
scan WARN "*.ts *.js *.svelte *.astro" '@ts-ignore|@ts-expect-error|eslint-disable' "suppressed check"
scan WARN "*.ts *.js *.svelte *.astro *.mdx" 'LEARN:'                    "LEARN comment (informational)"

# known_baseline_failure "tests/…/x.test.ts › suite › name — why it fails today"
# Pre-existing since before the Codex workflow (verified 2026-09-17, fails with and without the sandbox): two content
# images lack a descriptive alt. Fixing it edits published writing, so it needs its own plan and the user's approval.
known_baseline_failure "tests/integrity/seo.test.ts › images › gives content images a descriptive, non-empty alt"

# Verified pre-existing 2026-09-17 by re-running the spec with all of that day's source changes reverted: the same
# four fail. `mobile-chrome` is a Pixel 7 profile, i.e. a touch device with no hover, and the spec drives
# `locator.hover()` — the hover never resolves and each test times out at 30s. Chromium and webkit pass.
known_baseline_failure "tests/e2e/tooltips.spec.ts › link tooltips › (all four) — mobile-chrome only: hover on a touch device"

# Verified 2026-09-19: both playground posts are intentionally `publish: false` (commit b95acf3, the user's choice), so
# getStaticPathsForCollection() builds no route for them and every demo spec lands on a 404 before its first assertion.
# 15 tests × 3 projects = 45 failures; the baseline export fails the same 45. Remove these when the posts are published.
known_baseline_failure "tests/e2e/toc-anatomy.spec.ts › the TOC pill showcase › (all eight, all projects) — /playground/floating-table-of-contents/ is publish:false, 404"
known_baseline_failure "tests/e2e/series-card-demo.spec.ts › the series card showcase › (all seven, all projects) — /playground/series-master-card/ is publish:false, 404"
