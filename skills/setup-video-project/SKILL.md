---
name: setup-video-project
description: Use after idea approval. Creates the project workspace, preserves or scaffolds SPEC.md, creates PLAN.md, and prepares root assets and logs.
---

# Setup Video Project

Creates the isolated workspace for a new video production after idea approval.

## Inputs

- `--base-dir <path>` — project root to create
- approved idea in `<base-dir>/SPEC.md` under `# Idea`, or direct values for title, seed, and style when the spec does not exist yet
- this skill writes the approved idea into `SPEC.md`; it does not create a separate idea document

## Workflow

1. If `<base-dir>/SPEC.md` already exists, preserve its existing `# Idea` section and confirm before overwriting any other authored content.
2. If legacy `<base-dir>/docs/video-idea.md` or `<base-dir>/docs/idea.md` exists and `<base-dir>/SPEC.md` does not yet contain `# Idea`, migrate that content into `SPEC.md`.
3. Create directory structure:
   ```
   <base-dir>/
   ├── SPEC.md
   ├── PLAN.md
   ├── assets/
   │   ├── images/
   │   ├── videos/
   │   ├── audios/
   │   └── fonts/
   └── logs/
   ```
4. If `<base-dir>/SPEC.md` is still missing after migration, create it from the approved direct values:
   ```md
   # Spec: <video title>

   # Status
   - Idea approved
   - Setup in progress

   # Idea

   ## Summary
   - Title: <video title>
   - Seed: <integer from design>
   - Style: <style description from design>

   ## Approval
   - Approved for project setup
   ```
5. Ensure `<base-dir>/SPEC.md` includes these sections if they are missing:
   ```md
   # Project Contract
   - Goal: <project goal>
   - Default model: bytedance/seedance-1.5-pro
   - fps: 24
   - resolution: 1920x1080

   # Asset Directories
   - `.`
   - `assets`
   - `assets/images`
   - `assets/videos`
   - `assets/audios`
   - `assets/fonts`

   # Assets
   | Path | Purpose | Required by | Status |
   |---|---|---|---|
   | assets/... | ... | planning / execution | pending |

   # Characters
   - Derive from `# Idea`

   # Structure
   - Derive chapters, scenes, and continuity requirements from `# Idea`

   # Notes
   - Keep this file text-first.
   - If machine-readable snippets are needed here, wrap them in fenced `json` code blocks.
   ```
6. Initialize `<base-dir>/PLAN.md` if missing:
   ```md
   # Iteration 1

   ## Goal
   - Initial planning pass for <project title>

   ## Current State
   - Idea approved in `SPEC.md`
   - Project spec: `SPEC.md`
   - Assets root: `assets/`
   - Logs root: `logs/`

   ## Spec Tasks
   - [ ] Refine `SPEC.md` from the approved idea

   ## Asset Tasks
   - [ ] Define first production task against `assets/`

   ## Blockers
   - None yet

   ## Review Notes
   - None yet

   ## Run Notes
   - <date>: project scaffold created

   ## Next Step
   - Write or refine this plan to manage `SPEC.md`, `assets/`, and `logs/` before execution
   ```
7. If the user later asks to change scope, priorities, or deliverables, append `# Iteration 2`, `# Iteration 3`, and so on. Do not erase earlier iterations; keep them as plan history.
8. Confirm workspace is ready.

## Output

- `<base-dir>/SPEC.md`
- `<base-dir>/PLAN.md`
- `<base-dir>/assets/`
- `<base-dir>/assets/images/`
- `<base-dir>/assets/videos/`
- `<base-dir>/assets/audios/`
- `<base-dir>/assets/fonts/`
- `<base-dir>/logs/`

The approved idea remains in `SPEC.md` under `# Idea`, including direct-value setup runs.

## After Setup

Transition to `writing-video-plan` to turn the approved idea into a full `SPEC.md` plus an executable `PLAN.md`. For direct manual runs, `executing-video-plan` should treat the latest `# Iteration N` in `PLAN.md` as the source of truth for next actions and `SPEC.md` as the project contract.

## Project Layout Rules

- project spec lives at `<base-dir>/SPEC.md`
- project plan lives at `<base-dir>/PLAN.md`
- generated media and media-adjacent artifacts live under `<base-dir>/assets/`
- standard asset buckets are `<base-dir>/assets/images/`, `<base-dir>/assets/videos/`, `<base-dir>/assets/audios/`, and `<base-dir>/assets/fonts/`
- logs live under `<base-dir>/logs/`
- project-level characters, chapter structure, and similar planning detail belong in `SPEC.md` as text first

## Asset Directories

Record asset lookup order in `SPEC.md` as a Markdown list under `# Asset Directories`. Recommended project default:

```md
# Asset Directories
- `.`
- `assets`
- `assets/images`
- `assets/videos`
- `assets/audios`
- `assets/fonts`
```

To reference assets from a shared library without copying them, add more list items:

```md
# Asset Directories
- `.`
- `assets`
- `/Users/me/studio-assets`
- `/Volumes/NAS/shared`
```

Resolution order: first matching path wins. Skills write output only to the project directory. External dirs are treated as read-only in normal production flow unless the user explicitly asks to promote assets there.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `project_dir`, `project_name`
**On completion** — key `outputs`: `spec_path`, `workflow_files_ready` (true/false), `dirs_created` (array of created directory paths)
