---
name: upscale-video
description: Upscale local scene clips with Replicate topazlabs/video-upscale. Use when source clips are below delivery resolution or when compilation should call an explicit pre-upscale step.
---

# Upscale Video

Use this skill for deterministic scene upscaling before final compilation.

Always run commands through dotenv so `REPLICATE_API_TOKEN` is loaded:
`pnpm exec dotenv -- <command>`

## Upscale One Clip

```bash
pnpm exec dotenv -- node .agents/skills/upscale-video/scripts/upscale.js \
  --input assets/scenes/1.mp4 \
  --output assets/scenes-upscaled/1.mp4 \
  --target-resolution 1080p \
  --target-fps 24
```

For full MV compile, use:
`pnpm exec dotenv -- node .agents/skills/mv-compilation/scripts/compile.js ...`
