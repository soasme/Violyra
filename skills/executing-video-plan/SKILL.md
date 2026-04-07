---
name: executing-video-plan
description: Execute the project plan against SPEC.md phase by phase. Reads PLAN.md, updates it in place, and reports blockers in plan terms.
---

# Executing Video Plan

Load the approved production plan, execute it against `<base-dir>/SPEC.md` and the actual project assets, and keep `<base-dir>/PLAN.md` as the live coordination ledger.

## Inputs

- A written production plan at `<base-dir>/PLAN.md` (or another explicitly provided plan path)
- A project spec at `<base-dir>/SPEC.md`
- `--base-dir <path>` — project root

If the plan or spec does not exist, tell the user to run `writing-video-plan` first.

## Workflow

### Step 1: Load and Review Plan

1. Read `<base-dir>/PLAN.md`
2. Read `<base-dir>/SPEC.md`
3. Review critically for ambiguities, missing prerequisites, or contradictory instructions
4. Ensure `<base-dir>/PLAN.md` has clear task states, blockers, and run notes
5. If there are blocking concerns, raise them before starting

### Step 2: Determine the Next Actionable Work

Walk the plan in order and identify:

- the first incomplete task or phase whose prerequisites are satisfied
- the first incomplete task or phase that is blocked by a missing artifact

Report blockers in plan terms, using the file paths and checks already recorded in the plan.

### Step 3: Execute

For each task or phase you execute:

1. Mark it in-progress in `<base-dir>/PLAN.md`
2. Execute steps exactly as written
3. Record outputs, blockers, and notes in `<base-dir>/PLAN.md`
4. Mark it completed or blocked in `<base-dir>/PLAN.md`

### Step 4: Two-Stage Review

For each completed task or phase:

1. **Stage 1 — Spec compliance:** Does the output match the task contract in `<base-dir>/PLAN.md` and `<base-dir>/SPEC.md`? Correct file path, format, duration, resolution, or schema?
2. **Stage 2 — Quality:** Does the output actually meet the bar for the task? Review files, metadata, previews, and user-facing usefulness.

If Stage 2 fails, retry the generation or fix once before marking the task complete.

### Step 5: Parallelism

Asset tasks can run in parallel when the plan says they are independent. Spec-editing tasks should stay sequential unless the plan explicitly isolates them.

### Step 6: Completion

After all tasks complete and verify cleanly, summarize the run in `<base-dir>/PLAN.md` and transition to the next phase, usually `retention-driven-development`.

## When to Stop and Ask

Stop immediately when:

- a required artifact is missing and cannot be produced automatically
- generation fails after one retry
- a plan instruction is ambiguous
- review fails repeatedly for the same artifact

## After Execution

`<base-dir>/SPEC.md` remains the project contract. `<base-dir>/PLAN.md` remains the approved coordination plan and execution ledger.

If the plan includes explicit retention, review, thumbnail, or delivery tasks, do not silently skip them.

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `plan_path`, `task_id`
- **On completion** — event `completed`, outputs: `plan_path`, `task_status` (`passed`/`failed`), `artifacts` (array of output file paths)
- **On block** — event `failed`, notes: `missing_artifact`, `recommended_next_action`
