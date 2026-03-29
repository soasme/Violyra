---
name: upscaling-video
description: Upscale local scene clips with Replicate topazlabs/video-upscale. Use when source clips are below delivery resolution or when compilation should call an explicit pre-upscale step.
---

# Upscale Video

Use this skill for deterministic scene upscaling before final compilation.

Source `.env` so `REPLICATE_API_TOKEN` is loaded:
`source .env && <command>`

## Upscale One Clip

```bash
source .env && node .agents/skills/upscaling-video/scripts/upscale.js \
  --input assets/scenes/1.mp4 \
  --output assets/scenes-upscaled/1.mp4 \
  --target-resolution 1080p \
  --target-fps 24
```

For full MV compile, use:
`source .env && node .agents/skills/compiling-video/scripts/compile.js ...`

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `input_video`, `scale_factor`, `model` (replicate or falai)
**On completion** — key `outputs`: `output_video`, `resolution`
