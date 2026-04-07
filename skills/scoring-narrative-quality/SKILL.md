---
name: scoring-narrative-quality
description: Score a compiled video's narrative quality on 5 dimensions (hook, pacing, arc, variety, payoff). Run after compiling-video. Writes a scored event to production.jsonl.
---

# Narrative Quality Scorer

## Overview

`scoring-narrative-quality` evaluates a completed, compiled video against a 5-dimension narrative and retention rubric. It produces a composite score (0–100) and writes a `scored` event to the project's `production.jsonl` log.

**Run this skill after `compiling-video`.** It complements `retention-driven-development` (which operates per-shot during production) by evaluating the assembled whole.

---

## Inputs

| Input | Required | Description |
|---|---|---|
| Compiled video path | yes | The output of `compiling-video` |
| `production.jsonl` path | yes | `{project_dir}/project/logs/production.jsonl` — pipeline context |
| Storyboard / shot list path | yes | The enriched shot list used during production |

---

## Process

### Step 1 — Read pipeline context

Read `production.jsonl` to understand what was generated:
- How many shots were retried or failed
- Which shots were replaced by `retention-driven-development`
- Any notes or anomalies logged by previous skills

### Step 2 — Review the compiled video

Watch or scrub through the compiled video with the storyboard open alongside. Evaluate each dimension independently.

### Step 3 — Score each dimension

Score each dimension 0–20. Use the rubric below. Do not round up — assign the score the video earns.

### Step 4 — Write scored event to production.jsonl

Append a single `scored` line to `{project_dir}/project/logs/production.jsonl`:

```
{"ts":"<iso>","skill":"scoring-narrative-quality","event":"scored","scores":{"hook":<n>,"pacing":<n>,"emotional_arc":<n>,"visual_variety":<n>,"payoff":<n>},"composite":<sum>,"notes":"<observations>"}
```

### Step 5 — Act on the score

- **Composite ≥ 85** — delivery-ready. Proceed to final export.
- **Composite 70–84** — acceptable. Note the weakest dimension; consider one targeted `retention-driven-development` pass.
- **Composite < 70** — not ready. Identify the lowest-scoring dimension and run a targeted `retention-driven-development` pass on those shots, then recompile and re-score.

---

## Scoring Rubric

### Hook (0–20)

Does the opening 3 seconds compel continued watching?

| Score | Criteria |
|---|---|
| 17–20 | Immediately arresting — striking visual, strong motion, or emotional provocation within 2s |
| 13–16 | Engaging opening that establishes tone; viewer wants to continue |
| 9–12 | Serviceable but generic; no clear hook |
| 5–8 | Slow or unclear; most viewers would scroll past |
| 0–4 | Black frame, title card, or visually inert opener |

### Pacing (0–20)

Do cuts and shot durations match the emotional rhythm of the content?

| Score | Criteria |
|---|---|
| 17–20 | Cut timing feels inevitable; accelerates and relaxes with the music or narrative beat |
| 13–16 | Generally well-paced with minor timing mismatches |
| 9–12 | Some cuts feel early or late; rhythm occasionally broken |
| 5–8 | Multiple pacing issues; cuts fight rather than support the content |
| 0–4 | Disconnected from any rhythm; purely mechanical |

### Emotional Arc (0–20)

Is there a clear build, peak, and resolution across the full video?

| Score | Criteria |
|---|---|
| 17–20 | Distinct three-phase arc — tension builds, peaks at a clear emotional high point, resolves |
| 13–16 | Arc present but one phase (build, peak, or resolution) is weak |
| 9–12 | Partial arc; either no clear peak or no resolution |
| 5–8 | Flat emotional tone throughout |
| 0–4 | No discernible arc; scenes feel randomly ordered |

### Visual Variety (0–20)

Do shot types, angles, and framing change enough to sustain attention?

| Score | Criteria |
|---|---|
| 17–20 | Rich mix of close-ups, mediums, wides, and angle changes; no two consecutive shots feel identical |
| 13–16 | Good variety with occasional repetition |
| 9–12 | Noticeable repeated framing (e.g., 3+ consecutive medium shots) |
| 5–8 | Mostly one or two shot types throughout |
| 0–4 | All shots feel visually identical |

### Payoff (0–20)

Does the ending feel earned relative to the setup?

| Score | Criteria |
|---|---|
| 17–20 | Final shot or sequence delivers a clear, satisfying resolution of the opening tension |
| 13–16 | Ending works but doesn't fully close the arc set up at the start |
| 9–12 | Ending is present but arbitrary; no clear connection to opening |
| 5–8 | Abrupt or fading end with no resolution |
| 0–4 | Video simply stops; no ending |

---

## Score Thresholds

| Composite | Interpretation | Next action |
|---|---|---|
| 85–100 | Delivery-ready | Export final |
| 70–84 | Acceptable | Optional: one targeted `retention-driven-development` pass on the weakest dimension |
| < 70 | Not ready | Run targeted `retention-driven-development` on the lowest-scoring dimension, recompile, re-score |

### Dimension → retention target mapping

When composite < 70, use the lowest-scoring dimension to direct the `retention-driven-development` pass:

| Weakest dimension | Focus for retention pass |
|---|---|
| `hook` | Replace shot 1 (and shot 2 if needed); prioritize striking opening motion |
| `pacing` | Replace shots where cut timing feels wrong relative to the beat |
| `emotional_arc` | Replace shots at the build or peak that fail to escalate tension |
| `visual_variety` | Replace consecutive shots with identical framing |
| `payoff` | Replace the final 1–3 shots with stronger resolution imagery |

---

## Relationship to retention-driven-development

| Skill | Scope | When |
|---|---|---|
| `retention-driven-development` | Per-shot viewer simulation; replaces weak shots | During production, before `compiling-video` |
| `scoring-narrative-quality` | Whole-video narrative arc evaluation | After `compiling-video` |

Running `retention-driven-development` before compilation reduces the likelihood of a low `scoring-narrative-quality` score, but does not replace it — the assembled whole can fail even when individual shots pass.

---

## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `video_path`, `production_log_path`, `shot_list_path`
**On completion** — use event `scored` with `scores` object and `composite` field (not `completed`)
