# Violyra

**AI-native video production skills for any coding agent.**

Violyra is a skill repository that gives AI agents a complete, structured workflow for producing music videos, short dramas, and other video content — from raw lyrics or screenplay to a compiled, delivery-ready file. Every skill is a plain-text `SKILL.md` instruction set that any agent can follow, paired with CLI-first Node.js scripts for file I/O and validation.

No database. No UI. No LLM calls in code. Just files, scripts, and clear instructions.

---

## How it works

Violyra follows a production pipeline modeled on real film workflows:

```
brainstorming-video-idea
  → setup-video-project
  → writing-plans
  → executing-video-plan
      → [music / script / storyboard]
      → running-video-production-pipeline ← breakdown → extraction → shot details → consistency
      → [video generation per scene]
      → compiling-video
  → retention-driven-development   ← simulate 100 viewers, replace weak scenes
  → requesting-video-review
```

Each step is a composable skill. Run the full pipeline or pick individual skills to slot into your own workflow.

---

## Features

### Workflow
- **Brainstorming** — refine rough ideas, explore alternatives, produce a design doc
- **Planning** — break production into bite-sized tasks with exact file paths and verification commands
- **Execution** — dispatch subagents per task with two-stage review (spec compliance + asset quality)
- **Retention-driven development** — simulate audience behavior, score retention, replace weak scenes automatically

### Production Pipeline
- **Script breakdown** — any text (lyrics, screenplay, brief) → indexed shot list + chapter
- **Entity extraction** — shot list → actor, scene, prop, costume packs
- **Shot detail** — enrich shots with framing, angle, movement, mood, and frame prompts
- **Consistency check** — detect character/scene drift across shots; produce an optimized shot list

### Asset Management
- Typed, versioned JSON packs for actors, characters, scenes, props, costumes
- Reusable prompt templates with `{{variable}}` slots
- Global (cross-project) and project-scoped asset separation

### Music & Audio
- Lyrics generation and refinement
- AI song generation from lyrics + style description
- Lyric-to-audio force alignment via WhisperX
- Voiceover generation with loudness normalization (EBU R128)

### Video Generation & Post
- Storyboard writing from lyrics + style
- Seedance 1.5 prompt writing and scene generation (via Replicate)
- Scene upscaling with Topaz (via Replicate)
- Foreground extraction to transparent PNG
- Thumbnail generation
- FFmpeg compilation with lyric-timing stretch, fit, concat, and audio mux

### Utilities
- Replicate model discovery and execution
- YouTube video download via yt-dlp

---

## Getting started

### Requirements

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 10+
- [ffmpeg](https://ffmpeg.org) (for compilation)
- A [Replicate](https://replicate.com) API token (for generation skills)

### Install

```bash
git clone https://github.com/soasme/violyra.git
cd violyra
pnpm install
cp .env.example .env   # add your REPLICATE_API_TOKEN
```

### Install as an agent plugin

Violyra is designed to be loaded as a plugin by your AI coding agent:

| Agent | Config |
|---|---|
| Claude Code | `.claude-plugin/plugin.json` |
| Cursor | `.cursor-plugin/plugin.json` |
| Gemini CLI | `.gemini/INSTALL.md` |
| OpenCode | `.opencode/INSTALL.md` |
| Codex | `.codex/INSTALL.md` |
| Windsurf | `.windsurf/INSTALL.md` |
| Aider | `.aider/INSTALL.md` |

Once installed, tell your agent to use any skill by name — e.g. `use the running-video-production-pipeline skill` — and it will follow the `SKILL.md` instructions directly.

### Run tests

```bash
pnpm test
```

All scripts have a `__test__.js` companion. Tests are run with [Vitest](https://vitest.dev).

---

## Skill format

Each skill lives in `skills/<skill-name>/`:

```
skills/<skill-name>/
├── SKILL.md          # YAML frontmatter + agent instructions
└── scripts/          # Optional Node.js scripts
    ├── <action>.js
    └── <action>.__test__.js
```

`SKILL.md` frontmatter:

```yaml
---
name: <skill-name>
description: Use when... <triggering conditions, max ~200 chars>
---
```

Scripts read environment variables from `.env`:

```bash
source .env && node skills/<skill-name>/scripts/<action>.js --help
```

See [`docs/design.md`](docs/design.md) for the full skill library and [`docs/design-docs/2026-03-27-production-pipeline-design.md`](docs/design-docs/2026-03-27-production-pipeline-design.md) for production pipeline schemas, data flow, and script CLI contracts.

---

## Contributing

1. Fork the repo and create a branch from `main`
2. Add or modify a skill in `skills/<skill-name>/`
3. Every new script needs a `__test__.js` companion — run `pnpm test` before submitting
4. Follow the skill format above; keep `SKILL.md` descriptions under 200 characters
5. Open a pull request with a clear description of what the skill does and when to use it

Skill additions, pipeline improvements, new model integrations, and bug fixes are all welcome.

---

## License

MIT — see [LICENSE](LICENSE) for details.
