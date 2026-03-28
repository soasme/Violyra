---
name: mv-storyboard-writer
description: Generate or revise music-video storyboard files from lyrics, user requirements, and visual style. Use when asked to write scene-by-scene storyboard output for `assets/storyboard.js` or `assets/storyboard.json`, including section labels, lyric mapping, character focus, duration, and motion-ready prompts.
---

# MV Storyboard Writer

Write storyboard data that matches the project storyboard contract and is ready for Seedance-style scene generation.

Reference the exact field contract in `references/storyboard-format.md`.
Use the reusable template in `assets/storyboard.template.js` when starting from scratch.

## Inputs

Collect these before writing scenes:

1. `lyrics`: full lyrics or sectioned lyrics.
2. `user_requirements`: explicit constraints (scene count, characters, pacing, safety, platform, duration).
3. `style`: visual language, camera behavior, mood, and era references.
4. `song_title`: title for storyboard metadata.

If any input is missing, make a reasonable assumption and state it briefly.

## Workflow

1. Split lyrics into sections (intro, verse, chorus, bridge, outro) when possible.
2. Map lyric lines to scenes.
3. Set a single `character` focus per scene unless ensemble is required.
4. Write the `prompt` with concrete motion and camera direction:
- subject action
- environment motion
- camera movement
- optional transition cue
5. Keep prompts visual and actionable, not abstract.
6. Validate structure and IDs against `references/storyboard-format.md`.
7. Output storyboard file.

## Output Rules

1. Default output path: `assets/storyboard.json`.
2. If user explicitly asks for JS format, output `assets/storyboard.js` using the same object shape as JSON.
3. Preserve lyric lines exactly unless user asks to rewrite/adapt them.
4. Use increasing integer `scene_id` values starting at `1`.
5. Include `duration` only when a scene needs non-default length.

## Scene Writing Guidance

1. Keep each scene tied to one to four lyric lines.
2. Match the pacing of the music section:
- intro/outro: wider staging, setup/payoff
- verse: narrative progression
- chorus: recognizable motif with escalating energy
3. Repeated choruses should reuse core motif but vary angle, motion, or camera move.
4. Default to PG-safe visuals unless user requests otherwise.
5. Resolve requirement conflicts by prioritizing explicit user constraints and note tradeoffs.

## Quick Start

Use this structure:

```json
{
  "model": "seedance15",
  "song_title": "<title>",
  "scenes": [
    {
      "scene_id": 1,
      "section": "Verse 1",
      "character": "Lead",
      "lyrics": ["<line 1>", "<line 2>"],
      "prompt": "<motion + camera prompt>"
    }
  ]
}
```
