---
name: generating-seedance15-video
description: Generate scene MP4 files from storyboard JSON using Replicate bytedance/seedance-1.5-pro. Use when asked to render one scene first or batch-generate all scenes into assets/scenes/<scene_id>.mp4.
---

# Seedance 1.5 Generate

Use `scripts/generate.js` to run `bytedance/seedance-1.5-pro` via Replicate and download scene videos locally.

Always run commands through dotenv so `REPLICATE_API_TOKEN` is loaded from `.env`:
`source .env && <command>`

## Workflow

1. Generate one scene first (recommended smoke test):
`source .env && node .agents/skills/generating-seedance15-video/scripts/generate.js --input assets/storyboard.json --scene-id 1 --scenes-dir assets/scenes`

2. Verify output:
- video file: `assets/scenes/1.mp4`
- metadata: `assets/storyboard.manifest.json`

3. Generate remaining scenes into the same manifest:
`source .env && node .agents/skills/generating-seedance15-video/scripts/generate.js --input assets/storyboard.json --scene-id 2,3,4,5,6,7,8,9,10,11,12 --scenes-dir assets/scenes`

By default, output is `<input>.manifest.json` (for example `assets/storyboard.manifest.json`).
The script merges newly generated scenes with the existing manifest, keeping a single combined file.
It also skips any requested scene that already exists in the cached manifest.

## Key Options

- `--scene-id <id>`: generate only selected scenes. Repeat flag or use comma-separated values, e.g. `--scene-id 1 --scene-id 3,4`.
- `--duration <2-12>`: clip length in seconds (default `5`).
- `scene.duration` in storyboard (optional): per-scene override for clip length (`2-12`). If omitted, script uses `--duration`.
- `--aspect-ratio <16:9|9:16|4:3|3:4|1:1|21:9|9:21>` (default `16:9`).
- `--fps <24>` (default `24`).
- `--generate-audio`: enable synchronized audio generation.
- `--image <uri-or-local-path>`: optional image-to-video input.

## Output Contract

- Scene videos are saved as `<scene_id>.mp4` in `--scenes-dir`.
- Output JSON includes prediction IDs, output URLs, and `video_file` per scene.
