---
name: compiling-video
description: Compile scene clips into a full-song music video with ffmpeg using storyboard + lyrics timing. Use when you need final assembly with auto-upscale, scene stretch, frame fit, concat, and audio mux.
---

# MV Compilation

Use this skill to nail down final assembly from generated scene clips.

`compiling-video` still consumes a machine-readable storyboard. If the workflow has been managed in `<project-dir>/PLAN.md`, export or refresh `<project-dir>/project/assets/videos/storyboard.json` before compiling.

The script handles:

1. Per-scene timing windows from `project/assets/videos/storyboard.json` + `project/assets/audios/aligned_lyrics.json`.
2. Optional auto-upscale via `topazlabs/video-upscale` for clips below target resolution.
3. Per-scene time stretch to match lyric timing.
4. Frame fitting to target output resolution (default `1920x1080`).
5. Scene concatenation and full-song audio mux.

Source `.env` so environment variables are loaded:
`source .env && <command>`

## Compile Full Song

```bash
  source .env && node .agents/skills/compiling-video/scripts/compile.js \
  --storyboard project/assets/videos/storyboard.json \
  --aligned project/assets/audios/aligned_lyrics.json \
  --song project/assets/audios/song.mp3 \
  --manifest project/assets/videos/storyboard.sea-race.manifest.json \
  --scenes-dir project/assets/videos/scenes \
  --work-dir project/assets/videos/final/build-compile \
  --output project/assets/videos/final/song.full-song.1080p.mp4
```

## Defaults

1. Output resolution: `1920x1080`
2. Output fps: `24`
3. Fit mode: `fill-crop` (no black bars)
4. Upscale target resolution: `1080p`

## Key Options

1. `--fit-mode fill-crop|contain` (`fill-crop` default)
2. `--width <px>` and `--height <px>`
3. `--fps <1-120>`
4. `--manifest <manifest.json>` to use source generation URLs for more reliable upscale input
5. `--no-upscale` to disable upscale
6. `--force-upscale` to ignore upscale cache in `--work-dir/upscaled`

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `storyboard`, `aligned`, `song`, `output`
**On completion** — key `outputs`: `output_video`, `duration_s`, `scene_count`
