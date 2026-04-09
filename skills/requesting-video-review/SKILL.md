---
name: requesting-video-review
description: Use between major phases or after the full pipeline. Reviews progress against SPEC.md, PLAN.md, and project outputs by severity.
---

# Requesting Video Review

Dispatch or perform a structured review with production context so issues are caught before they cascade.

## When to Request

- After each major phase
- Before final delivery
- When stuck and a fresh pass is useful

## How to Request

1. Gather review context:
   - `<base-dir>/SPEC.md`
   - `<base-dir>/PLAN.md`
   - `<chapter-dir>/retention-report.json` if a retention pass ran
   - final render path if one exists
   - shot-by-shot diff: planned vs actual file paths, durations, any regenerated shots
2. Review against intent, project spec, the latest iteration in the plan, and actual execution state.
3. Classify issues by severity:
   - **Critical** — missing scenes, broken audio sync, unresolved consistency issues; blocks delivery
   - **Important** — visual quality below bar, shot does not match `SPEC.md` or the plan; fix before next phase
   - **Minor** — style drift or pacing issues; log for the next version
4. Write `<base-dir>/logs/review-feedback.md` with:
   - `Status: pass` or `Status: fail`
   - critical findings
   - important findings
   - minor findings
   - recommended next action
5. Act on feedback:
   - fix Critical immediately before proceeding
   - fix Important before delivering
   - append Minor notes to the `## Review Notes` section of the latest `# Iteration N` in `<base-dir>/PLAN.md`

## After Review

If no Critical or Important issues remain, the production is ready for delivery.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `spec_path`, `plan_path`, `final_render_path`
**On completion** — key `outputs`: `review_feedback_path`, `critical_count`, `important_count`, `minor_count`, `blocked` (true if critical > 0)
