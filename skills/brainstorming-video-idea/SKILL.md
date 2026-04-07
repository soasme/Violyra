---
name: brainstorming-video-idea
description: Use before making any video. Negotiates the creative plan through dialogue and writes the approved project idea into SPEC.md plus setup seeds.
---

# Brainstorming Video Idea

Help turn a rough video idea into a fully formed design through natural collaborative dialogue. Cover concept, style, characters, chapter structure, source assets, and production feasibility before any files are written.

<HARD-GATE>
Do NOT write any files, create project directories, or transition to setup-video-project until the user has explicitly approved the final design.
</HARD-GATE>

## Checklist

1. Explore existing context — lyrics, screenplay, style references, prior `<base-dir>/SPEC.md`, previous runs
2. Ask clarifying questions one at a time
3. Propose 2–3 directions with trade-offs and a recommendation
4. Present design in sections and get approval after each section
5. After explicit approval, write the approved idea into the `# Idea` section of `<base-dir>/SPEC.md`
6. If available, review the written doc with `spec-document-reviewer-prompt.md`
7. Transition to `setup-video-project`

## Clarifying Questions

Ask only what is still missing, typically in this order:

1. Platform and duration
2. Source assets the project depends on
3. Genre and mood
4. Characters and continuity requirements
5. Visual style
6. Scene count and pacing
7. Whether recurring characters need reference images or start frames
8. Production risks or constraints

## Proposing Directions

Propose 2–3 directions. For each:

- name
- visual hook
- continuity approach
- scene progression summary
- main production risk

Lead with your recommendation.

## Design Sections

Present in sections and get approval after each:

1. Concept and audience
2. Characters and continuity
3. Source assets
4. Music and lyrics, if relevant
5. Scene progression
6. Production feasibility

## Design Doc Format

Save to `<base-dir>/SPEC.md`:

```md
# Spec: <title>

# Status
- Idea approved

# Idea

## Concept
<2–3 sentence summary>

## Goals
- What must the video achieve?
- What is non-negotiable?

## Audience and Platform
- Platform: <platform>
- Duration: <duration>
- Tone: <tone>

## Style
- Genre: <genre>
- Mood: <mood>
- Color palette: <palette>
- Camera style: <style>
- Era/setting: <setting>

## Characters
| Name | Role | Visual traits | Continuity method |
|---|---|---|---|
| ... | ... | ... | reference images / start frames / none |

## Source Assets
| Path | Purpose | Required before planning? | Required before execution? | Status |
|---|---|---|---|---|
| project/assets/... | lyrics / screenplay / song / stills / footage | yes/no | yes/no | present / to be added / to be generated |

## Chapter Breakdown
| Chapter | Title | Raw text summary |
|---|---|---|
| 1 | ... | ... |

## Constraints
- Duration: <target duration>
- Platform: <target platform>
- Safety / content limits: <limits>

## Production Feasibility
- Reference images required: <yes/no, which characters>
- Estimated scene count: <n>
- Known risks: <list>

## Setup Seeds
- seed: <integer>
- style: <style description>
- defaultModel: bytedance/seedance-1.5-pro
- fps: 24
- resolution: 1920x1080

## Open Questions
- <question or `None`>
```

## Output

- `<base-dir>/SPEC.md`

## After Approval

Transition to `setup-video-project` with the approved design already captured in `<base-dir>/SPEC.md`. `writing-video-plan` should later refine the rest of the spec around that approved `# Idea` section.

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `topic`, `constraints`
- **On completion** — event `completed`, outputs: `spec_path`, `setup_seeds_ready` (true/false)
