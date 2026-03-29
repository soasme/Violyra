---
name: writing-video-prompt
description: Write optimized video generation prompts for any supported model — single-shot or multi-shot — applying universal cinematic principles and model-specific rules from the model reference file.
---

# Video Prompt Writer

## Overview

`writing-video-prompt` is the single entry point for producing video generation prompts across all supported models. It applies universal prompt principles and delegates model-specific rules (delimiter, word budget, audio support, motion language) to a model reference file in `references/`.

## Inputs

- **Shot list** — one or more shot descriptions (typically from `enriching-shot-details`)
- **Model name** — target inference model (e.g. `veo-3.1`, `seedance-2.0`, `seedance-1.5`)

## Workflow

1. Identify the target model name.
2. Open and read the corresponding file in `references/` (see table below). Apply all model-specific rules found there.
3. Apply the universal principles below to every shot.
4. From the model reference, determine whether the model accepts multi-shot prompts in a single API call or requires one API call per shot.
5. If the model accepts multi-shot prompts in a single API call, chain all shots using the model's delimiter into one inference-ready prompt string.
6. If the model requires one API call per shot (for example, Veo 3.1), produce one finalized inference-ready prompt per shot. You may additionally produce a planning chain for orchestration or review, but do not send that chain as a single API call.
7. Output the inference-ready prompt string(s) for the caller to submit. Include a separate planning chain only when it is useful and clearly marked as non-inference text.

## Universal Principles

### 1. Specify Shot Type and Camera Movement

Every prompt must open with:
- **Shot type** — wide shot, medium shot, close-up, extreme close-up, over-the-shoulder, Dutch angle, etc.
- **Camera movement** — static, slow pan, dolly in/out, tracking, handheld, aerial orbit, tilt up/down, etc.

Opening with shot type and movement produces noticeably better framing than burying it later.

### 2. Sequential Action

Order subject actions temporally. Do not describe simultaneous multi-action for a single subject.

Good:
> The chef picks up the knife, slices through the pepper, then sweeps the pieces into the pan.

Bad:
> The chef slices pepper while gesturing and speaking.

### 3. Subject Clarity

Describe each subject's distinguishing visual features explicitly: hair, clothing, props. Repeat the same descriptors across shots in the same sequence to maintain consistency.

### 4. Specificity Over Abstraction

Use concrete physical descriptions rather than emotional adjectives.

Good: "a woman sits alone at an empty table, hands folded, eyes downcast"
Bad: "a sad scene"

## Model Reference Files

| Model name | Reference file |
|---|---|
| `veo-3.1` | `references/veo-3.1-prompt.md` |
| `seedance-2.0` | `references/seedance-2.0-prompt.md` |
| `seedance-1.5` | `references/seedance-1.5-prompt.md` |

For models not listed, apply universal principles only and default to one inference-ready prompt per shot unless the caller provides confirmed multi-shot API behavior.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `shot_id` (or `shot_ids` for multi-shot), `model`
**On completion** — key `outputs`: `prompt_length`, `shot_count`, `mode` (`single`/`multi`)
