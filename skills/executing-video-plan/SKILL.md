---
name: executing-video-plan
description: Execute a video production plan phase by phase. Reads production-plan.json, finds the next actionable phase, and reports blockers in plan terms. Run after writing-video-plan.
---

# Executing Video Plan

Load the production plan, find the next actionable phase, execute it, and continue until blocked or complete.

## Inputs

- `{project_dir}/assets/production-plan.json` — execution manifest written by `writing-video-plan`
- `{project_dir}/docs/video-plan.md` — human runbook for context
- Current workspace state

If `production-plan.json` does not exist, tell the user to run `writing-video-plan` first.

## Workflow

### Step 1: Load the Plan

Read `{project_dir}/assets/production-plan.json`. Read `{project_dir}/docs/video-plan.md` for context.

### Step 2: Determine Current Phase

Walk the phase list in order. For each phase:
1. Skip phases marked `"status": "completed"` or `"status": "skipped"`.
2. For phases marked `"optional": true`, treat them as non-blocking unless `"enabled": true` or `"status": "in-progress"`.
3. If a phase is `"manual": true`, do not try to execute a skill for it. It is either a manual checkpoint or a manual delivery step.
4. For each considered phase, check whether all `requires` artifacts exist in the workspace.

The first considered phase with all `requires` satisfied is the **next actionable phase**.
The first considered phase with a missing `requires` artifact is the **current blocked phase**.

Supported statuses in `production-plan.json`:

- `pending`
- `in-progress`
- `completed`
- `skipped`

### Step 3a: If an Executable Phase is Runnable

Report:

> **Current phase:** {phase id} — {phase title}
> **Skill:** `{default_skill}`
> **Required inputs:** {list of requires}
> **Expected outputs:** {list of produces}
>
> Starting now.

Execute the phase using the named default skill. Follow that skill's instructions exactly.

After execution, verify each artifact in `produces`. If all pass: update `production-plan.json` to set `"status": "completed"` for this phase. Continue to the next phase.

### Step 3b: If a Manual Phase is Actionable

Report:

> **Current phase:** {phase id} — {phase title}
> **Status:** waiting for manual action
> **Required inputs:** {list of requires}
> **Verify before marking complete:** {phase.verification}
> **Notes:** {phase.note if present}

Do not attempt to execute a null/default skill. Pause and wait for the user to complete the manual step or provide the missing artifact. Once the user confirms the step is complete, mark the phase `"status": "completed"` and continue.

### Step 3c: If a Phase is Blocked

Report in plan terms:

> **Current phase:** {phase id} — {phase title}
> **Status:** blocked
> **Missing:** `{path to missing artifact}`
> **Once provided:** run `{default_skill}` if this is an executable phase, or complete the manual step and mark it done
> **Next phases waiting:** {list of downstream phases}
>
> Execution is paused. Once the missing input is available, run `executing-video-plan` again to continue.

Do not report phases that are not yet expected. If `production-pipeline` is not reached, a missing `{chapter_dir}/shot-details.json` is not a blocker — it simply has not been produced yet.

### Step 4: Two-Stage Review Per Phase

For each completed phase:

1. **Stage 1 — Spec compliance:** Do produced artifacts exist at the expected paths? Do file counts match plan expectations?
2. **Stage 2 — Asset quality:** For generated video clips — review file metadata and any available preview. Flag clips with zero size, wrong duration, or obvious generation failure.

If Stage 2 fails, retry the generation for that scene/artifact before marking the phase complete.

### Step 5: Parallelism

For `scene-generation` phase only: scenes within the current chapter can be dispatched in parallel. Save clips under `{chapter_dir}/scenes/` and maintain `scene-generation.manifest.json` alongside them.

All other phases are sequential.

### Step 6: Late Phases — Retention and Review

Treat `retention-review`, `recompile`, `video-review`, `thumbnail`, and `delivery` as explicit phases. Do not skip them or treat them as informal advice.

Default sequence after `draft-compile`:
1. `retention-review` — run `retention-driven-development`
2. `recompile` — run `compiling-video` again
3. `video-review` — run `requesting-video-review`
4. `thumbnail` — run `generating-thumbnail` (requires `final/final.mp4`)
5. `delivery` — user or agent uploads `final/final.mp4` and `final/thumbnail.jpg`

### Step 7: Completion

When all phases reach `"status": "completed"`, report:

> **All phases complete.**
> Final video: `{project_dir}/final/final.mp4`
> Thumbnail: `{project_dir}/final/thumbnail.jpg`
> Review log: `{project_dir}/logs/review-feedback.md`

## When to Stop and Ask

Stop immediately when:
- A `requires` artifact is missing and cannot be produced automatically
- Generation fails after one retry
- A plan instruction is ambiguous
- Two-stage review fails repeatedly for the same artifact

## Logging

Log to `{project_dir}/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `production_plan_path`, `current_phase`
- **On phase completion** — event `completed`, outputs: `phase_id`, `artifacts` (array of produced file paths)
- **On block** — event `failed`, notes: `phase_id`, `missing_artifact`, `recommended_skill`
