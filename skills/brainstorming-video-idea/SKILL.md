---
name: brainstorming-video-idea
description: Use before making any video. Negotiates the creative plan via one-question-at-a-time dialogue, proposes 2-3 directions with trade-offs, and requires explicit approval before writing any files.
---

# Brainstorming Video Idea

Help turn a rough video idea into a fully formed design through natural collaborative dialogue. Covers concept, style, characters, chapter structure, and production feasibility.

<HARD-GATE>
Do NOT write any files, create project directories, or transition to setup-video-project until the user has explicitly approved the final design. This applies to every video regardless of perceived simplicity.
</HARD-GATE>

## Checklist

1. **Explore existing context** — any prior workspace, lyrics, style references, `project.json`, previous runs
2. **Offer visual companion** (own message, not combined with questions) — see `visual-companion.md`
3. **Ask clarifying questions** — one at a time
4. **Propose 2–3 creative directions** — with trade-offs and your recommendation
5. **Present design in sections** — get approval after each section
6. **Write design doc** — save to `{project_dir}/docs/video-idea.md`
7. **Run spec document review** — use `spec-document-reviewer-prompt.md` to check the written doc
8. **Ask user to review the doc** — wait for explicit approval before proceeding
9. **Transition to `setup-video-project`**, then `writing-video-plan`

## Clarifying Questions (one at a time)

Ask in this order, adapting based on what the user has already told you:

1. **Platform and duration** — "Is this for YouTube (3–5 min MV), TikTok/Shorts (under 60s), or another platform?"
2. **Source assets** — "What inputs does this project actually depend on? For example lyrics, song audio, screenplay, voiceover, reference stills, or source footage?"
3. **Genre and mood** — "What's the emotional feel? (e.g., dreamy, high-energy, melancholic, playful)"
4. **Characters** — "Who are the main characters? Names, key visual traits, any continuity requirements across scenes?"
5. **Visual style** — "What visual style fits best? (e.g., anime, lo-fi illustration, cinematic live-action aesthetic, dark fantasy)"
6. **Scene count and pacing** — "How many distinct scenes does the song imply? (verse/chorus structure usually drives this)"
7. **Reference-image need** — "Do characters appear in 3+ scenes? If yes, reference images will be needed for consistency."
8. **Production risks** — "Any constraints I should know? (safe-for-platform content, specific character ages, model limitations)"

You do not have to ask all 8. Stop when you have enough to propose directions.

## Proposing Directions

Propose 2–3 directions. For each:
- Name (one vivid phrase)
- Visual hook (what the viewer sees in the first 3 seconds)
- Character continuity approach (none / reference images / image-to-video start frames)
- Scene progression summary (3–4 sentences)
- Production risk

Lead with your recommendation.

## Design Sections

Present in sections, get approval after each:

1. **Concept and audience** — what the viewer should feel, who this is for
2. **Characters and continuity** — names, visual traits, how consistency will be maintained
3. **Source assets** — what files the project depends on, where they should live under `assets/`, and which ones are required before planning vs execution
4. **Music and lyrics** — only if relevant for this project: source file status, lyric handling, lyric-to-scene ratio
5. **Scene progression** — chapter breakdown with section labels (intro, verse, chorus, bridge, outro)
6. **Production feasibility** — reference images needed, model constraints, estimated scene count, risks

## Written Design Doc

After approval, write to `{project_dir}/docs/video-idea.md`:

```markdown
# Video Idea: {title}

## Concept
{2–3 sentence summary of the viewer experience}

## Audience and Platform
- Platform: {platform}
- Duration: {duration}
- Tone: {tone}

## Characters
| Name | Role | Visual traits | Continuity method |
|---|---|---|---|
| ... | ... | ... | reference images / start frames / none |

## Source Assets
| Path | Purpose | Required for planning? | Required before execution? | Status |
|---|---|---|---|---|
| assets/... | lyrics / screenplay / song / voiceover / stills / footage | yes/no | yes/no | present / to be added / to be generated |

All project-specific source files should live under `{project_dir}/assets/`. This section is the source of truth for what inputs the project actually depends on.

## Music
- Source: {existing file path / to be generated / not applicable}
- Style notes: {tempo, mood, any generation parameters, or "n/a"}

## Lyric Handling
- Sung-line count: {n}
- Non-sung lines (headers/decorations): {list or "none"}
- Lyric-to-scene ratio: {n lines per scene}

## Scene Progression
| Chapter | Section | Title | Summary |
|---|---|---|---|
| 1 | Intro | ... | ... |

## Production Feasibility
- Reference images required: {yes/no, which characters}
- Estimated scene count: {n}
- Known risks: {list}
- Model constraints: {any}

## Project Seeds
- seed: {integer}
- style: "{style description}"
- defaultModel: "bytedance/seedance-1.5-pro"
- fps: 24
- resolution: "1920x1080"
```

## Spec Document Review

After writing `video-idea.md`, review it using `spec-document-reviewer-prompt.md`. Fix any issues inline before showing it to the user.

## User Review Gate

After the review loop passes, say:

> "Design doc written to `{project_dir}/docs/video-idea.md`. Please review it and let me know if you want any changes before we set up the workspace and start the production plan."

Wait for explicit approval. If changes are requested, update the doc and re-run the spec review.

## After Approval

If `{project_dir}/project.json` does not exist yet, transition to `setup-video-project` first. Once the workspace exists, transition to `writing-video-plan`.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See `skills/lib/logging-guide.md`.

- **On invocation** — event `invoked`, inputs: `topic` (rough idea), `constraints`
- **On completion** — event `completed`, outputs: `design_doc_path`, `project_json_seeds` (true/false)
