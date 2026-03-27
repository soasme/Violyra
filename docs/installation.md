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
- `OPENAI_API_KEY` — for storyboard writer agent

---

## Available Skills

| Skill | Description |
|-------|-------------|
| [seedance15-generate](../skills/seedance15-generate/SKILL.md) | Generate scene MP4s with Replicate Seedance 1.5 |
| [seedance15-prompt-writer](../skills/seedance15-prompt-writer/SKILL.md) | Write motion-focused prompts for Seedance |
| [mv-storyboard-writer](../skills/mv-storyboard-writer/SKILL.md) | Generate lyric-driven storyboards |
| [mv-compilation](../skills/mv-compilation/SKILL.md) | Compile scenes into a full music video |
| [lyrics-force-alignment](../skills/lyrics-force-alignment/SKILL.md) | Align lyrics to audio with WhisperX |
| [text-to-speech](../skills/text-to-speech/SKILL.md) | Generate and normalize TTS audio |
| [video-upscale](../skills/video-upscale/SKILL.md) | Upscale clips with Topaz via Replicate |
| [transparent-image](../skills/transparent-image/SKILL.md) | Remove backgrounds and produce transparent PNGs |
| [youtube-thumbnail-generator](../skills/youtube-thumbnail-generator/SKILL.md) | Generate YouTube thumbnails |
| [download-youtube-video](../skills/download-youtube-video/SKILL.md) | Download YouTube videos locally |
| [replicate](../skills/replicate/SKILL.md) | Discover and run any Replicate model |
