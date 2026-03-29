---
name: prompt-template
description: Use when creating, reading, updating, deleting, or listing reusable prompt templates with {{variable}} slots for video generation.
---

# Prompt Template

Manages reusable prompt templates with `{{variable}}` slots. Agents substitute values when applying a template to a shot.

## Subcommands

```bash
source .env && node skills/prompt-template/scripts/prompt-template.js <subcommand> [options]
```

### create
```bash
source .env && node skills/prompt-template/scripts/prompt-template.js create \
  --base-dir assets/ \
  --name "High-Energy Performance" \
  --category video_prompt \
  --content "{{character}} performing with intense energy, {{cameraMovement}}, {{lighting}}, cinematic 35mm" \
  --variables '["character","cameraMovement","lighting"]' \
  --preview "Performance shot with dynamic lighting"
```
File: `<base-dir>/global/templates/<id>/template.json`.

### read / update / delete / list
`--id`, `--base-dir`, `--filter` work the same. Update accepts any create flag except `--category`.

## Category values
`video_prompt | storyboard_prompt | bgm | sfx | character_image_front | character_image_other | actor_image_front | actor_image_other | prop_image_front | prop_image_other | scene_image_front | scene_image_other | costume_image_front | costume_image_other | frame_head_image | frame_tail_image | frame_key_image | frame_head_prompt | frame_tail_prompt | frame_key_prompt | combined`

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `template_name`, `variables` (list of slot names), `action` (`create`/`render`/`list`)
**On completion** — key `outputs`: `template_path`, `rendered_output_path` (if `action` is `render`)
