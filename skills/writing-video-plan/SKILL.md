---
name: writing-video-plan
description: Use when turning an approved idea into the project plan doc. Export storyboard JSON under project assets/videos only when needed.
---

# Writing Video Plan

Write the human-readable production plan for a video project. The canonical workflow artifact is `<base-dir>/docs/plan.md`.

Throughout this skill, `<base-dir>` means the project root.

Use `./references/storyboard-format.md` and `./assets/storyboard.template.js` only when a downstream step explicitly needs a machine-readable storyboard export.

## Inputs

Collect these before writing the plan:

1. approved idea doc at `<base-dir>/docs/idea.md`
2. source assets declared in the idea doc
3. project-specific narrative source such as lyrics, screenplay, story brief, or voiceover notes
4. explicit `user_requirements`
5. style, pacing, and camera constraints

If an input required to author the plan is missing, stop and ask for that specific file or clarification. Do not invent source text.

## Workflow

1. Read `<base-dir>/docs/idea.md` and inspect what already exists in the project.
2. Read the declared source assets and preserve narrative text exactly unless the user asks to rewrite it.
3. Clarify open questions before planning if key constraints are missing.
4. Break the work into short executable tasks with exact file paths, deliverables, and verification steps.
5. For scene work, describe the intent in Markdown first:
   - lyric or script lines covered
   - visual beat
   - character focus
   - camera or motion intent
   - blocking dependencies
6. Call out blockers, review gates, and the natural next step after each task.
7. Write or update `<base-dir>/docs/plan.md`.
8. Export `<base-dir>/assets/videos/storyboard.json` or `<base-dir>/assets/videos/storyboard.js` only when the user asks for it or a downstream script needs it immediately.
9. If available, self-review the written plan with `plan-document-reviewer-prompt.md`.

## Output Rules

1. Default output path: `<base-dir>/docs/plan.md`
2. The plan is the source of truth for users and agents
3. Preserve source text exactly unless the user asks to adapt it
4. If a storyboard export is required, keep it secondary to the Markdown plan and validate it against `references/storyboard-format.md`
5. If the user explicitly asks for JS format, export `<base-dir>/assets/videos/storyboard.js`; otherwise use `<base-dir>/assets/videos/storyboard.json`

## Plan Format

Save to `<base-dir>/docs/plan.md`:

```md
# Plan: <title>

## Current State
- Idea doc: `docs/idea.md`
- Source assets: <resolved file paths>
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
| Scene | Source lines | Visual beat | Camera / motion | Notes |
|---|---|---|---|---|
| 1 | ... | ... | ... | ... |

## Blockers
- <blocker or `None`>

## Optional Exports
- `<base-dir>/assets/videos/storyboard.json` only if downstream tooling needs it now

## Next Step
- Use `executing-video-plan` and update `<base-dir>/docs/exec.md`
```

## After Writing

Tell the user:

> "Production plan written to `<base-dir>/docs/plan.md`. If needed, I can also export `<base-dir>/assets/videos/storyboard.json` for downstream tooling. Next step: run `executing-video-plan`."

## Logging

Log to `{project_dir}/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `idea_doc_path`, `source_assets`, `style`
- **On completion** — event `completed`, outputs: `plan_path`, `storyboard_exported` (true/false), `shot_count`
