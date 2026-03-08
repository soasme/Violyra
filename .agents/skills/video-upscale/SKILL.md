---
name: video-upscale
description: Upscale local scene clips with Replicate topazlabs/video-upscale and compile final music videos at 1920x1080 with no letterboxing (fill + crop). Use when source clips are below 1080p, when final output must default to 1080p, or when non-16:9 clips need full-screen fit.
---

# Video Upscale + Final Compile

Use this skill to keep final delivery quality consistent:

1. Upscale clips to 1080p with `topazlabs/video-upscale` when clips are below 1080p.
2. Compile full-song videos to `1920x1080` by default.
3. Fit non-16:9 clips by filling the frame and center-cropping, not by adding black bars.

Always run commands through dotenv so `REPLICATE_API_TOKEN` is loaded:
`pnpm exec dotenv -- <command>`

## Upscale One Clip

```bash
pnpm exec dotenv -- node .agents/skills/video-upscale/scripts/upscale.js \
  --input assets/scenes/1.mp4 \
  --output assets/scenes-upscaled/1.mp4 \
  --target-resolution 1080p \
  --target-fps 24
```

## Compile Full Song (Auto Upscale + Stretch + 1080p Output)

```bash
pnpm exec dotenv -- node .agents/skills/video-upscale/scripts/compile_full_song.js \
  --storyboard assets/storyboard.json \
  --aligned assets/aligned_lyrics.json \
  --song assets/song.mp3 \
  --manifest assets/storyboard.sea-race.manifest.json \
  --scenes-dir assets/scenes-sea-race \
  --output assets/final/sea-animals-racing-game.full-song.1080p.mp4 \
  --work-dir assets/final/build-1080
```

## Defaults

1. Final output resolution: `1920x1080`
2. Final output fps: `24`
3. Upscale target resolution: `1080p`
4. Aspect fit mode: fill + crop (`force_original_aspect_ratio=increase` + `crop`)
