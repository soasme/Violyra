# Usage

Violyra is a skill library for AI agents doing video production work. It is not a single rigid pipeline, but it should still feel Markdown-first and project-local rather than repo-global or JSON-heavy.

Unless stated otherwise, paths below are relative to `<project-dir>`.

## Canonical Workflow Files

Use these Markdown files as the main collaboration surface:

- `SPEC.md` — the project spec; keep it text-first, keep the approved idea in `# Idea`, and wrap any machine-readable snippet in a fenced `json` code block
- `PLAN.md` — approved task plan for managing `SPEC.md`, `project/assets/`, blockers, review notes, and next steps

These Markdown files are enough for the workflow layer. Lower-level JSON still exists where scripts need deterministic input or validation, such as `shot-list.json` and `consistency-report.json`.

## Project Layout

```text
<project-dir>/
├── SPEC.md
├── PLAN.md
└── project/
    ├── assets/
    │   ├── images/
    │   ├── videos/
    │   ├── audios/
    │   └── fonts/
    └── logs/
```

Put project-specific inputs under `project/assets/`. Examples:

- lyrics
- song audio
- screenplay or story brief
- voiceover audio
- reference stills
- source footage
- downloaded media

## Basic Flow

Many projects follow this shape:

1. Run `brainstorming-video-idea` to converge on the concept and write the approved idea into `<project-dir>/SPEC.md`.
2. Run `setup-video-project` to scaffold the workspace, preserve or scaffold `<project-dir>/SPEC.md`, create `<project-dir>/PLAN.md`, and prepare `<project-dir>/project/`.
3. Place or generate the required project inputs under `<project-dir>/project/assets/`.
4. Run `writing-video-plan` to refine `<project-dir>/SPEC.md` and write an actionable `<project-dir>/PLAN.md`.
5. Run `executing-video-plan` to execute tasks from `<project-dir>/PLAN.md`, using `<project-dir>/SPEC.md` as the project contract, and keep `PLAN.md` current.
6. Run `retention-driven-development` and `requesting-video-review` before delivery, and record review results in `<project-dir>/PLAN.md` plus `<project-dir>/project/logs/` when needed.

## Choosing The Right Workflow

### Idea-first workflow

Use this when you are starting from a rough prompt, song concept, screenplay idea, or visual direction.

Typical sequence:

1. `brainstorming-video-idea`
2. `setup-video-project`
3. `writing-video-plan`
4. `executing-video-plan`
5. `retention-driven-development`
6. `requesting-video-review`

### Full-pipeline workflow

Use this when the project cleanly matches one of Violyra's end-to-end pipeline patterns.

- `mv-production-pipeline` for music-video style productions
- `shorts-production-pipeline` for short-form narrative productions

### Direct skill workflow

Use this when you already know which step you need.

Examples:

- already have lyrics and want timing: `aligning-lyrics`
- already have a shot list and want packs/details: `running-video-production-pipeline`
- already have prompts and want generation: `using-replicate-model` or `using-falai-model`
- already have scenes and want final assembly: `compiling-video`

## Source Assets Rule

The right rule is:

1. Put project inputs under `<project-dir>/project/assets/`
2. Make the required inputs explicit in the `# Idea` section of `<project-dir>/SPEC.md`
3. Let `writing-video-plan` carry those requirements through the rest of `<project-dir>/SPEC.md`
4. Let `<project-dir>/PLAN.md` manage the work against `SPEC.md` and the actual asset paths

Do not assume every project uses the same files.

## When JSON Is Still Expected

`SPEC.md` stays text-first. If it includes structured data, fence it as `json` inside the Markdown file.

Project defaults that used to live in rigid config files should be recorded in `SPEC.md` as Markdown lists or short paragraphs. For example:

```md
## Project Defaults
- Default model: `bytedance/seedance-1.5-pro`
- fps: `24`
- resolution: `1920x1080`

# Asset Directories
- `.`
- `project/assets`
- `project/assets/images`
- `project/assets/videos`
- `project/assets/audios`
- `project/assets/fonts`
```

Some scripts still require standalone machine-readable files:

- `project/assets/videos/storyboard.json` — compile-time scene manifest when `compiling-video` is used
- `shot-list.json`, `shot-details.json`, `extraction-report.json`, `consistency-report.json` — validated pipeline outputs

Rule of thumb: think and collaborate in `SPEC.md` and `PLAN.md` first, then export JSON only when a script genuinely needs it.
