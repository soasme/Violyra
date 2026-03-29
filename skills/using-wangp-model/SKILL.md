---
name: using-wangp-model
description: Run video and audio inferences locally via the wangp offline batch CLI — construct commands, submit jobs, poll for completion, and return output paths.
---

## Setup

`wangp` is a local CLI for offline batch inference. No remote API token is required.

Verify the CLI is available:

```bash
wangp --version
```

If your installation requires a path to local model weights, set:

```bash
export WANGP_MODEL_DIR=/path/to/models
```

## Workflow

1. Confirm all input asset paths exist before submitting
2. Construct the `wangp run` command for the target model
3. Submit and capture the job ID from stdout
4. Poll `wangp status <job-id>` until status is `completed` or `failed`
5. Confirm output files exist in `--output-dir`; return their paths

## Video Inference

```bash
wangp run \
  --model <model-name> \
  --input <input-file-or-dir> \
  --output-dir <output-dir> \
  [--prompt "..."] \
  [additional model flags]
```

Stdout on submission:

```json
{"job_id": "<id>", "status": "submitted"}
```

Poll:

```bash
wangp status <job-id>
```

States: `pending` → `running` → `completed` | `failed`

When `completed`, output files are in `<output-dir>`.

## Audio Inference

```bash
wangp run \
  --model <model-name> \
  --input <input-file> \
  --output-dir <output-dir> \
  [--format wav|mp3] \
  [additional model flags]
```

Poll and output handling are identical to video inference.

## Guidelines

- Always confirm input paths exist before submitting (`ls <path>`)
- Use absolute paths for `--input` and `--output-dir` to avoid working-directory ambiguity
- Output files are local; no download step required
- If `wangp status` returns `failed`, capture stderr and include it in the `failed` log event

## Caching

Before submitting a job, check the project manifest. After successful inference, record the output.

**Lookup (before submitting):**
1. Compute a cache key from the prompt, model name, and inference params using `manifest-utils.js`
2. Call `readManifest(projectDir)` then `findEntry(manifest, cacheKey)`
3. If entry found and `isEntryValid(entry, projectDir)` → return `entry.output` (a project-relative path to a local file under `projectDir`); log `completed` with `notes: "cache_hit"`; skip inference

**Record (after successful inference):**
1. Build an entry: `{ cache_key, prompt, model, params_hash, output: relative-path-from-projectDir, created_at: new Date().toISOString() }`. The `output` field must be a project-relative local filesystem path under `projectDir`.
2. Call `manifest = addEntry(manifest, entry)` then `writeManifest(projectDir, manifest)`

See `skills/lib/manifest-utils.js` for all helper functions.

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `model`, `input_paths` (array), `output_dir`
**On completion** — key `outputs`: `output_paths` (array), `job_id`
**On failed/retried** — key `notes`: error output from wangp
