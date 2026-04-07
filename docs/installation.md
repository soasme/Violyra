# Installation

Violyra is a collection of agent skills for music video production. Skills can be installed into any supported AI coding agent.

## Quick Install

### Claude Code

```bash
/plugin install https://github.com/soasme/violyra
```

### Cursor

Search "violyra" in the Cursor plugin marketplace, or:
```
/add-plugin violyra
```

### Gemini CLI

```bash
gemini extensions install https://github.com/soasme/violyra
```

### OpenCode

Add to `opencode.json`:
```json
{ "plugins": ["violyra@git+https://github.com/soasme/violyra.git"] }
```

### Codex / Aider / Windsurf

See the `.codex/INSTALL.md`, `.aider/INSTALL.md`, or `.windsurf/INSTALL.md` files for agent-specific instructions.

---

## Prerequisites

The skills in this repo rely on the following tools. Install them before using:

| Tool | Purpose | Install |
|------|---------|---------|
| `ffmpeg` | Video compilation | `brew install ffmpeg` |
| `yt-dlp` | YouTube download (via `uvx`) | `brew install uv` |
| `node` 20+ | Script execution | `brew install node` |
| `pnpm` | Package manager | `npm i -g pnpm` |

API keys needed (add to `.env`):
- `REPLICATE_API_TOKEN` — for Replicate-based skills
- `OPENAI_API_KEY` — for plan-writing / ideation agent flows

---

## Available Skills

| Skill | Description |
|-------|-------------|
| [generating-seedance15-video](../skills/generating-seedance15-video/SKILL.md) | Generate scene MP4s with Replicate Seedance 1.5 |
| [writing-seedance15-prompt](../skills/writing-seedance15-prompt/SKILL.md) | Write motion-focused prompts for Seedance |
| [writing-video-plan](../skills/writing-video-plan/SKILL.md) | Write Markdown-first production plans; export storyboard JSON only when needed |
| [compiling-video](../skills/compiling-video/SKILL.md) | Compile scenes into a full music video |
| [aligning-lyrics](../skills/aligning-lyrics/SKILL.md) | Align lyrics to audio with WhisperX |
| [generating-voiceover](../skills/generating-voiceover/SKILL.md) | Generate and normalize TTS audio |
| [upscaling-video](../skills/upscaling-video/SKILL.md) | Upscale clips with Topaz via Replicate |
| [extracting-foreground](../skills/extracting-foreground/SKILL.md) | Remove backgrounds and produce transparent PNGs |
| [generating-thumbnail](../skills/generating-thumbnail/SKILL.md) | Generate YouTube thumbnails |
| [downloading-youtube-video](../skills/downloading-youtube-video/SKILL.md) | Download YouTube videos locally |
| [replicate](../skills/replicate/SKILL.md) | Discover and run any Replicate model |
