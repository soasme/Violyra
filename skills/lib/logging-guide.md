# Production Log — JSONL Logging Guide

Every skill writes to `{project_dir}/project/logs/production.jsonl`. Each line is a JSON object. The file is append-only and never truncated.

## Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `ts` | ISO 8601 string | yes | Timestamp of the event (`new Date().toISOString()`) |
| `skill` | string | yes | Skill name — must match the `name` field in the skill's frontmatter |
| `event` | string | yes | One of: `invoked`, `completed`, `failed`, `retried`, `scored` |
| `reason` | string | on `invoked` | Why the agent called this skill — free text written by the agent |
| `inputs` | object | no | Key input parameters relevant to this skill invocation |
| `outputs` | object | no | Key output artifacts or results |
| `notes` | string | no | Agent observations, decisions made, or anomalies noticed |

## Events

- `invoked` — written immediately before executing the skill. Include `reason` and `inputs`.
- `completed` — written when the skill finishes successfully. Include `outputs`.
- `failed` — written when the skill encounters an unrecoverable error. Include `notes` with the error.
- `retried` — written when the agent retries after a `failed` event. Include `inputs`.
- `scored` — written by `scoring-narrative-quality` only. Include `scores` object and `composite`.

## How to append a log entry

The agent appends a single JSON line to the log file. Use this format:

```
echo '{"ts":"<iso>","skill":"<name>","event":"invoked","reason":"<why>","inputs":{...}}' >> {project_dir}/project/logs/production.jsonl
```

Or write the line using any method that appends without overwriting.

Create the `project/logs/` directory if it does not exist:

```
mkdir -p {project_dir}/project/logs
```

## Example — full lifecycle of one skill call

```jsonl
{"ts":"2026-03-29T12:00:00Z","skill":"writing-veo31-prompt","event":"invoked","reason":"Shot 3 needs a close-up prompt for the bridge section","inputs":{"shot_id":"ch1-s03","mode":"text_to_video"}}
{"ts":"2026-03-29T12:01:14Z","skill":"writing-veo31-prompt","event":"completed","outputs":{"prompt_length":142,"shot_id":"ch1-s03"},"notes":"Used R2V mode due to reference image availability"}
{"ts":"2026-03-29T12:05:00Z","skill":"using-falai-model","event":"invoked","reason":"Generating video for ch1-s03 using veo3.1","inputs":{"model_id":"fal-ai/veo3.1/text-to-video","shot_id":"ch1-s03"}}
{"ts":"2026-03-29T12:07:33Z","skill":"using-falai-model","event":"failed","notes":"Timeout after 120s"}
{"ts":"2026-03-29T12:07:35Z","skill":"using-falai-model","event":"retried","inputs":{"model_id":"fal-ai/veo3.1/text-to-video","shot_id":"ch1-s03"}}
{"ts":"2026-03-29T12:10:01Z","skill":"using-falai-model","event":"completed","outputs":{"output_url":"https://cdn.fal.ai/...","duration_s":8,"shot_id":"ch1-s03"}}
{"ts":"2026-03-29T14:22:00Z","skill":"scoring-narrative-quality","event":"scored","scores":{"hook":16,"pacing":14,"emotional_arc":18,"visual_variety":12,"payoff":15},"composite":75,"notes":"Visual variety dragged by 4 consecutive medium shots in the chorus"}
```

## Logging section format in SKILL.md

Each skill's `SKILL.md` ends with a `## Logging` section that specifies the key `inputs` and `outputs` fields for that skill. Example:

```markdown
## Logging

Log to `{project_dir}/project/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `shot_id`, `mode`
**On completion** — key `outputs`: `prompt_length`, `shot_id`
```
