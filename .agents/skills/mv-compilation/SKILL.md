---
name: mv-compilation
description: Compile scene clips into a full-song music video with ffmpeg using storyboard + aligned lyrics timing. Use when you need deterministic final assembly (scene stretch, frame fit, concat, audio mux) and a default 1920x1080 output.
---

# MV Compilation

Use this skill to nail down final assembly from generated scene clips.

The script handles:

1. Per-scene timing windows from `assets/storyboard.json` + `assets/aligned_lyrics.json`.
2. Per-scene time stretch to match lyric timing.
3. Frame fitting to target output resolution (default `1920x1080`).
4. Scene concatenation and full-song audio mux.

Always run commands through dotenv:
`pnpm exec dotenv -- <command>`

## Compile Full Song

```bash
pnpm exec dotenv -- node .agents/skills/mv-compilation/scripts/compile.js \
  --storyboard assets/storyboard.json \
  --aligned assets/aligned_lyrics.json \
  --song assets/song.mp3 \
  --scenes-dir assets/scenes \
  --work-dir assets/final/build-compile \
  --output assets/final/song.full-song.1080p.mp4
```

## Defaults

1. Output resolution: `1920x1080`
2. Output fps: `24`
3. Fit mode: `fill-crop` (no black bars)

## Key Options

1. `--fit-mode fill-crop|contain` (`fill-crop` default)
2. `--width <px>` and `--height <px>`
3. `--fps <1-120>`
