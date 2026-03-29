# Violyra Usage Guide

This guide describes the full happy-path from a rough idea to a delivery-ready video. Follow it end-to-end or pick individual phases to slot into your own workflow.

## Prerequisites

- Node.js 18+
- `pnpm install` run at the repo root
- API credentials in `.env` (see `.env.example`)
- A project directory, e.g. `assets/my-video/`

## Phase Overview

```
brainstorming-video-idea
  → setup-video-project
  → [supply song.mp3 + lyrics.txt]
  → aligning-lyrics
  → writing-video-plan                ← writes storyboard.json + video-plan.md + production-plan.json
  → executing-video-plan
      Phase 3:  running-video-production-pipeline
      Phase 4:  aligning-lyrics (alignment check, optional)
      Phase 5:  generating-character-pack (reference images, if needed)
      Phase 6:  writing-video-prompt
      Phase 7:  generating-scene-pack
      Phase 8:  compiling-video           ← output/draft.mp4
      Phase 9:  retention-driven-development
      Phase 10: compiling-video           ← output/final.mp4
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

Creates the directory structure and `project.json`. Output: `{project_dir}/project.json`, `assets/`, `docs/`, `logs/`.

### 3. Supply source audio and lyrics

Copy your files manually:
```bash
cp /path/to/song.mp3 {project_dir}/assets/song.mp3
cp /path/to/lyrics.txt {project_dir}/assets/lyrics.txt
```

**Lyrics format:** One line per sung line. Mark non-sung lines (section headers, decorations) with a `#` prefix so the pipeline can exclude them consistently:
```
# Verse 1
When the morning light breaks through
And the fields are green and new
```

### 4. Align lyrics to audio

```
/aligning-lyrics
```

Segments lyrics to audio timing. Output: `aligned_lyrics.json`, `subtitle.srt`, `subtitle.lrc`.

### 5. Write the production plan

```
/writing-video-plan
```

Reads `video-idea.md` and writes three artifacts:
- `assets/storyboard.json` — scene-level creative input for generation
- `docs/video-plan.md` — human runbook with 13 phases and verification criteria
- `assets/production-plan.json` — machine execution manifest for `executing-video-plan`

### 6. Execute the plan

```
/executing-video-plan
```

Reads `production-plan.json`, identifies the next runnable phase, and executes it. Reports blockers in plan terms (current phase, missing file, recommended next skill). Continue running until all phases complete.

#### Phase 3 — Production pipeline

Produces `chapter.json`, `shot-list.json`, `shot-details.json`, and packs in `assets/packs/`.

#### Phase 5 — Reference images *(run when characters appear in 3+ scenes)*

Generates reference images for named characters to maintain visual consistency across shots. Skip for single-appearance characters or abstract visual content.

```
/generating-character-pack
```

#### Phase 7 — Scene generation

Generates video clips for each scene. Scenes within a chapter run in parallel; chapters are sequential.

#### Phase 8 → Phase 10 — Draft, retention pass, recompile

```
/compiling-video          # → output/draft.mp4
/retention-driven-development   # scores clips, replaces weak ones
/compiling-video          # → output/final.mp4
```

Do not skip the retention pass. It is the primary mechanism for improving clip quality before delivery.

#### Phase 11 — Video review

```
/requesting-video-review
```

Runs the review workflow against `output/final.mp4`. Output: `logs/review-feedback.md`. Do not deliver until the review passes.

#### Phase 12 — Thumbnail

```
/generating-thumbnail
```

Extracts candidate frames from `output/final.mp4`, generates thumbnail options, and selects the strongest. Output: `output/thumbnail.jpg` (≥ 1280×720).

#### Phase 13 — Delivery

Upload `output/final.mp4` and `output/thumbnail.jpg` to your target platform. No Violyra skill for this phase — delivery is platform-specific.

## Checking Phase Status

Read `docs/video-plan.md` to see which phases are complete. Or run `executing-video-plan` — it will identify the current phase and report what is needed to continue.

## Common Issues

**"song.mp3 missing"** — Supply the file at `{project_dir}/assets/song.mp3` and run `executing-video-plan` again.

**"chapter.json is empty"** or **"scenes/ is empty"** — These are not immediate blockers if you haven't reached those phases yet. Check `docs/video-plan.md` to confirm which phase is current.

**Character drifted off-spec in generation** — Reference images were likely not generated or not used. Run Phase 5 (`/generating-character-pack`), regenerate affected scenes, and recompile.

**Lyric count and scene count don't match** — Run Phase 4 (`/aligning-lyrics`) to reconcile. Document the decision in `project.json`.

## All Skills

| Skill | Phase | Produces |
|---|---|---|
| `brainstorming-video-idea` | Pre-planning | `docs/video-idea.md` |
| `setup-video-project` | 1 | `project.json`, workspace dirs |
| `aligning-lyrics` | 2, 4 | `aligned_lyrics.json`, `subtitle.srt`, `subtitle.lrc` |
| `writing-video-plan` | — | `storyboard.json`, `video-plan.md`, `production-plan.json` |
| `running-video-production-pipeline` | 3 | `chapter.json`, `shot-list.json`, `shot-details.json`, packs |
| `generating-character-pack` | 5 | `reference-frames/`, actor packs |
| `writing-video-prompt` | 6 | `video-prompts.json` |
| `generating-scene-pack` | 7 | `assets/scenes/` |
| `compiling-video` | 8, 10 | `output/draft.mp4`, `output/final.mp4` |
| `retention-driven-development` | 9 | `logs/retention-report.json`, updated scenes |
| `requesting-video-review` | 11 | `logs/review-feedback.md` |
| `generating-thumbnail` | 12 | `output/thumbnail.jpg` |
