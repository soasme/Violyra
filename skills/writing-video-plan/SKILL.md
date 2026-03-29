---
name: writing-video-plan
description: Write the production plan for an approved video idea. Emits storyboard.json, video-plan.md (13-phase runbook), and production-plan.json (execution manifest). Run after brainstorming-video-idea.
---

# Writing Video Plan

Turn an approved `video-idea.md` into a full production plan. Produces three artifacts with different jobs: a creative scene input for generation, a human-readable runbook, and a machine-readable execution manifest.

## Inputs

Collect before writing:

1. `{project_dir}/docs/video-idea.md` — approved design doc from brainstorming
2. Project-specific files declared in `video-idea.md` under `## Source Assets`
3. `skills/lib/workflow.json` — canonical phase definitions (read to populate production-plan.json)
4. `user_requirements` — any additional constraints the user specified

If `video-idea.md` does not exist, do not proceed. Ask the user to run `brainstorming-video-idea` first.

Treat `video-idea.md` as the source of truth for required assets. The user can place any project-specific files under `{project_dir}/assets/` and declare them in `## Source Assets`.

Do not invent source text. If the storyboard depends on lyrics, screenplay text, or another narrative source, read it from the declared asset path and preserve it exactly.

## Outputs

| File | Job |
|---|---|
| `{project_dir}/assets/storyboard.json` | Scene-level creative input for video generation |
| `{project_dir}/docs/video-plan.md` | Human runbook — phases, artifacts, next steps |
| `{project_dir}/assets/production-plan.json` | Machine execution manifest consumed by `executing-video-plan` |

## Workflow

### Step 1: Write `storyboard.json`

Follow the existing storyboard contract in `references/storyboard-format.md`.

- Read the narrative source declared in `video-idea.md`.
  - For lyric-driven projects: read the declared lyrics file under `assets/`, treat lines prefixed with `#` as non-sung section markers, and split sung lyrics into sections.
  - For screenplay-driven projects: read the declared screenplay / treatment / brief file under `assets/`.
  - If the narrative source needed to author the storyboard is missing, stop and ask for that specific file path from `## Source Assets`.
- Map source text to scenes according to the approved design. Default lyric-driven ratio: 2 sung lines per scene.
- Set one `character` focus per scene unless ensemble is required.
- Write a concrete `prompt` with subject action, environment motion, and camera movement.
- Default output: `{project_dir}/assets/storyboard.json`

### Step 2: Write `production-plan.json`

Read `skills/lib/workflow.json`. For each phase, populate:
- `project_dir`: the actual project directory path
- `chapter_dir`: use `{project_dir}/chapters/chapter-01` for the default happy path unless the user explicitly wants a different chapter layout
- `requires`: resolve `{project_dir}` template variables
- `requires`: resolve `{chapter_dir}` template variables
- `produces`: resolve `{project_dir}` template variables
- `produces`: resolve `{chapter_dir}` template variables
- `status`: initialize to `"pending"` unless artifacts already exist
- `enabled`: for optional phases, derive whether they should participate in execution

For the `source-assets` phase specifically, do not blindly copy the template values. Rewrite the phase from `video-idea.md`:

- `requires`: all declared source assets that must exist before execution can proceed
- `blocks_if_missing`: the subset of those assets that are still absent
- `default_skill`:
  - `aligning-lyrics` for lyric-driven projects with a declared song file plus lyric file
  - `null` for projects whose source-assets phase is manual intake only
- `produces` / `verification`: project-specific preprocessing outputs if applicable
  - lyric-driven example: `aligned_lyrics.json`, `subtitle.srt`, `subtitle.lrc`
  - non-lyric example: possibly no generated outputs, just confirmation that declared source assets are present
- `note`: describe the project mode in plain language, for example `This source-assets phase is manual because the project uses screenplay text and reference stills, not lyric alignment.`

```json
{
  "$schemaVersion": "1.0",
  "project_dir": "{project_dir}",
  "chapter_dir": "{project_dir}/chapters/chapter-01",
  "generated_at": "{ISO 8601 timestamp}",
  "source_idea": "{project_dir}/docs/video-idea.md",
  "phases": [
    {
      "id": "project-setup",
      "title": "Set up project workspace",
      "default_skill": "setup-video-project",
      "status": "pending",
      "enabled": true,
      "requires": [
        "{project_dir}/docs/video-idea.md"
      ],
      "produces": [
        "{project_dir}/project.json",
        "{project_dir}/docs/",
        "{project_dir}/assets/",
        "{project_dir}/logs/",
        "{project_dir}/final/",
        "{project_dir}/global/",
        "{project_dir}/characters/",
        "{project_dir}/chapters/"
      ],
      "verification": [
        "project.json exists and is valid JSON",
        "assets/, logs/, final/, global/, characters/, and chapters/ directories exist"
      ],
      "optional": false,
      "manual": false
    }
  ]
}
```

Mark phases as `"status": "completed"` for any phase whose `produces` artifacts already exist in the workspace.

For optional phases:

- `lyric-scene-reconciliation` — set `"enabled": true` only when the idea doc or existing lyric metadata already indicates a likely mismatch between sung lines and planned scenes.
- `reference-images` — set `"enabled": true` when a named character appears in 3 or more scenes, or when the design doc explicitly requires reference images or start frames.

If an optional phase is not needed yet, leave `"status": "pending"` and `"enabled": false`. The executor treats it as non-blocking.

If a declared source asset is needed for storyboard authoring and is missing, stop before writing `storyboard.json`. If a declared source asset is only needed later for execution, keep writing the plan and mark `source-assets` as blocked in `production-plan.json`.

### Step 3: Write `video-plan.md`

This is the human runbook. A user or agent opening it should immediately know: what exists, what the next step is, and how to verify each phase.

Structure:

```markdown
# Video Production Plan: {title}

**Project:** `{project_dir}`
**Primary chapter:** `{chapter_dir}`
**Idea doc:** `{project_dir}/docs/video-idea.md`
**Generated:** {date}

## Current Status

{One sentence: which phase is next and what it needs.}

## Phase Checklist

Render one section per phase from `production-plan.json`, using the actual resolved fields:

### Phase {n}: {phase.title}
- **Skill:** `{phase.default_skill}` or `manual`
- **Status:** `[ ] pending`, `[x] completed`, or `[~] skipped`
- **Enabled:** `yes` or `no` for optional phases
- **Requires:** {resolved phase.requires}
- **Produces:** {resolved phase.produces}
- **Verify:** {phase.verification}
- **Notes:** {phase.note if present}

## Scene List

| Scene | Section | Character | Lyrics | Prompt summary |
|---|---|---|---|---|
{storyboard scenes table}

## Notes

{Any decisions made during planning: lyric exclusions, reference-image decisions, model parameter choices.}
```

The `Current Status` sentence should be derived from the first actionable phase:

- If a required artifact is missing, say which phase is blocked and which file is missing.
- If an optional phase is disabled, do not describe it as the next step.
- If a manual phase is next, say exactly what the user must provide or confirm.

### Step 4: Review `production-plan.json` and `video-plan.md`

Use `plan-document-reviewer-prompt.md` to self-review both artifacts before showing them to the user. Fix any issues inline.

## Plan Document Review

After writing all three artifacts, read `skills/writing-video-plan/plan-document-reviewer-prompt.md` and run the checklist against `video-plan.md` and `production-plan.json`.

## After Writing

Tell the user:
> "Production plan written. Three artifacts are ready:
> - `{project_dir}/assets/storyboard.json` — {n} scenes
> - `{project_dir}/docs/video-plan.md` — chapter-aware phase runbook
> - `{project_dir}/assets/production-plan.json` — execution manifest
>
> Current status: Phase {next_phase_number} ({next_phase_title}) is next. {what it requires or what is blocking it}
>
> Run `executing-video-plan` to start execution."

## Logging

Log to `{project_dir}/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `idea_doc_path`, `style`, `aspect_ratio`
- **On completion** — event `completed`, outputs: `storyboard_path`, `video_plan_path`, `production_plan_path`, `shot_count`
