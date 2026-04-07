---
name: requesting-video-review
description: Use between major phases or after the full pipeline. Reviews progress against the project idea, plan, and execution docs by severity.
---

# Requesting Video Review

Dispatches a reviewer with production context to catch issues before they cascade.

## When to Request

- After each major phase (storyboard, generation, post-production)
- Before final delivery
- When stuck — fresh perspective helps

## How to Request

1. Gather review context:
   - `<base-dir>/docs/idea.md`
   - `<base-dir>/docs/plan.md`
   - `<base-dir>/docs/exec.md`
   - `<chapter-dir>/retention-report.json`
   - Shot-by-shot diff: planned vs. actual file paths, durations, any regenerated shots
2. Review against intent, plan, and actual execution state
3. Reviewer classifies issues by severity:
   - **Critical** — missing scenes, broken audio sync, unresolved consistency issues → blocks delivery
   - **Important** — visual quality below bar, shot doesn't match shot-detail spec → fix before next phase
   - **Minor** — style drift, minor pacing issue → log for next version
4. Act on feedback:
   - Fix Critical immediately before proceeding
   - Fix Important before delivering
   - Append Minor notes to the `## Review Notes` section in `<base-dir>/docs/exec.md`

## After Review

If no Critical or Important issues remain, the production is ready for delivery.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `idea_path`, `plan_path`, `exec_path`
**On completion** — key `outputs`: `critical_count`, `important_count`, `minor_count`, `blocked` (true if critical > 0)
