---
name: writing-video-plan
description: Use when turning an approved idea into the project plan doc. Exports storyboard JSON under project assets/videos only when needed.
---

# Writing Video Plan

Write the human-readable production plan for a music video. The canonical workflow artifact is `<base-dir>/docs/plan.md`.

Use `references/storyboard-format.md` and `assets/storyboard.template.js` only when a downstream step explicitly needs a machine-readable storyboard export.

## Inputs

Collect these before writing the plan:

1. Approved idea doc at `<base-dir>/docs/idea.md` when available.
2. `lyrics`: full lyrics or sectioned lyrics.
3. `user_requirements`: explicit constraints (scene count, characters, pacing, safety, platform, duration).
4. `style`: visual language, camera behavior, mood, and era references.
5. `song_title`: title for plan metadata.

If any input is missing, make a reasonable assumption and state it briefly.

## Workflow

1. Read the approved context in `<base-dir>/docs/idea.md` and inspect what already exists in the project.
2. Clarify open questions before planning if key constraints are missing.
3. Break the work into short executable tasks with exact file paths, deliverables, and verification steps.
4. For scene work, describe the intent in Markdown first:
   - lyric or script lines covered
   - visual beat
   - character focus
   - camera / motion intent
   - blocking dependencies
5. Call out blockers, review gates, and the natural next step after each task.
6. Write or update `<base-dir>/docs/plan.md`.
7. Export `<base-dir>/assets/videos/storyboard.json` or `<base-dir>/assets/videos/storyboard.js` only when the user asks for it or a downstream script needs it immediately.

## Output Rules

1. Default output path: `<base-dir>/docs/plan.md`.
2. The plan is the source of truth for users and agents.
3. Preserve lyric lines exactly unless the user asks to rewrite or adapt them.
4. If a storyboard export is required, keep it secondary to the Markdown plan and validate it against `references/storyboard-format.md`.
5. If user explicitly asks for JS format, export `<base-dir>/assets/videos/storyboard.js`; otherwise use `<base-dir>/assets/videos/storyboard.json`.

## Plan Format

Save to `<base-dir>/docs/plan.md`:

```md
# Plan: <title>

## Current State
- Idea doc: `docs/idea.md`
- Inputs present: <lyrics, audio, refs, packs>
- Assumptions: <brief list>

## Targets
- Deliverable: <what this run should produce>
- Quality bar: <what counts as acceptable>

## Tasks
- [ ] Task 1 — <short title>
  Files: <exact paths>
  Do: <plain-language instructions>
  Verify: <command or check>
  Next: <what this unlocks>

## Scene Intent
| Scene | Lyrics / lines | Visual beat | Camera / motion | Notes |
|---|---|---|---|---|
| 1 | ... | ... | ... | ... |

## Blockers
- <blocker or `None`>

## Optional Exports
- `<base-dir>/assets/videos/storyboard.json` only if downstream tooling needs it now

## Next Step
- Use `executing-video-plan` and update `<base-dir>/docs/exec.md`
```

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `idea_doc_path`, `lyrics_path`, `style`
**On completion** — key `outputs`: `plan_path`, `storyboard_exported` (true/false), `shot_count`
