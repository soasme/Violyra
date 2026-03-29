---
name: extracting-foreground
description: Remove image backgrounds and produce transparent PNGs with Replicate 851-labs/background-remover. Use when asked to cut out subjects, remove backgrounds, or generate alpha-channel PNGs.
---

# Extract Foreground

Use `scripts/extract.js` to remove image backgrounds.

Run:
`REPLICATE_API_TOKEN=<token> node .agents/skills/extracting-foreground/scripts/extract.js --input <input-image> --output <output-image>`

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `input_image`
**On completion** — key `outputs`: `output_png`
