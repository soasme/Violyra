---
name: setup-video-project
description: Use after design approval from brainstorming-video-idea. Creates workspace directory structure and initializes project.json with seed, style, and model defaults.
---

# Setup Video Project

Creates the isolated workspace for a new video production after design approval.

## Inputs

- `--base-dir <path>` — project root to create
- Approved design doc at `<base-dir>/docs/video-idea.md` (or values provided directly)

## Workflow

1. If `<base-dir>/project.json` already exists, confirm with user before overwriting.
2. Create directory structure:
   ```
   <base-dir>/
   ├── assets/              ← lyrics, song, storyboard, aligned lyrics
   ├── docs/
   │   └── video-idea.md    (already exists from brainstorming)
   ├── logs/                ← production.jsonl and review logs
   ├── final/               ← draft/final renders and thumbnail
   ├── global/              ← actor/scene/prop/costume packs
   ├── characters/          ← character packs
   └── chapters/            ← one subdir per chapter
   ```
3. Write `<base-dir>/project.json`:
   ```json
   {
     "$schemaVersion": "1.0",
     "title": "<video title>",
     "seed": <integer from design>,
     "style": "<style description from design>",
     "defaultModel": "bytedance/seedance-1.5-pro",
     "fps": 24,
     "resolution": "1920x1080",
     "assetDirs": ["."],
     "createdAt": "<ISO timestamp>"
   }
   ```
4. Confirm workspace is ready.

## Output

- `<base-dir>/project.json`
- `<base-dir>/assets/`, `<base-dir>/docs/`, `<base-dir>/logs/`, `<base-dir>/final/`
- `<base-dir>/global/`, `<base-dir>/characters/`, `<base-dir>/chapters/` (empty directories)

## After Setup

Transition to `writing-video-plan`.

## Asset Directories

`assetDirs` controls where skills look for assets (actor packs, reference images, prop files). Default when absent: `["."]` — the project directory itself.

To reference assets from a shared library without copying them:

```json
"assetDirs": [".", "/Users/me/studio-assets", "/Volumes/NAS/shared"]
```

Resolution order: first matching path wins. Skills write output only to the project directory — external dirs are treated as read-only in normal production flow. An agent may write to an external dir only when the user explicitly instructs it to move or promote assets.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `project_name`
**On completion** — key `outputs`: `project_json_path`, `dirs_created` (array of created directory paths)
