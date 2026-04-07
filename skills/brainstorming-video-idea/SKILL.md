---
name: brainstorming-video-idea
description: Use before making any video. Refines rough ideas through questions, explores visual alternatives, and writes the project idea doc plus setup seeds.
---

# Brainstorming Video Idea

Helps turn a rough video idea into a fully formed design through natural collaborative dialogue. Covers concept, style, characters, chapter structure, and seed values for project setup.

## Checklist

1. Check existing context — any lyrics, screenplay, style references, prior `<base-dir>/docs/idea.md`, prior `project.json`
2. Ask clarifying questions one at a time:
   - Genre and mood (e.g., cinematic, anime, lo-fi, dark fantasy)
   - Target platform and duration (YouTube MV, TikTok short, etc.)
   - Main characters — names, roles, visual traits
   - Visual style — color palette, camera style, era/setting
   - Chapter structure — how many chapters/scenes?
3. Propose 2–3 approaches to the visual concept with trade-offs
4. Present design in sections, get approval after each section
5. Write the approved design doc to `<base-dir>/docs/idea.md`
6. Transition to `setup-video-project`

## Design Doc Format

Save to `<base-dir>/docs/idea.md`:

```
# Idea: <title>

## Concept
<2–3 sentence summary>

## Goals
- What must the video achieve?
- What is non-negotiable?

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

## Constraints
- Duration: <target duration>
- Platform: <target platform>
- Safety / content limits: <limits>

## Setup Seeds
- seed: <integer>
- style: "<style description>"
- defaultModel: "bytedance/seedance-1.5-pro"
- fps: 24
- resolution: "1920x1080"

## Open Questions
- <question or `None`>
```

## Output

- `<base-dir>/docs/idea.md`

## After Approval

Transition to `setup-video-project` with the approved design.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `topic` (the rough video idea), `constraints` (style, duration, format)
**On completion** — key `outputs`: `idea_doc_path`, `setup_seeds_ready` (true/false)
