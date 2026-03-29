# Violyra Usage Guide

Violyra is a skill library for AI agents doing video production work. It is not a single fixed pipeline. You choose the skills that fit the project type: music video, short drama, anime short, narrated explainer, mixed-media edit, and so on.

Use this guide as the general entry point. For the full architecture and skill catalog, see [design.md](./design.md).

## Before You Start

- Install dependencies at the repo root with `pnpm install`
- Put required credentials in `.env`
- Create a project workspace under `assets/`
- Keep project-specific files inside that workspace

Typical project workspace after setup:

```text
assets/<project>/
├── assets/        # input files and generated intermediate assets
├── docs/          # idea docs, plans, review notes
├── logs/          # production.jsonl and other run artifacts
├── final/         # final renders and delivery assets
├── global/        # global packs created during extraction / planning
├── characters/    # project-scoped character packs
└── chapters/      # chapter-level breakdown and generation outputs
```

## Basic Flow

Many projects follow this shape:

```bash
# define the concept and constraints
/brainstorming-video-idea

# create the project workspace
/setup-video-project

# copy the project's input files into assets/<project>/assets/

# write the production plan for this specific project
/writing-video-plan

# run the next phase and repeat as the project advances
/executing-video-plan
```

The important part is not the exact file names. The important part is that the project's required inputs live under `assets/<project>/assets/` and are declared clearly in the project's design / idea document so the planner can derive the production requirements from the actual project.

## Choosing The Right Workflow

### Idea-first workflow

Use this when you are starting from a rough prompt, song concept, screenplay idea, or visual direction.

Typical sequence:

1. `brainstorming-video-idea`
2. `setup-video-project`
3. place source assets in `assets/`
4. `writing-video-plan`
5. `executing-video-plan`
6. `retention-driven-development`
7. `requesting-video-review`

### Full-pipeline workflow

Use this when the project cleanly matches one of Violyra's end-to-end pipeline patterns.

- `mv-production-pipeline` for music-video style productions
- `shorts-production-pipeline` for short-form narrative productions

Use these when you want one higher-level workflow instead of manually stepping through planning and execution.

### Direct skill workflow

Use this when you already know which step you need.

Examples:

- already have lyrics and want timing: `aligning-lyrics`
- already have a shot list and want packs/details: `running-video-production-pipeline`
- already have prompts and want generation: `using-replicate-model` or `using-falai-model`
- already have scenes and want final assembly: `compiling-video`

## Source Assets

Violyra supports different project inputs. Do not assume every project uses the same files.

Examples of valid source assets:

- lyrics
- song audio
- screenplay
- story brief
- voiceover audio
- reference images
- source footage
- a YouTube URL to download from

The correct rule is:

1. Put project inputs under `assets/<project>/assets/`
2. Make the required inputs explicit in the project's design / idea document
3. Let the planning skill derive the execution requirements from that project context

## Typical Project Patterns

These are examples, not hard rules. The exact phase order should come from the approved idea doc and the production plan written for that project.

### Music Video

Common inputs:

- lyrics
- song audio, or lyrics plus a song-generation step
- style direction
- recurring characters if applicable

Common sequence:

1. `generating-lyrics` if lyrics do not exist yet
2. `generating-song` if audio does not exist yet
3. `aligning-lyrics`
4. `writing-video-plan`
5. `running-video-production-pipeline`
6. prompt writing
7. video generation
8. `compiling-video`
9. `retention-driven-development`
10. `requesting-video-review`
11. `generating-thumbnail`

### Short Drama / Narrative

Common inputs:

- screenplay or story brief
- character definitions
- reference images or look references
- optional voiceover or dialogue assets

Common sequence:

1. `brainstorming-video-idea`
2. `setup-video-project`
3. `writing-video-plan`
4. `running-video-production-pipeline`
5. prompt writing
6. video generation
7. `compiling-video`
8. `retention-driven-development`
9. `requesting-video-review`

### Mixed or Custom Project

If the project is unusual, use the skill library compositionally instead of forcing it into one template.

Start from:

1. `brainstorming-video-idea`
2. `setup-video-project`
3. place the required inputs in `assets/`
4. use `writing-video-plan` to make the project-specific phase order explicit

## Core Skill Groups

### Workflow

- `brainstorming-video-idea`
- `setup-video-project`
- `writing-video-plan`
- `executing-video-plan`
- `retention-driven-development`
- `requesting-video-review`

### Production Pipeline

- `breaking-down-video-script`
- `extracting-video-entities`
- `enriching-shot-details`
- `checking-consistency`
- `running-video-production-pipeline`

### Generation

- `writing-video-prompt`
- `using-replicate-model`
- `using-falai-model`
- `upscaling-video`
- `extracting-foreground`
- `generating-thumbnail`

### Audio / Music

- `generating-lyrics`
- `generating-song`
- `aligning-lyrics`
- `generating-voiceover`

## Review And Iteration

Violyra is built for iteration, not one-pass perfection.

Use these review loops deliberately:

- `retention-driven-development` when generated scenes are weak or uneven
- `requesting-video-review` before delivery or after any major production milestone
- `scoring-narrative-quality` after full compile when you want a whole-video narrative score

The general rule is:

1. generate a draft
2. review it
3. replace weak pieces
4. recompile
5. review again

## Common Questions

### What do I put in `assets/`?

Whatever the project depends on: lyrics, screenplay, song audio, reference stills, source footage, voiceover, downloads, or generated intermediates.

### Do I need all workflow skills every time?

No. Some projects need the full concept → plan → execution flow. Some only need one skill.

### Is `writing-video-plan` only for music videos?

No. It should describe the production steps for the current project. The exact source assets and phase requirements should come from the project context, not from a single hardcoded file list.

### When should I use the full pipeline skills?

When the project clearly matches them:

- `mv-production-pipeline` for music videos
- `shorts-production-pipeline` for short-form narrative work

Otherwise, compose the lower-level skills yourself.

## Next References

- [design.md](./design.md) for architecture and skill inventory
- [installation.md](./installation.md) for setup
- [testing.md](./testing.md) for repo verification
