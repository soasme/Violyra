# Design

## Purpose

Violyra is a skill repository for AI coding agents focused on video production — music videos, shorts, dramas, anime, etc. It provides composable, CLI-first skills that any agent can follow to produce complete productions from raw inputs (lyrics, screenplay, story brief, a youtube url).

## Architecture

```
violyra/
├── skills/          # Agent-readable skill definitions (SKILL.md + scripts/)
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

**CLI-first and testable.** Every script has flags, defaults, `--help`, and a `__test__.js` companion.

## Skill Library

### Workflow Skills

| Skill | When to use |
|---|---|
| `brainstorming-video-idea` | Before making any video. Refines rough ideas through questions, explores alternatives, presents design in sections for validation, saves design document. |
| `setup-video-project` | After design approval. Creates isolated workspace for base dir, initializes `project.json` with global seed, style, and model defaults. |
| `writing-plans` | With approved design in hand. Breaks work into bite-sized tasks (2–5 min each) with exact file paths, complete steps, and verification commands. |
| `executing-video-plan` | With plan in hand. Dispatches a fresh subagent per task with two-stage review (spec compliance, then spec/asset quality), or executes in batches with human checkpoints. |
| `retention-driven-development` | After execution. Dispatches a subagent to simulate 100 viewers reacting to the current settings and scores retention; repeats until score meets threshold or no improvement remains. Replace, don't patch. |
| `requesting-video-review` | Between tasks. Reviews progress against plan, reports issues by severity. Critical issues block progress. |

### Music Production Skills

| Skill | When to use |
|---|---|
| `generating-lyrics` | To write or refine song lyrics for a music video. |
| `generating-song` | To generate AI music/song audio from lyrics and a style description. |
| `lyrics-force-alignment` | To align ground-truth lyric lines to audio using WhisperX word timestamps. |
| `generate-voiceover` | To generate narration audio and normalize it for delivery-ready video voiceover. |

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
| `script-breakdown` | To convert any text (lyrics, screenplay, brief) into an indexed shot list and condensed chapter. |
| `entity-extraction` | To extract characters, scenes, and props from a shot list and populate asset packs. |
| `shot-detail` | To enrich shots with cinematic parameters (framing, angle, movement, mood, frame prompts). |
| `consistency-check` | To detect character/scene drift across shots and produce a consistency report. |
| `production-pipeline` | To orchestrate script-breakdown → entity-extraction → shot-detail → consistency-check for a chapter. |

### Video Generation Skills

| Skill | When to use |
|---|---|
| `mv-storyboard-writer` | To write a lyric-driven storyboard from lyrics, style, and requirements. |
| `seedance15-prompt-writer` | To write motion-focused Seedance prompts from shot details. |
| `seedance15-generate` | To generate scene videos with Seedance 1.5 via Replicate. |
| `upscale-video` | To upscale scene clips with Topaz via Replicate. |
| `extract-foreground` | To extract foreground objects from images and produce transparent PNG cutouts. |
| `generate-thumbnail` | To generate video thumbnails via Replicate. |

### Post-Production Skills

| Skill | When to use |
|---|---|
| `mv-compilation` | To compile scene clips into a full music video with ffmpeg (stretch, fit, concat, audio mux). |

### Full Pipeline Skills

| Skill | When to use |
|---|---|
| `mv-production-pipeline` | To run the complete music video workflow from lyrics to final compiled video. |
| `shorts-production-pipeline` | To run the complete short drama workflow from screenplay to final assembly. |

### Utility Skills

| Skill | When to use |
|---|---|
| `replicate` | To discover and run Replicate models through API-first workflow. |
| `download-youtube-video` | To download a YouTube URL to local files using yt-dlp. |

## Typical Workflows

**Music video (sequential):**
```
brainstorming-video-idea      ← define concept, style, characters
  → setup-video-project       ← create workspace, initialize project.json
  → writing-plans             ← break production into tasks
  → executing-video-plan      ← dispatch subagents per task with two-stage review
      → generating-lyrics
      → generating-song
      → lyrics-force-alignment
      → mv-storyboard-writer
      → production-pipeline   ← breakdown → extraction → shot-detail → consistency
      → seedance15-prompt-writer
      → seedance15-generate   ← per scene
      → upscale-video         ← optional
      → mv-compilation
  → retention-driven-development ← simulate audience, replace weak scenes
  → requesting-video-review   ← review against plan, block on critical issues
```

**Short drama (sequential):**
```
brainstorming-video-idea      ← define story, characters, visual style
  → setup-video-project       ← create workspace, initialize project.json
  → writing-plans             ← break production into tasks
  → executing-video-plan      ← dispatch subagents per task with two-stage review
      → production-pipeline   ← breakdown → extraction → shot-detail → consistency
      → [image/video generation per shot]
      → [post-production assembly]
  → retention-driven-development ← simulate audience, replace weak scenes
  → requesting-video-review   ← review against plan, block on critical issues
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

See [docs/design-docs/2026-03-27-production-pipeline-design.md](design-docs/2026-03-27-production-pipeline-design.md) for full schema, data flow, and script CLI contracts for the production pipeline skills.
