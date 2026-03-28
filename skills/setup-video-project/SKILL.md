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
   ├── docs/
   │   └── video-idea.md    (already exists from brainstorming)
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
     "createdAt": "<ISO timestamp>"
   }
   ```
4. Confirm workspace is ready.

## Output

- `<base-dir>/project.json`
- `<base-dir>/global/`, `<base-dir>/characters/`, `<base-dir>/chapters/` (empty directories)

## After Setup

Transition to `writing-plans` for the full production breakdown.
