# Design

## Purpose

Violyra is a skill repository for AI coding agents focused on short-form video production — music videos and short dramas. It provides composable, CLI-first skills that any agent can follow to produce complete productions from raw inputs (lyrics, screenplay, or story brief).

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

**Skills are mandatory workflows, not suggestions.** Before starting any task, the agent checks whether a relevant skill exists and follows it exactly. This is what makes productions consistent and repeatable.

**Every production follows the same gates:**
```
brainstorming → project-setup → writing-plans → [execute tasks] → requesting-review
```
These gates apply regardless of production type. Skipping them is not allowed.

**Pack management before reasoning.** Asset packs (actors, scenes, props, costumes) are populated before cinematic decisions are made. You cannot consistently direct what you have not catalogued.

**Agent-agnostic.** SKILL.md files contain instructions any agent can follow. Scripts handle file I/O and validation — no LLM calls in code.

**CLI-first and testable.** Every script has flags, defaults, `--help`, and a `__test__.js` companion.

## Skill Library

### Workflow Skills

| Skill | When to use |
|---|---|
| `brainstorming` | Before making any video. Refines rough ideas through questions, explores alternatives, presents design in sections for validation, saves design document. |
| `project-setup` | After design approval. Creates isolated workspace for base dir, runs project initialization. |
| `writing-plans` | With approved design in hand. Breaks work into bite-sized tasks (2–5 min each) with exact file paths, complete steps, and verification commands. |
| `requesting-review` | Between tasks. Reviews progress against plan, reports issues by severity. Critical issues block progress. |

### Music Production Skills

| Skill | When to use |
|---|---|
| `writing-lyrics` | To write or refine song lyrics for a music video. |
| `generating-song` | To generate AI music/song audio from lyrics and a style description. |
| `lyrics-force-alignment` | To align ground-truth lyric lines to audio using WhisperX word timestamps. |
| `text-to-speech` | To generate narration audio and normalize it for video voiceover. |

### Asset Management Skills

| Skill | When to use |
|---|---|
| `project-config` | To initialize or update `project.json` with global seed, style, and model defaults. |
| `actor-pack` | To manage global actor appearance references (name, appearance text, reference images). |
| `character-pack` | To manage project-scoped character compositions (actor + costume + props). |
| `scene-pack` | To manage global scene/environment references. |
| `prop-pack` | To manage global prop references. |
| `costume-pack` | To manage global costume references. |
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
| `video-upscale` | To upscale scene clips with Topaz via Replicate. |
| `transparent-image` | To extract foreground objects as transparent PNG cutouts. |
| `youtube-thumbnail-generator` | To generate YouTube thumbnails via Replicate. |

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
brainstorming               ← define concept, style, characters
  → project-setup           ← create workspace, initialize project.json
  → writing-plans           ← break production into tasks
  → writing-lyrics          ← write song lyrics
  → generating-song         ← generate audio from lyrics + style
  → lyrics-force-alignment  ← align lyrics to generated audio
  → mv-storyboard-writer    ← write lyric-driven storyboard
  → production-pipeline     ← breakdown → extraction → shot-detail → consistency
  → seedance15-prompt-writer
  → seedance15-generate     ← per scene
  → video-upscale           ← optional
  → mv-compilation
  → requesting-review       ← review against plan
```

**Short drama (sequential):**
```
brainstorming               ← define story, characters, visual style
  → project-setup           ← create workspace, initialize project.json
  → writing-plans           ← break production into tasks
  → production-pipeline     ← breakdown → extraction → shot-detail → consistency
  → [image/video generation per shot]
  → [post-production assembly]
  → requesting-review       ← review against plan
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
