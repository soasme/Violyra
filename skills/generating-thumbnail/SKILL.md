---
name: generating-thumbnail
description: Generate YouTube thumbnail images with Replicate google/nano-banana-pro. Use when asked to create or iterate 16:9 thumbnail concepts from prompts and reference images, saving JPG/PNG locally.
---

# Generate Thumbnail

Use `scripts/generate.js` to call Replicate `google/nano-banana-pro` and save a local thumbnail image.

Source `.env` so `REPLICATE_API_TOKEN` is loaded:
`source .env && <command>`

## Workflow

1. Generate a thumbnail from prompt text:
`source .env && node .agents/skills/generating-thumbnail/scripts/generate.js --prompt "YouTube thumbnail, dramatic split-light portrait, bold headline area, high contrast, clean background" --output assets/thumbnails/episode-01.jpg --aspect-ratio 16:9 --resolution 2K`

2. Optionally provide one or more reference images:
`source .env && node .agents/skills/generating-thumbnail/scripts/generate.js --prompt "YouTube thumbnail for coding tutorial, laptop close-up, energetic composition, clear title-safe space" --image assets/ref/host.png --image https://example.com/product.png --output assets/thumbnails/tutorial.jpg`

3. Verify output file exists at `--output`.

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

- Saves a generated thumbnail image to the local path provided via `--output`.
- Prints prediction metadata and final output URL for traceability.
