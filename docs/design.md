# Design

## Purpose

Violyra is a skill repository for AI coding agents focused on music video production. It provides composable, CLI-first skills that chain together to produce complete music videos from raw inputs (audio, lyrics, style).

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

## Skill Design Principles

1. **CLI-first** — every script has flags, defaults, and `--help`.
2. **Composable** — output of one skill feeds into the next.
3. **Environment-isolated** — always run `pnpm exec dotenv -- <cmd>` to load `.env`.
4. **Testable** — scripts have `__test__.js` companions; run with `pnpm test`.
5. **Frontmatter-driven** — every `SKILL.md` starts with `name` and `description` fields.

## Typical Workflow

```
download-youtube-video
  → lyrics-force-alignment
  → mv-storyboard-writer
  → production-pipeline          # NEW: breakdown → entity extraction → shot detail → consistency check
      ├── script-breakdown       # any text → chapter + shot list
      ├── entity-extraction      # shots → populate actor/scene/prop/costume packs
      ├── shot-detail            # enrich shots with cinematic parameters
      └── consistency-check      # detect character/scene drift, output consistency report
  → seedance15-generate (per scene, using enriched shot details)
  → video-upscale (optional)
  → mv-compilation
```

## Skill Layers

Skills are organized in two layers:

**Layer 1 — Pack Management (data layer):** JSON-on-disk CRUD for all production assets. No LLM calls.

| Skill | Purpose |
|---|---|
| `project-config` | Global seed, style, and project metadata |
| `actor-pack` | Global reusable actor appearance references |
| `character-pack` | Project-scoped character compositions (actor + costume + props) |
| `scene-pack` | Global reusable scene/environment references |
| `prop-pack` | Global reusable prop references |
| `costume-pack` | Global reusable costume references |
| `prompt-template` | Reusable prompt templates with `{{variable}}` slots |

**Layer 2 — Reasoning (agent instruction layer):** SKILL.md instructions that tell any agent what to do. Scripts handle only file I/O and validation.

| Skill | Purpose |
|---|---|
| `script-breakdown` | Any text → indexed shot list + condensed chapter |
| `shot-detail` | Enrich shots with cinematic parameters (framing, angle, movement, mood) |
| `entity-extraction` | Shot list → create/update packs for all entities mentioned |
| `consistency-check` | Detect character/scene drift across shots; produce consistency report |
| `production-pipeline` | Orchestrate the full Layer 2 workflow |

See [docs/design-docs/2026-03-27-production-pipeline-design.md](design-docs/2026-03-27-production-pipeline-design.md) for full schema and data flow details.

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
