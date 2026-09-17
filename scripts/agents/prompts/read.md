You are doing the IMPLEMENTATION READ for phase {{PHASE}} of a plan Claude wrote. You are in a read-only
sandbox. Change nothing — not even formatting, not even a scratch file.

Read in full before answering:
- docs/plans/{{PLAN_BASE}}-plan.md
- docs/plans/{{PLAN_BASE}}-decisions.md
- docs/plans/{{PLAN_BASE}}-architecture.md
- AGENTS.md (already loaded — re-read "Executing a Claude plan" and "Plan Drift Lessons")

Steps in scope: {{STEP_IDS}}. Other steps are context only.

For every file those steps list in `files:`:
1. ownership_map — grep who imports or uses it (components, pages, layouts, tests, MDX map). A file with more
   than one consumer is where drift starts; list every consumer.
2. mismatches — anything the plan states about the repo that is not true: paths, exports, line contents,
   component props, fixtures, test routes, frontmatter a test relies on.
3. questions — every place where meeting the acceptance criteria needs a decision the plan does not make.
   Offer concrete options. blocking=true if the step cannot be implemented without an answer.

Report rules:
- mode="read", plan_base="{{PLAN_BASE}}", phase={{PHASE}}, overall_status="read_only".
- One entry per step in scope: status="read_only", files_changed=[], and one acceptance entry per AC ID with
  met=null and evidence = how you would verify that criterion.
- Do not redesign the plan. Only surface where it is incomplete or wrong about the repo.
- deviations, findings_addressed, checks_run, content_edits: empty. e2e_specs_to_run: the specs that
  exercise these steps.

Your final message is JSON matching the schema you were given.
