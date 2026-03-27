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
  → seedance15-generate (per scene)
  → video-upscale (optional)
  → mv-compilation
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
