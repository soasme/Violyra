# Design

## Purpose

Violyra is a skill repository for AI coding agents focused on video production — music videos, shorts, dramas, anime, etc. It provides composable, CLI-first skills that any agent can follow to produce complete productions from raw inputs (lyrics, screenplay, story brief, a youtube url).

## Architecture

```
violyra/
├── AGENTS.md        # Golden principles for agents working on this repo
├── skills/          # Agent-readable skill definitions (SKILL.md + scripts/)
│   └── lib/         # Shared skill references (logging-guide.md, pack-utils.js)
├── agents/          # Agent specifications (reusable agent configs)
├── hooks/           # Session lifecycle hooks
├── docs/            # This directory: installation, testing, design
├── packages/app/    # Optional: Next.js asset explorer for reviewing outputs
└── assets/          # Working directory for generated media (gitignored)
```

## Philosophy

**Retention over opinion.** Audience behavior is the test. A scene that holds attention is right; a scene that loses it gets replaced, not argued over.

**Regenerate over patch.** Replace weak scenes rather than tweaking them. Iteration speed beats incremental polish.

**Harness over ad-hoc.** Every character, costume, behavior, and scene is defined in a pack before it appears on screen. Nothing is invented in the moment.

**Spec-driven pipeline.** Define the spec first. Clarity always wins over improvisation.

**Pack management before reasoning.** Asset packs (actors, scenes, props, costumes) are populated before cinematic decisions are made. You cannot consistently direct what you have not catalogued.

**Agent-agnostic.** SKILL.md files contain instructions any agent can follow. Scripts handle file I/O and validation — no LLM calls in code.

**CLI-first and testable.** Every script has flags, defaults, `--help`, and a `__test__.js` companion. Always run scripts via `source .env && <command>` to load environment variables from `.env`.

**Observable by default.** Every skill invocation is logged to `{project_dir}/logs/production.jsonl`. The log is the ground truth for what happened, what was retried, and what was scored.

## Harness & Observability

### Repo harness (v1.3.0+)

`AGENTS.md` encodes golden principles for any agent working on this repo:
- Skill naming: `gerund-object` pattern (e.g., `writing-seedance20-prompt`)
- `description` field: max 200 characters
- Every script requires a `__test__.js` companion
- No LLM calls in code
- `pnpm test` and `pnpm lint-skills` must pass before committing

`scripts/lint-skills.js` enforces these rules deterministically. Claude Code hooks run it automatically before any write to `skills/`.

### JSONL production log (v1.3.0+)

Every skill writes to `{project_dir}/logs/production.jsonl` — an append-only log where each line is a JSON event. This creates a traceable audit trail for the entire pipeline run.

**Log entry schema:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ts` | ISO 8601 string | yes | Timestamp |
| `skill` | string | yes | Skill name (matches frontmatter `name`) |
| `event` | string | yes | `invoked`, `completed`, `failed`, `retried`, or `scored` |
| `reason` | string | on `invoked` | Why the agent called this skill |
| `inputs` | object | no | Key input parameters |
| `outputs` | object | no | Key output artifacts or results |
| `notes` | string | no | Agent observations or anomalies |

See `skills/lib/logging-guide.md` for the full schema and examples.

Each skill's `SKILL.md` has a `## Logging` section (the last section) that specifies which `inputs` and `outputs` fields to log for that skill.

## Skill Library

### Workflow Skills

| Skill | When to use |
|---|---|
| `brainstorming-video-idea` | Before making any video. Refines rough ideas through questions, explores alternatives, presents design in sections for validation, saves design document. |
| `setup-video-project` | After design approval. Creates isolated workspace for base dir, initializes `project.json` with global seed, style, and model defaults. |
| `writing-plans` | With approved design in hand. Breaks work into bite-sized tasks (2–5 min each) with exact file paths, complete steps, and verification commands. |
| `executing-video-plan` | With plan in hand. Dispatches a fresh subagent per task with two-stage review (spec compliance, then spec/asset quality), or executes in batches with human checkpoints. |
| `retention-driven-development` | After execution, before compiling. Simulates 100 viewers per shot, scores retention, replaces weak shots. Replace, don't patch. |
| `requesting-video-review` | Between tasks or after the full pipeline. Reviews progress against plan, reports issues by severity. Critical issues block progress. |
| `scoring-narrative-quality` | After `compiling-video`. Scores the assembled video on a 5-dimension narrative rubric (hook, pacing, emotional arc, visual variety, payoff). Composite score 0–100. If < 70, recommends a targeted `retention-driven-development` pass. |

### Music Production Skills

| Skill | When to use |
|---|---|
| `generating-lyrics` | To write or refine song lyrics for a music video. |
| `generating-song` | To generate AI music/song audio from lyrics and a style description. |
| `aligning-lyrics` | To align ground-truth lyric lines to audio using WhisperX word timestamps. |
| `generating-voiceover` | To generate narration audio and normalize it for delivery-ready video voiceover. |

### Asset Management Skills

| Skill | When to use |
|---|---|
| `generating-actor-pack` | To manage global actor appearance references (name, appearance text, reference images). |
| `generating-character-pack` | To manage project-scoped character compositions (actor + costume + props). |
| `generating-scene-pack` | To manage global scene/environment references. |
| `generating-prop-pack` | To manage global prop references. |
| `generating-costume-pack` | To manage global costume references. |
| `prompt-template` | To manage reusable prompt templates with `{{variable}}` slots. |

### Production Pipeline Skills

| Skill | When to use |
|---|---|
| `breaking-down-video-script` | To convert any text (lyrics, screenplay, brief) into an indexed shot list and condensed chapter. |
| `extracting-video-entities` | To extract characters, scenes, and props from a shot list and populate asset packs. |
| `enriching-shot-details` | To enrich shots with cinematic parameters (framing, angle, movement, mood, frame prompts). |
| `checking-consistency` | To detect character/scene drift across shots and produce a consistency report. |
| `running-video-production-pipeline` | To orchestrate breaking-down-video-script → extracting-video-entities → enriching-shot-details → checking-consistency for a chapter. |

### Video Generation Skills

| Skill | When to use |
|---|---|
| `writing-video-plan` | To write a lyric-driven storyboard from lyrics, style, and requirements. |
| `writing-seedance15-prompt` | To write motion-focused Seedance 1.5 prompts from shot details. |
| `writing-seedance20-prompt` | To write motion-focused Seedance 2.0 prompts with multi-shot support. |
| `writing-veo31-prompt` | To write cinematic Veo 3.1 prompts with native audio cues and R2V mode. |
| `upscaling-video` | To upscale scene clips with Topaz (via Replicate or fal.ai). |
| `extracting-foreground` | To extract foreground objects from images and produce transparent PNG cutouts. |
| `generating-thumbnail` | To generate video thumbnails via Replicate or fal.ai. |

### Post-Production Skills

| Skill | When to use |
|---|---|
| `compiling-video` | To compile scene clips into a full music video with ffmpeg (stretch, fit, concat, audio mux). |

### Full Pipeline Skills

| Skill | When to use |
|---|---|
| `mv-production-pipeline` | To run the complete music video workflow from lyrics to final compiled video. |
| `shorts-production-pipeline` | To run the complete short drama workflow from screenplay to final assembly. |

### Model Integration Skills

| Skill | When to use |
|---|---|
| `using-replicate-model` | To discover and run any Replicate model. Includes reference sheets for Seedance 1.5/2.0, Veo 3.1, Chatterbox, Flux, Topaz, Wan 2.5, Nano Banana. |
| `using-falai-model` | To run any fal.ai model via run, subscribe, submit, streaming, or real-time modes. Includes reference sheets for Veo 3.1, Flux, Chatterbox, Topaz, Wan 2.5, Nano Banana. |
| `downloading-youtube-video` | To download a YouTube URL to local files using yt-dlp. |

## Typical Workflows

**Music video (sequential):**
```
brainstorming-video-idea      ← define concept, style, characters
  → setup-video-project       ← create workspace, initialize project.json
  → writing-plans             ← break production into tasks
  → executing-video-plan      ← dispatch subagents per task with two-stage review
      → generating-lyrics
      → generating-song
      → aligning-lyrics
      → writing-video-plan
      → running-video-production-pipeline   ← breakdown → extraction → shot details → consistency
      → writing-seedance20-prompt | writing-veo31-prompt   ← per scene
      → using-replicate-model | using-falai-model          ← generate video
      → upscaling-video         ← optional
      → compiling-video
  → retention-driven-development  ← simulate audience, replace weak scenes
  → scoring-narrative-quality     ← score assembled video; if < 70, loop back
  → requesting-video-review       ← review against plan, block on critical issues
```

**Short drama (sequential):**
```
brainstorming-video-idea      ← define story, characters, visual style
  → setup-video-project       ← create workspace, initialize project.json
  → writing-plans             ← break production into tasks
  → executing-video-plan      ← dispatch subagents per task with two-stage review
      → running-video-production-pipeline   ← breakdown → extraction → shot details → consistency
      → [prompt writing per shot]
      → using-replicate-model | using-falai-model   ← generate video per shot
      → [post-production assembly]
      → compiling-video
  → retention-driven-development  ← simulate audience, replace weak scenes
  → scoring-narrative-quality     ← score assembled video; if < 70, loop back
  → requesting-video-review       ← review against plan, block on critical issues
```

## Multi-Agent Support

This repo is structured to be installed as a plugin in any AI coding agent:

| Agent | Config Location |
|-------|----------------|
| Claude Code | `.claude-plugin/plugin.json` |
| Cursor | `.cursor-plugin/plugin.json` |
| Gemini CLI | `.gemini/INSTALL.md` |
| OpenCode | `.opencode/INSTALL.md` |
| Codex | `.codex/INSTALL.md` |
| Windsurf | `.windsurf/INSTALL.md` |
| Aider | `.aider/INSTALL.md` |

## Skill Format

Each skill lives in `skills/<skill-name>/` and must have:

```
skills/<skill-name>/
├── SKILL.md          # Required: frontmatter + documentation
└── scripts/          # Optional: Node.js scripts
    ├── <action>.js
    └── <action>.__test__.js
```

`SKILL.md` must start with YAML frontmatter:
```yaml
---
name: <skill-name>
description: Use when... <triggering conditions, max ~200 chars>
---
```

`SKILL.md` must end with a `## Logging` section specifying which `inputs` and `outputs` fields the agent should log for this skill. See `skills/lib/logging-guide.md` for the full schema.

See [docs/design-docs/2026-03-27-production-pipeline-design.md](design-docs/2026-03-27-production-pipeline-design.md) for full schema, data flow, and script CLI contracts for the production pipeline skills.
