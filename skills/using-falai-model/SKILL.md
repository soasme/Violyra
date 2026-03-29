---
name: using-falai-model
description: Call AI models via fal.ai's API — submit to queue, poll status, retrieve results, and handle webhooks.
---

## Authentication

Set `FAL_KEY` in your environment:

```bash
source .env
```

All requests require:

```
Authorization: Key $FAL_KEY
Content-Type: application/json
```

## Calling Modes

Choose based on your use case:

| Mode | When to use | How |
|---|---|---|
| **Sync** | Fast models (<10s) | POST to `https://fal.run/{model-id}` |
| **Queue (recommended)** | Most models | POST to `https://queue.fal.run/{model-id}` → poll → fetch result |
| **Webhook** | Production / long jobs | Add `?fal_webhook=https://...` to queue submit |

## Queue Workflow (Recommended)

**Step 1 — Submit:**

```bash
curl -s -X POST "https://queue.fal.run/{model-id}" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "..."}' | jq '{request_id, status}'
```

**Step 2 — Poll status:**

```bash
curl -s "https://queue.fal.run/{model-id}/requests/{request_id}/status?logs=1" \
  -H "Authorization: Key $FAL_KEY" | jq '{status, queue_position}'
```

States: `IN_QUEUE` → `IN_PROGRESS` → `COMPLETED`

**Step 3 — Fetch result (only when COMPLETED):**

```bash
curl -s "https://queue.fal.run/{model-id}/requests/{request_id}/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.'
```

## Synchronous (Fast Models)

```bash
curl -s -X POST "https://fal.run/{model-id}" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "..."}' | jq '.'
```

## Webhooks

Add `?fal_webhook=https://your-server.com/webhook` to the queue submit URL. fal POSTs when complete:

```json
{ "request_id": "...", "status": "OK", "payload": { ... } }
```

`status` is `"OK"` or `"ERROR"`. Retries up to 10 times over 2 hours — make handlers idempotent.

## Key Differences from Replicate

| | fal.ai | Replicate |
|---|---|---|
| Auth header | `Authorization: Key $FAL_KEY` | `Authorization: Bearer $REPLICATE_API_TOKEN` |
| Model ID | `fal-ai/flux/dev` | `black-forest-labs/flux-dev` |
| Queue URL | `queue.fal.run/{model-id}` | `api.replicate.com/v1/predictions` |
| Result | Separate GET `/response` endpoint | Inline in prediction once `status: succeeded` |
| Webhook param | `?fal_webhook=...` in URL | `webhook` field in POST body |
| Auto-retry | Yes, up to 10x server-side | No |

## Preferred Models

See `references/` for ready-to-use examples:

- `veo-3.1.md` — Google Veo 3.1 (text-to-video and image-to-video)
- `wan-2.5-i2v.md` — Wan 2.5 image-to-video
- `flux-dev.md` — FLUX Dev (image generation)
- `chatterbox.md` — Chatterbox TTS
- `topaz-video-upscale.md` — Topaz video upscaler
- `nano-banana-pro.md` — Nano Banana Pro (image generation)

## Logging

Log to `{project_dir}/logs/production.jsonl`. See [`skills/lib/logging-guide.md`](../lib/logging-guide.md) for schema.

**On invocation** — key `inputs`: `model_id`, `call_mode` (`run`/`subscribe`/`submit`/`stream`/`realtime`), key input params
**On completion** — key `outputs`: `output_url`, `request_id`
**On failed/retried** — key `notes`: error message or status code
