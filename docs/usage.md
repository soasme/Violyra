# Violyra Usage Guide

This guide describes the current lyric-driven happy path from a rough idea to a delivery-ready video. Follow it end-to-end or pick individual phases to slot into your own workflow.

If your project does not use a song file or lyric alignment, treat this as the music-video path rather than the universal path for every Violyra project.

For variant projects, put required source files under `{project_dir}/assets/` and declare them in `video-idea.md` under `## Source Assets`. `writing-video-plan` should read that section instead of assuming the same files for every project.

## Prerequisites

- Node.js 18+
- `pnpm install` run at the repo root
- API credentials in `.env` (see `.env.example`)
- A project directory, e.g. `assets/my-video/`

## Phase Overview

```
brainstorming-video-idea
  → setup-video-project
  → [supply lyrics.txt, optionally song.mp3]
  → writing-video-plan                ← writes storyboard.json + video-plan.md + production-plan.json
  → executing-video-plan        ← manages all 13 phases via production-plan.json
      Phase 2:  aligning-lyrics when song.mp3 is available
      Phase 3:  running-video-production-pipeline  ← chapters/chapter-01/*
      Phase 4:  lyric-scene reconciliation (optional, manual)
      Phase 5:  using-replicate-model (reference images / start frames, optional)
      Phase 6:  writing-video-prompt
      Phase 7:  using-replicate-model     ← chapter-local scene clips + manifest
      Phase 8:  compiling-video           ← final/draft.mp4
      Phase 9:  retention-driven-development
      Phase 10: compiling-video           ← final/final.mp4
      Phase 11: requesting-video-review
      Phase 12: generating-thumbnail
      Phase 13: delivery
```

## Step-by-Step

### 1. Brainstorm the idea

```
/brainstorming-video-idea
```

The agent will ask one question at a time, propose 2–3 creative directions, and converge on a design with you. Nothing is written until you approve. Output: `{project_dir}/docs/video-idea.md`.

### 2. Set up the project workspace

```
/setup-video-project
```

Creates the directory structure and `project.json`. Output: `{project_dir}/project.json`, `assets/`, `docs/`, `logs/`, `final/`, `global/`, `characters/`, `chapters/`.

### 3. Supply the project's declared source assets

Put source files under `{project_dir}/assets/` and declare them in `video-idea.md`.

For the lyric-driven happy path, that usually means:

Copy your lyric file manually:
```bash
cp /path/to/lyrics.txt {project_dir}/assets/lyrics.txt
```

If you already have the audio, place it too:
```bash
cp /path/to/song.mp3 {project_dir}/assets/song.mp3
```

**Lyrics format:** One line per sung line. Mark non-sung lines (section headers, decorations) with a `#` prefix so the pipeline can exclude them consistently:
```
# Verse 1
When the morning light breaks through
And the fields are green and new
```

### 4. Write the production plan

```
/writing-video-plan
```

Reads `video-idea.md`, the declared source assets needed for planning, and the canonical workflow model. Writes three artifacts:
- `assets/storyboard.json` — scene-level creative input for generation
- `docs/video-plan.md` — human runbook with resolved chapter and phase details
- `assets/production-plan.json` — machine execution manifest for `executing-video-plan`

If some declared execution-time assets are not available yet, that is fine. The plan will show `source-assets` as blocked until you add them.

### 5. Execute the plan

```
/executing-video-plan
```

Reads `production-plan.json`, identifies the next actionable phase, and executes it. Reports blockers in plan terms (current phase, missing file, recommended next skill). Continue running until all phases complete.

#### Phase 2 — Source assets

When `song.mp3` is present, `aligning-lyrics` produces:
- `assets/aligned_lyrics.json`
- `assets/subtitle.srt`
- `assets/subtitle.lrc`

#### Phase 3 — Production pipeline

Uses the default chapter directory `chapters/chapter-01/`. Produces:
- `chapters/chapter-01/chapter.json`
- `chapters/chapter-01/shot-list.json`
- `chapters/chapter-01/extraction-report.json`
- `chapters/chapter-01/shot-details.json`
- `chapters/chapter-01/consistency-report.json`
- packs under `global/` and `characters/`

#### Phase 4 — Lyric-scene reconciliation *(optional, manual)*

Only enable this if aligned lyric segments and the planned scene count diverge. Write the reconciliation decision to `logs/lyric-scene-reconciliation.md`.

#### Phase 5 — Reference images *(run when characters appear in 3+ scenes)*

Use `using-replicate-model` with an image model such as Nano Banana or FLUX to generate recurring-character references and optional start frames. Save them under:
- `assets/reference-images/`
- `assets/start-frames/`

```
/using-replicate-model
```

#### Phase 7 — Scene generation

Generate one clip per prompt using your chosen video model. Save outputs under:
- `chapters/chapter-01/scenes/`
- `chapters/chapter-01/scene-generation.manifest.json`

Scenes within a chapter can run in parallel. The default generation skill is `using-replicate-model`.

#### Phase 8 → Phase 10 — Draft, retention pass, recompile

```
/compiling-video                  # → final/draft.mp4
/retention-driven-development     # → chapters/chapter-01/retention-report.json
/compiling-video                  # → final/final.mp4
```

Do not skip the retention pass. It is the primary mechanism for improving clip quality before delivery.

#### Phase 11 — Video review

```
/requesting-video-review
```

Runs the review workflow against `final/final.mp4`. Output: `logs/review-feedback.md`. Do not deliver until the review says `Status: pass`.

#### Phase 12 — Thumbnail

```
/generating-thumbnail
```

Use the final render to extract a few strong reference frames, generate multiple thumbnail candidates, and save the winner as `final/thumbnail.jpg` (≥ 1280×720).

#### Phase 13 — Delivery

Upload `final/final.mp4` and `final/thumbnail.jpg` to your target platform. No Violyra skill exists for this phase yet — delivery is manual.

## Checking Phase Status

Read `docs/video-plan.md` to see which phases are complete. Or run `executing-video-plan` — it will identify the current phase and report what is needed to continue.

## Common Issues

**"song.mp3 missing"** — This matters only for lyric-driven projects that use a local song file. Supply `{project_dir}/assets/song.mp3` and run `executing-video-plan` again. This blocks only the `source-assets` phase.

**"chapter.json is empty"** or **"`chapters/chapter-01/scenes/` is empty"** — These are only blockers once the plan reaches those phases. Check `docs/video-plan.md` to confirm the current phase before treating them as errors.

**Character drifted off-spec in generation** — Enable Phase 5, generate references or start frames under `assets/reference-images/` / `assets/start-frames/`, regenerate affected scenes, and recompile.

**Lyric count and scene count don't match** — Enable Phase 4, write `logs/lyric-scene-reconciliation.md`, then continue.

## All Skills

| Skill | Phase | Produces |
|---|---|---|
| `brainstorming-video-idea` | Pre-planning | `docs/video-idea.md` |
| `setup-video-project` | 1 | `project.json`, workspace dirs |
| `aligning-lyrics` | 2 | `aligned_lyrics.json`, `subtitle.srt`, `subtitle.lrc` |
| `writing-video-plan` | — | `storyboard.json`, `video-plan.md`, `production-plan.json` |
| `running-video-production-pipeline` | 3 | `chapters/chapter-01/*`, `global/`, `characters/` |
| *(manual reconciliation)* | 4 | `logs/lyric-scene-reconciliation.md` |
| `using-replicate-model` | 5, 7 | `assets/reference-images/`, `assets/start-frames/`, `chapters/chapter-01/scenes/`, generation manifest |
| `writing-video-prompt` | 6 | `chapters/chapter-01/video-prompts.json` |
| `compiling-video` | 8, 10 | `final/draft.mp4`, `final/final.mp4` |
| `retention-driven-development` | 9 | `chapters/chapter-01/retention-report.json`, regenerated scenes |
| `requesting-video-review` | 11 | `logs/review-feedback.md` |
| `generating-thumbnail` | 12 | `final/thumbnail.jpg` |
| *(delivery — platform-specific)* | 13 | `final/final.mp4` + `final/thumbnail.jpg` uploaded to platform |
