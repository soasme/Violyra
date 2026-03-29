---
name: writing-video-plan
description: Write the production plan for an approved video idea. Emits storyboard.json (scene generation input), video-plan.md (human runbook), and production-plan.json (machine execution manifest). Run after brainstorming-video-idea and before executing-video-plan.
---

# Writing Video Plan

Turn an approved `video-idea.md` into a full production plan. Produces three artifacts with different jobs: a creative scene input for generation, a human-readable runbook, and a machine-readable execution manifest.

## Inputs

Collect before writing:

1. `{project_dir}/docs/video-idea.md` — approved design doc from brainstorming
2. `skills/lib/workflow.json` — canonical phase definitions (read to populate production-plan.json)
3. `user_requirements` — any additional constraints the user specified

If `video-idea.md` does not exist, do not proceed. Ask the user to run `brainstorming-video-idea` first.

## Outputs

| File | Job |
|---|---|
| `{project_dir}/assets/storyboard.json` | Scene-level creative input for video generation |
| `{project_dir}/docs/video-plan.md` | Human runbook — phases, artifacts, next steps |
| `{project_dir}/assets/production-plan.json` | Machine execution manifest consumed by `executing-video-plan` |

## Workflow

### Step 1: Write `storyboard.json`

Follow the existing storyboard contract in `references/storyboard-format.md`. Use the template in `assets/storyboard.template.js`.

- Split lyrics into sections (intro, verse, chorus, bridge, outro).
- Map lyric lines to scenes. Default: 2 sung lines per scene.
- Set one `character` focus per scene unless ensemble is required.
- Write a concrete `prompt` with subject action, environment motion, and camera movement.
- Default output: `{project_dir}/assets/storyboard.json`

### Step 2: Write `production-plan.json`

Read `skills/lib/workflow.json`. For each phase, populate:
- `project_dir`: the actual project directory path
- `requires`: resolve `{project_dir}` template variables
- `produces`: resolve `{project_dir}` template variables
- `status`: set to `"pending"` for all phases
- Mark `reference-images` phase as `"optional": true` unless the video-idea.md specifies reference images are needed

```json
{
  "$schemaVersion": "1.0",
  "project_dir": "{project_dir}",
  "generated_at": "{ISO 8601 timestamp}",
  "source_idea": "{project_dir}/docs/video-idea.md",
  "phases": [
    {
      "id": "project-setup",
      "title": "Set up project workspace",
      "default_skill": "setup-video-project",
      "status": "pending",
      "requires": [],
      "produces": [
        "{project_dir}/project.json",
        "{project_dir}/docs/",
        "{project_dir}/assets/",
        "{project_dir}/logs/"
      ],
      "verification": [
        "project.json exists and is valid JSON",
        "assets/ and logs/ directories exist"
      ],
      "optional": false
    }
  ]
}
```

Mark phases as `"status": "completed"` for any phase whose `produces` artifacts already exist in the workspace.

### Step 3: Write `video-plan.md`

This is the human runbook. A user or agent opening it should immediately know: what exists, what the next step is, and how to verify each phase.

Structure:

```markdown
# Video Production Plan: {title}

**Project:** `{project_dir}`
**Idea doc:** `{project_dir}/docs/video-idea.md`
**Generated:** {date}

## Current Status

{One sentence: which phase is next and what it needs.}

## Phase Checklist

### Phase 1: Set Up Project Workspace
- **Skill:** `setup-video-project`
- **Requires:** nothing
- **Produces:** `project.json`, `assets/`, `docs/`, `logs/`
- **Verify:** `project.json` exists and is valid JSON
- **Status:** [ ] pending / [x] completed

### Phase 2: Localize Source Audio and Lyrics
- **Skill:** `aligning-lyrics`
- **Requires:** `assets/song.mp3`, `assets/lyrics.txt`
- **Produces:** `assets/aligned_lyrics.json`, `assets/subtitle.srt`, `assets/subtitle.lrc`
- **Verify:** `assets/aligned_lyrics.json` line count matches sung-line count ({n} lines per this plan)
- **Blocked if:** `assets/song.mp3` is missing
- **Status:** [ ] pending

### Phase 3: Run Production Pipeline
- **Skill:** `running-video-production-pipeline`
- **Requires:** `assets/aligned_lyrics.json`, `assets/storyboard.json`
- **Produces:** `assets/chapter.json`, `assets/shot-list.json`, `assets/shot-details.json`, `assets/packs/`
- **Verify:** `assets/shot-list.json` scene count matches storyboard scene count ({n} scenes per this plan)
- **Status:** [ ] pending

### Phase 4: Lyric Alignment Verification *(optional)*
- **Skill:** `aligning-lyrics`
- **Requires:** `assets/aligned_lyrics.json`, `assets/shot-list.json`
- **Skip when:** aligned line count and scene count agree
- **Run when:** line count mismatch detected — document reconciliation decision in `project.json`
- **Status:** [ ] pending

### Phase 5: Generate Reference Images and Start Frames {reference_images_note}
- **Skill:** `generating-character-pack`
- **Requires:** `assets/packs/`, `assets/shot-details.json`
- **Produces:** `assets/reference-frames/`, updated actor packs
- **Required for:** {list of characters appearing in 3+ scenes, or "not required for this production"}
- **Status:** [ ] pending

### Phase 6: Write Video Generation Prompts
- **Skill:** `writing-video-prompt`
- **Requires:** `assets/shot-details.json`, `assets/packs/`
- **Produces:** `assets/video-prompts.json`
- **Verify:** prompt count matches scene count ({n} scenes)
- **Status:** [ ] pending

### Phase 7: First-Pass Scene Generation
- **Skill:** `generating-scene-pack`
- **Requires:** `assets/video-prompts.json`, `assets/packs/`
- **Produces:** `assets/scenes/` ({n} clips)
- **Verify:** clip count matches scene count, each clip is non-zero
- **Status:** [ ] pending

### Phase 8: Compile Draft Video
- **Skill:** `compiling-video`
- **Requires:** `assets/scenes/`, `assets/song.mp3`, `assets/subtitle.srt`
- **Produces:** `output/draft.mp4`
- **Verify:** `output/draft.mp4` duration within 10% of `song.mp3` duration
- **Status:** [ ] pending

### Phase 9: Retention-Driven Development Pass
- **Skill:** `retention-driven-development`
- **Requires:** `output/draft.mp4`, `assets/shot-details.json`
- **Produces:** `logs/retention-report.json`, updated `assets/scenes/`
- **Verify:** all scenes below threshold replaced or documented as accepted
- **Status:** [ ] pending

### Phase 10: Recompile
- **Skill:** `compiling-video`
- **Requires:** `assets/scenes/`, `assets/song.mp3`, `assets/subtitle.srt`, `logs/retention-report.json`
- **Produces:** `output/final.mp4`
- **Verify:** `output/final.mp4` is newer than `output/draft.mp4`
- **Status:** [ ] pending

### Phase 11: Request Video Review
- **Skill:** `requesting-video-review`
- **Requires:** `output/final.mp4`
- **Produces:** `logs/review-feedback.md`
- **Verify:** `logs/review-feedback.md` contains explicit pass or fail decision
- **Status:** [ ] pending

### Phase 12: Generate Thumbnail
- **Skill:** `generating-thumbnail`
- **Requires:** `output/final.mp4`
- **Produces:** `output/thumbnail.jpg`
- **Verify:** `output/thumbnail.jpg` dimensions ≥ 1280×720
- **Status:** [ ] pending

### Phase 13: Delivery
- **Skill:** *(platform-specific — no Violyra skill)*
- **Requires:** `output/final.mp4`, `output/thumbnail.jpg`, `logs/review-feedback.md`
- **Verify:** review-feedback.md shows pass; files are present in `output/`
- **Status:** [ ] pending

## Scene List

| Scene | Section | Character | Lyrics | Prompt summary |
|---|---|---|---|---|
{storyboard scenes table}

## Notes

{Any decisions made during planning: lyric exclusions, reference-image decisions, model parameter choices.}
```

Fill `{reference_images_note}` with `*(optional — not required for this production)*` or `*(required — characters: {list})*` based on `video-idea.md`.

Fill `{n}` scene count placeholders with the actual storyboard scene count.

### Step 4: Review `production-plan.json` and `video-plan.md`

Use `plan-document-reviewer-prompt.md` to self-review both artifacts before showing them to the user. Fix any issues inline.

## Plan Document Review

After writing all three artifacts, read `skills/writing-video-plan/plan-document-reviewer-prompt.md` and run the checklist against `video-plan.md` and `production-plan.json`.

## After Writing

Tell the user:
> "Production plan written. Three artifacts are ready:
> - `{project_dir}/assets/storyboard.json` — {n} scenes
> - `{project_dir}/docs/video-plan.md` — 13-phase runbook
> - `{project_dir}/assets/production-plan.json` — execution manifest
>
> Current status: Phase {next_phase_number} ({next_phase_title}) is next. {what it requires or what is blocking it}
>
> Run `executing-video-plan` to start execution."

## Logging

Log to `{project_dir}/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `idea_doc_path`, `style`, `aspect_ratio`
- **On completion** — event `completed`, outputs: `storyboard_path`, `video_plan_path`, `production_plan_path`, `shot_count`
