---
name: writing-video-plan
description: Use when turning an approved idea into SPEC.md and the project plan. Export storyboard JSON under project assets/videos only when needed.
---

# Writing Video Plan

Write the human-readable project spec and production plan for a video project. The canonical workflow artifacts are `<base-dir>/SPEC.md` and `<base-dir>/docs/plan.md`.

Throughout this skill, `<base-dir>` means the project root.

Use `./references/storyboard-format.md` and `./assets/storyboard.template.js` only when a downstream step explicitly needs a machine-readable storyboard export.

## Inputs

Collect these before writing the spec and plan:

1. approved idea doc at `<base-dir>/docs/idea.md`
2. source assets declared in the idea doc
3. project-specific narrative source such as lyrics, screenplay, story brief, or voiceover notes
4. explicit `user_requirements`
5. style, pacing, and camera constraints

If an input required to author the spec or plan is missing, stop and ask for that specific file or clarification. Do not invent source text.

## Workflow

1. Read `<base-dir>/docs/idea.md` and inspect what already exists in the project.
2. Read the declared source assets and preserve narrative text exactly unless the user asks to rewrite it.
3. Clarify open questions before planning if key constraints are missing.
4. Write or update `<base-dir>/SPEC.md` as the project contract yielded from `<base-dir>/docs/idea.md`.
5. Break the work into short executable tasks with exact file paths, deliverables, and verification steps.
6. For scene work, describe the intent in Markdown first:
   - lyric or script lines covered
   - visual beat
   - character focus
   - camera or motion intent
   - blocking dependencies
7. Call out blockers, review gates, and the natural next step after each task.
8. Write or update `<base-dir>/docs/plan.md` so it manages `SPEC.md` and the project assets.
9. Export `<base-dir>/assets/videos/storyboard.json` or `<base-dir>/assets/videos/storyboard.js` only when the user asks for it or a downstream script needs it immediately.
10. If available, self-review the written spec and plan with `plan-document-reviewer-prompt.md`.

## Output Rules

1. Default spec path: `<base-dir>/SPEC.md`
2. Default plan path: `<base-dir>/docs/plan.md`
3. `SPEC.md` is the human-readable project contract distilled from `docs/idea.md`
4. `docs/plan.md` manages `SPEC.md`, asset work, blockers, and execution order
5. Preserve source text exactly unless the user asks to adapt it
6. If `SPEC.md` needs machine-readable detail, wrap it in a fenced `json` code block instead of creating standalone JSON unless a downstream script needs the file immediately
7. If a storyboard export is required, keep it secondary to the Markdown spec and plan, and validate it against `references/storyboard-format.md`
8. If the user explicitly asks for JS format, export `<base-dir>/assets/videos/storyboard.js`; otherwise use `<base-dir>/assets/videos/storyboard.json`

## Spec Format

Save to `<base-dir>/SPEC.md`:

```md
# Spec: <title>

## Source
- Idea doc: `docs/idea.md`
- Status: draft / approved / revised

## Project Contract
- Goal: <what this production must deliver>
- Platform: <platform>
- Duration: <duration>
- Default model: <model>
- fps: <fps>
- resolution: <resolution>

## Asset Directories
- `.`
- `assets/images`
- `assets/videos`
- `assets/audios`
- `assets/fonts`

## Style
- Genre: <genre>
- Mood: <mood>
- Visual direction: <what the production should feel like>

## Assets
| Path | Purpose | Required by | Status |
|---|---|---|---|
| assets/... | ... | planning / execution | present / missing / to-generate |

## Characters
| Name | Role | Visual traits | Continuity method |
|---|---|---|---|
| ... | ... | ... | ... |

## Structure
### Chapter 1 — <title>
- Summary: <what happens>
- Source lines / beats: <covered text>
- Scene intent: <visual / emotional goal>
- Required assets: <paths or `None`>

## Notes
- Keep this file text-first.
- Any machine-readable snippet in this file must use a fenced `json` code block.

## Open Questions
- <question or `None`>
```

## Plan Format

Save to `<base-dir>/docs/plan.md`:

```md
# Plan: <title>

## Current State
- Idea doc: `docs/idea.md`
- Project spec: `SPEC.md`
- Assets root: `assets/`
- Inputs present: <lyrics, audio, refs, current assets>
- Assumptions: <brief list>

## Spec Tasks
- [ ] Task 1 — <short title>
  Files: `SPEC.md`
  Do: <plain-language instructions>
  Verify: <check against `docs/idea.md` or the output files>
  Next: <what this unlocks>

## Asset Tasks
- [ ] Task 2 — <short title>
  Files: <exact paths under `assets/` or related outputs>
  Do: <plain-language instructions>
  Verify: <command or check>
  Next: <what this unlocks>

## Scene Intent
| Scene | Source lines | Visual beat | Camera / motion | Notes |
|---|---|---|---|---|
| 1 | ... | ... | ... | ... |

## Blockers
- <blocker or `None`>

## Optional Exports
- `<base-dir>/assets/videos/storyboard.json` only if downstream tooling needs it now

## Next Step
- Use `executing-video-plan` to work through `SPEC.md`, asset tasks, and update `<base-dir>/docs/exec.md`
```

## After Writing

Tell the user:

> "Project spec written to `<base-dir>/SPEC.md` and plan written to `<base-dir>/docs/plan.md`. If needed, I can also export `<base-dir>/assets/videos/storyboard.json` for downstream tooling. Next step: run `executing-video-plan`."

## Logging

Log to `{project_dir}/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `idea_doc_path`, `source_assets`, `style`
- **On completion** — event `completed`, outputs: `spec_path`, `plan_path`, `storyboard_exported` (true/false), `shot_count`
