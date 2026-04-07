---
name: setup-video-project
description: Use after design approval from brainstorming-video-idea. Creates the project workspace, SPEC.md stub, workflow docs, and standard assets directories.
---

# Setup Video Project

Creates the isolated workspace for a new video production after design approval.

## Inputs

- `--base-dir <path>` — project root to create
- approved design doc at `<base-dir>/docs/idea.md`, or direct values for title, seed, and style when the idea doc does not exist yet

## Workflow

1. If `<base-dir>/SPEC.md` already exists, confirm with user before overwriting its stub content.
2. If legacy `<base-dir>/docs/video-idea.md` exists and `<base-dir>/docs/idea.md` does not, migrate it to `idea.md`.
3. Create directory structure:
   ```
   <base-dir>/
   ├── SPEC.md
   ├── docs/
   │   ├── idea.md          (existing or created from direct values)
   │   ├── plan.md          (create stub if missing)
   │   └── exec.md          (create stub if missing)
   ├── assets/
   │   ├── images/
   │   ├── videos/
   │   ├── audios/
   │   └── fonts/
   └── logs/                ← production.jsonl and review logs
   ```
4. If `<base-dir>/docs/idea.md` is still missing after migration, create it from the approved direct values:
   ```md
   # Idea: <video title>

   ## Summary
   - Title: <video title>
   - Seed: <integer from design>
   - Style: <style description from design>

   ## Approval
   - Approved for project setup
   ```
5. Initialize `<base-dir>/SPEC.md` if missing:
   ```md
   # Spec: <project title>

   ## Source
   - Idea doc: `docs/idea.md`
   - Status: draft

   ## Project Contract
   - Goal: <project goal>
   - Default model: bytedance/seedance-1.5-pro
   - fps: 24
   - resolution: 1920x1080

   ## Asset Directories
   - `.`
   - `assets/images`
   - `assets/videos`
   - `assets/audios`
   - `assets/fonts`

   ## Assets
   | Path | Purpose | Required by | Status |
   |---|---|---|---|
   | assets/... | ... | planning / execution | pending |

   ## Characters
   - Derive from `docs/idea.md`

   ## Structure
   - Derive chapters, scenes, and continuity requirements from `docs/idea.md`

   ## Notes
   - Keep this file text-first.
   - If machine-readable snippets are needed here, wrap them in fenced `json` code blocks.
   ```
6. Initialize `<base-dir>/docs/plan.md` if missing:
   ```md
   # Plan: <project title>

   ## Current State
   - Idea approved in `docs/idea.md`
   - Project spec: `SPEC.md`
   - Assets root: `assets/`

   ## Spec Tasks
   - [ ] Refine `SPEC.md` from the approved idea

   ## Asset Tasks
   - [ ] Define first production task against `assets/`

   ## Blockers
   - None yet

   ## Next Step
   - Write or refine this plan to manage `SPEC.md` and `assets/` before execution
   ```
7. Initialize `<base-dir>/docs/exec.md` if missing:
   ```md
   # Execution Log: <project title>

   ## Status
   - Not started

   ## Timeline
   - <date>: project scaffold created

   ## Review Notes
   - None yet
   ```
8. Confirm workspace is ready.

## Output

- `<base-dir>/docs/idea.md` (preserved, migrated, or created from direct values)
- `<base-dir>/SPEC.md`
- `<base-dir>/docs/plan.md`
- `<base-dir>/docs/exec.md`
- `<base-dir>/assets/images/`
- `<base-dir>/assets/videos/`
- `<base-dir>/assets/audios/`
- `<base-dir>/assets/fonts/`
- `<base-dir>/logs/`

## After Setup

Transition to `writing-video-plan` to turn the approved idea into a real `SPEC.md` plus an executable plan. For direct manual runs, `executing-video-plan` should treat `docs/plan.md` as the source of truth for next actions and `SPEC.md` as the project contract.

## Project Layout Rules

- project spec lives at `<base-dir>/SPEC.md`
- workflow documents live under `<base-dir>/docs/`
- generated media and media-adjacent artifacts live under `<base-dir>/assets/`
- standard asset buckets are `<base-dir>/assets/images/`, `<base-dir>/assets/videos/`, `<base-dir>/assets/audios/`, and `<base-dir>/assets/fonts/`
- logs live under `<base-dir>/logs/`
- project-level characters, chapter structure, and similar planning detail belong in `SPEC.md` as text first

## Asset Directories

Record asset lookup order in `SPEC.md` as a Markdown list under `## Asset Directories`. Recommended project default:

```md
## Asset Directories
- `.`
- `assets/images`
- `assets/videos`
- `assets/audios`
- `assets/fonts`
```

To reference assets from a shared library without copying them, add more list items:

```md
## Asset Directories
- `.`
- `/Users/me/studio-assets`
- `/Volumes/NAS/shared`
```

Resolution order: first matching path wins. Skills write output only to the project directory. External dirs are treated as read-only in normal production flow unless the user explicitly asks to promote assets there.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `project_name`
**On completion** — key `outputs`: `spec_path`, `workflow_docs_ready` (true/false), `dirs_created` (array of created directory paths)
