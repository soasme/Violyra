---
name: generating-thumbnail
description: Generate YouTube thumbnail images with Replicate google/nano-banana-pro. Use when asked to create or iterate 16:9 thumbnail concepts from prompts and reference images, saving JPG/PNG locally.
---

# Generate Thumbnail

Use `scripts/generate.js` to call Replicate `google/nano-banana-pro` and save local thumbnail images.

Source `.env` so `REPLICATE_API_TOKEN` is loaded:
`source .env && <command>`

## Workflow

1. Extract 2–4 candidate reference frames from the final video or use existing stills. Prefer expressive frames with clean faces, readable composition, and title-safe space.
2. Generate multiple thumbnail candidates, not just one:
`source .env && node .agents/skills/generating-thumbnail/scripts/generate.js --prompt "YouTube thumbnail, dramatic split-light portrait, bold headline area, high contrast, clean background" --image project/assets/images/ref/frame-01.jpg --output project/assets/images/thumbnails/candidate-1.jpg --aspect-ratio 16:9 --resolution 2K`
3. Generate at least one alternate concept with a different crop or emphasis:
`source .env && node .agents/skills/generating-thumbnail/scripts/generate.js --prompt "YouTube thumbnail, bright character close-up, strong emotion, clear title-safe area" --image project/assets/images/ref/frame-02.jpg --output project/assets/images/thumbnails/candidate-2.jpg --aspect-ratio 16:9 --resolution 2K`
4. Compare candidates for:
   - readability at small size
   - subject clarity
   - emotional hook
   - clean title-safe space
5. Save the winner to the delivery path, for example `project/assets/images/thumbnails/final.jpg`.
6. Verify the output file exists at the chosen path.

Local `--image` paths are uploaded to Replicate Files API automatically. Hosted URLs and data URIs are passed through unchanged.

## Key Options

- `--prompt`: required text prompt.
- `--output`: required local output path, for example `project/assets/images/thumbnails/video-42.jpg`.
- `--image`: optional reference image; repeat flag or use comma-separated values.
- `--aspect-ratio`: `match_input_image | 1:1 | 2:3 | 3:2 | 3:4 | 4:3 | 4:5 | 5:4 | 9:16 | 16:9 | 21:9` (default `16:9`).
- `--resolution`: `1K | 2K | 4K` (default `2K`).
- `--output-format`: `jpg | png` (default `jpg`).
- `--safety-filter-level`: `block_low_and_above | block_medium_and_above | block_only_high` (default `block_only_high`).
- `--allow-fallback-model`: optional boolean flag.

## Output Contract

- Saves one or more thumbnail candidates to local paths under `project/assets/images/`
- Prints prediction metadata and final output URL for traceability
- Delivery should select one final thumbnail rather than leaving an arbitrary candidate as the final output

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `prompt`, `style`, `aspect_ratio`
**On completion** — key `outputs`: `thumbnail_path`
