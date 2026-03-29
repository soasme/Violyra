---
name: brainstorming-video-idea
description: Use before making any video. Refines rough ideas through questions, explores visual alternatives, produces a design doc and seeds project.json values.
---

# Brainstorming Video Idea

Helps turn a rough video idea into a fully formed design through natural collaborative dialogue. Covers concept, style, characters, chapter structure, and seed values for `project.json`.

## Checklist

1. Check existing context — any lyrics, screenplay, style references, prior `project.json`
2. Ask clarifying questions one at a time:
   - Genre and mood (e.g., cinematic, anime, lo-fi, dark fantasy)
   - Target platform and duration (YouTube MV, TikTok short, etc.)
   - Main characters — names, roles, visual traits
   - Visual style — color palette, camera style, era/setting
   - Chapter structure — how many chapters/scenes?
3. Propose 2–3 approaches to the visual concept with trade-offs
4. Present design in sections, get approval after each section
5. Write design doc to `<base-dir>/docs/video-idea.md`
6. Transition to `setup-video-project`

## Design Doc Format

Save to `<base-dir>/docs/video-idea.md`:

```
# Video Idea: <title>

## Concept
<2–3 sentence summary>

## Style
- Genre: <genre>
- Mood: <mood>
- Color palette: <palette>
- Camera style: <style>
- Era/setting: <setting>

## Characters
| Name | Role | Visual traits |
|---|---|---|
| ... | ... | ... |

## Chapter Breakdown
| Chapter | Title | Raw text summary |
|---|---|---|
| 1 | ... | ... |

## Project Seeds
- seed: <integer>
- style: "<style description>"
- defaultModel: "bytedance/seedance-1.5-pro"
- fps: 24
- resolution: "1920x1080"
```

## Output

- `<base-dir>/docs/video-idea.md`

## After Approval

Transition to `setup-video-project` with the approved design.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `topic` (the rough video idea), `constraints` (style, duration, format)
**On completion** — key `outputs`: `design_doc_path`, `project_json_seeds` (true/false)
