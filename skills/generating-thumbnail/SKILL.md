---
name: generating-thumbnail
description: Generate YouTube thumbnail images with Replicate google/nano-banana-pro. Use when asked to create or iterate 16:9 thumbnail concepts from prompts and reference images, saving JPG/PNG locally.
---

# Generate Thumbnail

Use `scripts/generate.js` to call Replicate `google/nano-banana-pro` and save a local thumbnail image.

Source `.env` so `REPLICATE_API_TOKEN` is loaded:
`source .env && <command>`

## Workflow

1. Extract 2-4 candidate reference frames from the final video using ffmpeg or existing stills. Prefer expressive frames with clean faces, readable composition, and title-safe space.
2. Generate multiple thumbnail candidates, not just one:
`source .env && node .agents/skills/generating-thumbnail/scripts/generate.js --prompt "YouTube thumbnail, dramatic split-light portrait, bold headline area, high contrast, clean background" --image final/frame-01.jpg --output final/thumbnail.candidate-1.jpg --aspect-ratio 16:9 --resolution 2K`
3. Generate at least one alternate concept with a different crop or emphasis:
`source .env && node .agents/skills/generating-thumbnail/scripts/generate.js --prompt "YouTube thumbnail, bright character close-up, strong emotion, clean sky background, clear title-safe area" --image final/frame-02.jpg --output final/thumbnail.candidate-2.jpg --aspect-ratio 16:9 --resolution 2K`
4. Compare the candidates for:
   - readability at small size
   - subject clarity
   - emotional hook
   - clean title-safe space
5. Save the winner as the delivery thumbnail, typically `<base-dir>/final/thumbnail.jpg`.

Local `--image` paths are uploaded to Replicate Files API automatically. Hosted URLs and data URIs are passed through unchanged.

## Key Options

- `--prompt`: required text prompt.
- `--output`: required local output path (for example `assets/thumbnails/video-42.jpg`).
- `--image`: optional reference image; repeat flag or use comma-separated values.
- `--aspect-ratio`: `match_input_image | 1:1 | 2:3 | 3:2 | 3:4 | 4:3 | 4:5 | 5:4 | 9:16 | 16:9 | 21:9` (default `16:9`).
- `--resolution`: `1K | 2K | 4K` (default `2K`).
- `--output-format`: `jpg | png` (default `jpg`).
- `--safety-filter-level`: `block_low_and_above | block_medium_and_above | block_only_high` (default `block_only_high`).
- `--allow-fallback-model`: optional boolean flag.

## Output Contract

- Saves one or more candidate images to local paths provided via `--output`.
- Keeps alternates when helpful (for example `thumbnail.candidate-1.jpg`, `thumbnail.candidate-2.jpg`).
- Saves the selected delivery image as `<base-dir>/final/thumbnail.jpg`.
- Prints prediction metadata and final output URL for traceability.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `prompt`, `style`, `aspect_ratio`
**On completion** — key `outputs`: `thumbnail_path`
