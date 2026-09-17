Claude reviewed phase {{PHASE}} of docs/plans/{{PLAN_BASE}}-plan.md and found the issues below. Address each by
its ID. The rules from your implementation run still apply in full; the file allowlist is unchanged unless a
finding explicitly says otherwise.

Findings:
{{FINDINGS}}

For each finding:
- Fix it, then set findings_addressed status="fixed" with evidence as a file:line or command result; or
- If the finding is wrong, do NOT comply — set status="disputed" with the evidence that shows why; or
- If fixing it needs something the rules forbid, set status="blocked" and explain in notes.

Then re-run all three checks (npm run build, npx vitest run tests/unit, npx vitest run tests/integrity), and
update the steps/acceptance entries you touched so the report reflects the tree as it is now.
Report: mode="fix", plan_base="{{PLAN_BASE}}", phase={{PHASE}}.

Your final message is JSON matching the schema you were given.
