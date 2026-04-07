---
name: setup-video-project
description: Use after design approval from brainstorming-video-idea. Creates the project workspace, project.json, docs scaffolds, and standard assets directories.
---

# Setup Video Project

Creates the isolated workspace for a new video production after design approval.

## Inputs

- `--base-dir <path>` — project root to create
- approved design doc at `<base-dir>/docs/idea.md` (or values provided directly)

## Workflow

1. If `<base-dir>/project.json` already exists, confirm with user before overwriting.
2. If legacy `<base-dir>/docs/video-idea.md` exists and `<base-dir>/docs/idea.md` does not, migrate it to `idea.md`.
3. Create directory structure:
   ```
   <base-dir>/
   ├── docs/
   │   ├── idea.md          (already exists from brainstorming)
   │   ├── plan.md          (create stub if missing)
   │   └── exec.md          (create stub if missing)
   ├── assets/
   │   ├── images/
   │   ├── videos/
   │   ├── audios/
   │   └── fonts/
   ├── logs/                ← production.jsonl and review logs
   ├── global/              ← actor/scene/prop/costume packs
   ├── characters/          ← character packs
   └── chapters/            ← one subdir per chapter
   ```
4. Initialize `<base-dir>/docs/plan.md` if missing:
   ```md
   # Plan: <project title>

   ## Current State
   - Idea approved in `docs/idea.md`

   ## Tasks
   - [ ] Define first production task

   ## Blockers
   - None yet

   ## Next Step
   - Write or refine this plan before execution
   ```
5. Initialize `<base-dir>/docs/exec.md` if missing:
   ```md
   # Execution Log: <project title>

   ## Status
   - Not started

   ## Timeline
   - <date>: project scaffold created

   ## Review Notes
   - None yet
   ```
6. Write `<base-dir>/project.json`:
   ```json
   {
     "$schemaVersion": "1.0",
     "title": "<video title>",
     "seed": <integer from design>,
     "style": "<style description from design>",
     "defaultModel": "bytedance/seedance-1.5-pro",
     "fps": 24,
     "resolution": "1920x1080",
     "assetDirs": [".", "assets/images", "assets/videos", "assets/audios", "assets/fonts"],
     "createdAt": "<ISO timestamp>"
   }
   ```
7. Confirm workspace is ready.

## Output

- `<base-dir>/docs/idea.md`
- `<base-dir>/docs/plan.md`
- `<base-dir>/docs/exec.md`
- `<base-dir>/assets/images/`
- `<base-dir>/assets/videos/`
- `<base-dir>/assets/audios/`
- `<base-dir>/assets/fonts/`
- `<base-dir>/logs/`
- `<base-dir>/project.json`
- `<base-dir>/global/`, `<base-dir>/characters/`, `<base-dir>/chapters/` (empty directories)

## After Setup

Transition to `writing-video-plan` to turn the approved idea into an executable plan. For direct manual runs, `executing-video-plan` should treat `docs/plan.md` as the source of truth and update `docs/exec.md`.

## Project Layout Rules

- workflow documents live under `<base-dir>/docs/`
- generated media and media-adjacent artifacts live under `<base-dir>/assets/`
- standard asset buckets are `<base-dir>/assets/images/`, `<base-dir>/assets/videos/`, `<base-dir>/assets/audios/`, and `<base-dir>/assets/fonts/`
- logs live under `<base-dir>/logs/`

## Asset Directories

`assetDirs` controls where skills look for assets (actor packs, reference images, prop files). Recommended project default: `[".", "assets/images", "assets/videos", "assets/audios", "assets/fonts"]`.

To reference assets from a shared library without copying them:

```json
"assetDirs": [".", "/Users/me/studio-assets", "/Volumes/NAS/shared"]
```

Resolution order: first matching path wins. Skills write output only to the project directory. External dirs are treated as read-only in normal production flow unless the user explicitly asks to promote assets there.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `project_name`
**On completion** — key `outputs`: `project_json_path`, `workflow_docs_ready` (true/false), `dirs_created` (array of created directory paths)
