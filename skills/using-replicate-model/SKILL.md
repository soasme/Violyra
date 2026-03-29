---
name: using-replicate-model
description: Call AI models via Replicate's API — discover models, create predictions, poll for results, and handle outputs.
---

## Authentication

Set `REPLICATE_API_TOKEN` in your environment:

```bash
source .env
```

All requests require:

```
Authorization: Bearer $REPLICATE_API_TOKEN
Content-Type: application/json
```

## Workflow

1. **Choose the right model** — search via API or consult `references/` for preferred models
2. **Fetch model schema** — GET `/v1/models/{owner}/{model}` to confirm input parameters
3. **Create prediction** — POST to `/v1/models/{owner}/{model}/predictions`
4. **Poll for result** — GET prediction URL until `status` is `"succeeded"`
5. **Return output** — usually URLs to generated files; download and back up within 1 hour

## Model Discovery

Search:

```bash
curl -s "https://api.replicate.com/v1/models?query=video+generation" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" | jq '.results[].name'
```

Browse collections (curated by Replicate staff):

```bash
curl -s "https://api.replicate.com/v1/collections" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" | jq '.results[].slug'
```

Use official models — they are always running, have stable schemas, and predictable pricing.

## Running Models

**Use `/v1/models/{owner}/{model}/predictions`** — works for both official and community models.

**Fetch the schema before calling a model:**

```bash
curl -s "https://api.replicate.com/v1/models/{owner}/{model}" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" | jq '.latest_version.openapi_schema.components.schemas.Input'
```

**Create a prediction (async):**

```bash
curl -s -X POST "https://api.replicate.com/v1/models/{owner}/{model}/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": {"prompt": "..."}}' | jq '{id, status, urls}'
```

**Poll until complete:**

```bash
curl -s "https://api.replicate.com/v1/predictions/{id}" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" | jq '{status, output, error}'
```

**Synchronous (fast models only):**

Add `Prefer: wait` header — blocks until the prediction completes. Only use for models that finish in seconds.

## Guidelines

- Always validate inputs against the model schema before submitting
- Omit optional parameters unless you have a reason to set them
- Use HTTPS URLs for file inputs, not local paths
- Fire concurrent predictions — don't wait for one before starting the next
- Output URLs expire after 1 hour — download and back them up immediately
- Use webhooks for long-running predictions in production

## Preferred Models

See `references/` for ready-to-use examples for this project's preferred models:

- `seedance-1.5-pro.md` — ByteDance Seedance 1.5 Pro (video)
- `seedance-2.0-pro.md` — ByteDance Seedance 2.0 Pro (video)
- `veo-3.1.md` — Google Veo 3.1 (video, native audio)
- `wan-2.5-i2v.md` — Wan 2.5 image-to-video (animate)
- `chatterbox.md` — Resemble AI Chatterbox (TTS)
- `flux-1.1-pro.md` — Black Forest Labs FLUX 1.1 Pro (image)
- `topaz-video-upscale.md` — Topaz Labs video upscaler
- `nano-banana-pro.md` — Google Nano Banana Pro (image)

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `model_id`, `version` (if pinned), key input params (e.g. `prompt`, `image`)
**On completion** — key `outputs`: `output_url`, `prediction_id`
**On failed/retried** — key `notes`: error message or timeout duration
