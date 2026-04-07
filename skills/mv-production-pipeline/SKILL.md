---
name: mv-production-pipeline
description: Use to run the complete music video workflow from lyrics to final compiled video. Orchestrates all MV skills in sequence with user checkpoints between major phases.
---

# Music Video Production Pipeline

Top-level orchestrator for a complete music video production. Runs all skills in sequence with user approval checkpoints between major phases.

Maintain these workflow docs throughout the run:
- `<project-dir>/SPEC.md` — project spec with the approved idea in `# Idea`
- `<project-dir>/PLAN.md` — iteration-based task plan for `SPEC.md` and `project/assets/`

## Inputs

- `--base-dir <path>` — project root
- Optional skip flags:
  - `--skip-lyrics` — skip if `<chapter-dir>/lyrics.txt` already exists
  - `--skip-song` — skip if `<chapter-dir>/song.mp3` already exists
  - `--skip-upscale` — skip upscaling step

## Workflow

```
[Phase 1: Music]
generating-lyrics          (skip with --skip-lyrics)
  → generating-song        (skip with --skip-song)
  → aligning-lyrics
                           ← CHECKPOINT: confirm before planning

[Phase 2: Planning & Breakdown]
  → writing-video-plan                ← writes `<project-dir>/SPEC.md`, `<project-dir>/PLAN.md`, and optionally exports storyboard JSON
  → running-video-production-pipeline   (per chapter)
                           ← CHECKPOINT: confirm before generation

[Phase 3: Video Generation]
  → writing-seedance15-prompt           (per shot)
  → generating-seedance15-video         (per shot)
  → upscaling-video                     (skip with --skip-upscale)
                           ← CHECKPOINT: confirm before post-production

[Phase 4: Post-Production]
  → compiling-video
  → retention-driven-development
  → requesting-video-review
```

## Checkpoints

Pause for user confirmation after each phase before proceeding. Show what was produced and ask: "Continue to [next phase]? (Y/N)"

Update `<project-dir>/PLAN.md` at each checkpoint with status, outputs, and approval notes in the latest `# Iteration N`, or append a new iteration if the user changes direction.

## Error Handling

Stop and report at any skill failure. Show which skill failed and what files are available. Ask user whether to retry, skip, or abort.

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `lyrics_path`
**On completion** — key `outputs`: `final_video_path`, `duration_s`
