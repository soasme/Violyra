---
name: executing-video-plan
description: Use when executing the project plan task-by-task. Records progress, outputs, blockers, and review notes in the execution log.
---

# Executing Video Plan

Loads the approved production plan, reviews it critically, then executes tasks with two-stage review per task. `<base-dir>/docs/exec.md` is the live execution ledger.

## Inputs

- A written production plan at `<base-dir>/docs/plan.md` (or another explicitly provided plan path)
- `--base-dir <path>` — project root

## Workflow

### Step 1: Load and Review Plan

1. Read `<base-dir>/docs/plan.md`
2. Review critically — identify questions or concerns
3. If concerns: raise with user before starting
4. Ensure `<base-dir>/docs/exec.md` exists
5. If no concerns: proceed

### Step 2: Execute Tasks

For each task:
1. Mark in-progress in `<base-dir>/docs/exec.md`
2. Execute steps exactly as written
3. Two-stage review:
   - **Stage 1 — Spec compliance:** Does the output match the task contract in `<base-dir>/docs/plan.md`? Correct file path, format, duration, resolution, or schema?
   - **Stage 2 — Quality:** Does the output actually meet the bar for the task? Review files, metadata, previews, and user-facing usefulness.
4. Record outputs, blockers, and review notes in `<base-dir>/docs/exec.md`
5. Mark completed or blocked in `<base-dir>/docs/exec.md`

**Parallelism:** Scenes within a chapter can run in parallel. Chapters must be sequential.

### Step 3: Complete

After all tasks complete and verified, summarize the run in `<base-dir>/docs/exec.md` and transition to the next phase, usually `retention-driven-development`.

## When to Stop

Stop immediately and ask the user when:
- Missing dependency (pack file, chapter file, audio)
- Generation fails after retry
- Instruction in plan is unclear
- Verification fails repeatedly

## After Execution

`<base-dir>/docs/plan.md` remains the approved plan. `<base-dir>/docs/exec.md` captures what actually happened. Transition to `retention-driven-development` once execution is materially complete.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `plan_path`, `task_id`
**On completion** — key `outputs`: `exec_path`, `task_status` (`passed`/`failed`), `artifacts` (array of output file paths)
