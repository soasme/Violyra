---
name: shorts-production-pipeline
description: Use to run the complete short drama workflow from screenplay to final assembly. No lyrics/song phase. Video generation model is user-chosen via --model.
---

# Short Drama Production Pipeline

Top-level orchestrator for a complete short drama production. No lyrics or song phase — screenplay is the primary input. Video generation model is user-chosen.

Maintain these workflow docs throughout the run:
- `<project-dir>/docs/idea.md` — approved concept
- `<project-dir>/docs/plan.md` — approved task plan
- `<project-dir>/docs/exec.md` — live execution and review log

## Inputs

- `--base-dir <path>` — project root
- `--screenplay <path>` — screenplay or story brief file
- `--model <replicate-model-id>` — video generation model (default: `bytedance/seedance-1.5-pro`)
- Optional skip flags:
  - `--skip-brainstorm` — skip if screenplay already exists and project is set up

## Workflow

```
[Phase 1: Setup]
brainstorming-video-idea   (skip with --skip-brainstorm)
  → setup-video-project
  → writing-video-plan      ← writes `<project-dir>/docs/plan.md` for the run
                           ← CHECKPOINT: confirm before breakdown

[Phase 2: Breakdown]
  → running-video-production-pipeline   (per chapter/scene)
                           ← CHECKPOINT: confirm before generation

[Phase 3: Video Generation]
  → [video generation per shot using --model]
                           ← CHECKPOINT: confirm before post-production

[Phase 4: Post-Production]
  → compiling-video
  → retention-driven-development
  → requesting-video-review
```

## Checkpoints

Pause for user confirmation after each phase before proceeding. Show what was produced and ask: "Continue to [next phase]? (Y/N)"

Update `<project-dir>/docs/exec.md` at each checkpoint with status, outputs, and approval notes.

## Error Handling

Stop and report at any skill failure. Ask user whether to retry, skip, or abort.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `screenplay_path`
**On completion** — key `outputs`: `final_video_path`, `duration_s`
