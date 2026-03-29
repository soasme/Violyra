---
name: executing-video-plan
description: Use when executing a video production plan task-by-task. Dispatches subagents per task with two-stage review: spec compliance then visual quality.
---

# Executing Video Plan

Loads a production plan, reviews it critically, then executes tasks with two-stage review per task.

## Inputs

- A written production plan (from `superpowers:writing-plans` or `writing-video-plan`)
- `--base-dir <path>` — project root

## Workflow

### Step 1: Load and Review Plan

1. Read the plan file
2. Review critically — identify questions or concerns
3. If concerns: raise with user before starting
4. If no concerns: proceed

### Step 2: Execute Tasks

For each task:
1. Mark in-progress
2. Execute steps exactly as written
3. Two-stage review:
   - **Stage 1 — Spec compliance:** Does output match `shot-details.json`? Correct file path, duration, resolution?
   - **Stage 2 — Visual quality:** Does the clip look right? Review file metadata and any available preview.
4. Mark completed

**Parallelism:** Scenes within a chapter can run in parallel. Chapters must be sequential.

### Step 3: Complete

After all tasks complete and verified, transition to `retention-driven-development`.

## When to Stop

Stop immediately and ask the user when:
- Missing dependency (pack file, chapter file, audio)
- Generation fails after retry
- Instruction in plan is unclear
- Verification fails repeatedly

## After Execution

Transition to `retention-driven-development`.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `plan_path`, `task_id`
**On completion** — key `outputs`: `task_status` (`passed`/`failed`), `artifacts` (array of output file paths)
