---
name: requesting-video-review
description: Use between major production phases or after the full pipeline. Reviews progress against plan by severity: Critical blocks delivery, Important blocks next phase, Minor is logged.
---

# Requesting Video Review

Dispatches a reviewer subagent with production context to catch issues before they cascade.

## When to Request

- After each major phase (storyboard, generation, post-production)
- Before final delivery
- When stuck — fresh perspective helps

## How to Request

1. Gather review context:
   - Production plan
   - `<chapter-dir>/retention-report.json` if a retention pass ran
   - Final render path (typically `<base-dir>/final/final.mp4`)
   - Shot-by-shot diff: planned vs. actual file paths, durations, any regenerated shots
2. Dispatch a reviewer subagent with this context
3. Reviewer classifies issues by severity:
   - **Critical** — missing scenes, broken audio sync, unresolved consistency issues → blocks delivery
   - **Important** — visual quality below bar, shot doesn't match shot-detail spec → fix before next phase
   - **Minor** — style drift, minor pacing issue → log for next version
4. Write `<base-dir>/logs/review-feedback.md` with:
   - `Status: pass` or `Status: fail`
   - Critical findings
   - Important findings
   - Minor findings
   - Recommended next action
5. Act on feedback:
   - Fix Critical immediately before proceeding
   - Fix Important before delivering
   - Log Minor in `review-feedback.md` or `<base-dir>/docs/review-notes.md`

## After Review

If no Critical or Important issues remain, `review-feedback.md` should say `Status: pass` and the production is ready for delivery.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `plan_path`
**On completion** — key `outputs`: `review_feedback_path`, `critical_count`, `important_count`, `minor_count`, `blocked` (true if critical > 0)
