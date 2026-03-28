# Veo 3 — fal.ai Reference

| Field              | Value                                                                   |
|--------------------|-------------------------------------------------------------------------|
| Text-to-video ID   | `fal-ai/veo3`                                                           |
| Image-to-video ID  | `fal-ai/veo3/image-to-video`                                            |
| T2V queue endpoint | `https://queue.fal.run/fal-ai/veo3`                                     |
| I2V queue endpoint | `https://queue.fal.run/fal-ai/veo3/image-to-video`                     |
| Use                | Text-to-video and image-to-video with native audio generation           |

> **Note:** fal.ai's current production endpoint for Veo 3.1 generation is `fal-ai/veo3` (not `fal-ai/veo3.1`). As of 2026-03-28, fal.ai has not published a separate `veo3.1` route. Update the endpoint to `fal-ai/veo3.1` once fal.ai makes it available.

> **Audio note:** Veo 3 generates audio natively alongside video (`generate_audio` defaults to `true`). Include sound cues in your prompt — ambient sounds, music style, dialogue, or silence directives — to guide the audio output. See the `writing-veo31-prompt` skill for prompt writing guidance.

> **Fast variant:** A cheaper, faster variant is available as `fal-ai/veo3/fast` (T2V) and `fal-ai/veo3/fast/image-to-video` (I2V). The fast queue endpoints follow the same pattern.

## Duration Tiers

| Duration | Use when                                                                 |
|----------|--------------------------------------------------------------------------|
| `4s`     | Establishing shots, cutaways, simple visual statements                   |
| `6s`     | Dialogue moments, character reactions, narrative beats                   |
| `8s`     | Complex motion, R2V reference-based generation, 1080p output            |

## Key Inputs — Text-to-Video (`fal-ai/veo3`)

| Parameter          | Type    | Default  | Options / Range          | Description                                                                             |
|--------------------|---------|----------|--------------------------|-----------------------------------------------------------------------------------------|
| `prompt`           | string  | —        | required, max 20 k chars | Text description of the video content, motion, and audio                               |
| `aspect_ratio`     | enum    | `"16:9"` | `"16:9"` `"9:16"`        | Output aspect ratio                                                                     |
| `duration`         | enum    | `"8s"`   | `"4s"` `"6s"` `"8s"`    | Video length in seconds                                                                 |
| `resolution`       | enum    | `"720p"` | `"720p"` `"1080p"`       | Output resolution                                                                       |
| `generate_audio`   | boolean | `true`   | `true` `false`           | Generate native audio alongside the video                                               |
| `negative_prompt`  | string  | `null`   | free text                | Elements to exclude from the generated video                                            |
| `auto_fix`         | boolean | `true`   | `true` `false`           | Auto-correct prompts that fail content-policy validation                                |
| `safety_tolerance` | enum    | `"4"`    | `"1"`–`"6"`              | Content moderation strictness (1 = strictest, 6 = least strict)                        |
| `seed`             | integer | `null`   | any integer              | Random seed for reproducible generation                                                 |

## Key Inputs — Image-to-Video (`fal-ai/veo3/image-to-video`)

Same parameters as text-to-video, with these changes:

| Parameter          | Type    | Default  | Options / Range          | Description                                                                             |
|--------------------|---------|----------|--------------------------|-----------------------------------------------------------------------------------------|
| `image_url`        | string  | —        | HTTPS URL, required      | Start frame to animate; ideal size is 1280×720 (16:9) or 720×1280 (9:16)              |
| `prompt`           | string  | —        | required                 | How the image should be animated                                                        |
| `aspect_ratio`     | enum    | `"auto"` | `"auto"` `"16:9"` `"9:16"` | `"auto"` inherits the input image aspect ratio                                       |
| `auto_fix`         | boolean | `false`  | `true` `false`           | Disabled by default for I2V mode                                                        |

## Curl — Text-to-Video

```bash
# 1. Submit to queue
REQUEST=$(curl -s -X POST "https://queue.fal.run/fal-ai/veo3" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Golden hour on a quiet beach, waves gently lapping the shore, seagulls calling in the distance, light wind rustling beach grass",
    "duration": "8s",
    "aspect_ratio": "16:9",
    "resolution": "1080p",
    "generate_audio": true
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/veo3/requests/$REQUEST_ID/status?logs=1" \
    -H "Authorization: Key $FAL_KEY")
  STATUS=$(echo "$STATUS_RESP" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Error: $(echo "$STATUS_RESP" | jq -r '.error')"
    exit 1
  fi
  sleep 10
done

# 3. Fetch result
curl -s "https://queue.fal.run/fal-ai/veo3/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.video.url'
```

## Curl — Image-to-Video

```bash
# 1. Submit to queue
REQUEST=$(curl -s -X POST "https://queue.fal.run/fal-ai/veo3/image-to-video" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "The lighthouse beacon slowly rotates, fog rolling in from the sea, the distant foghorn echoing",
    "image_url": "https://example.com/lighthouse.jpg",
    "duration": "8s",
    "resolution": "1080p",
    "generate_audio": true
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/veo3/image-to-video/requests/$REQUEST_ID/status?logs=1" \
    -H "Authorization: Key $FAL_KEY")
  STATUS=$(echo "$STATUS_RESP" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Error: $(echo "$STATUS_RESP" | jq -r '.error')"
    exit 1
  fi
  sleep 10
done

# 3. Fetch result
curl -s "https://queue.fal.run/fal-ai/veo3/image-to-video/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.video.url'
```

## JavaScript — async/await

```js
const FAL_KEY = process.env.FAL_KEY;
const BASE = "https://queue.fal.run";

async function generateVideo(endpointId, input) {
  // 1. Submit to queue
  const submitRes = await fetch(`${BASE}/${endpointId}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const submitted = await submitRes.json();
  if (!submitRes.ok) throw new Error(submitted.detail ?? "Submit failed");

  const requestId = submitted.request_id;
  console.log("Request ID:", requestId);

  // 2. Poll until COMPLETED
  while (true) {
    await new Promise((r) => setTimeout(r, 10000));
    const statusRes = await fetch(
      `${BASE}/${endpointId}/requests/${requestId}/status?logs=1`,
      { headers: { Authorization: `Key ${FAL_KEY}` } }
    );
    const status = await statusRes.json();
    console.log("Status:", status.status);

    if (status.status === "COMPLETED") break;
    if (status.status === "FAILED") {
      throw new Error(status.error ?? "Generation failed");
    }
  }

  // 3. Fetch result
  const resultRes = await fetch(
    `${BASE}/${endpointId}/requests/${requestId}/response`,
    { headers: { Authorization: `Key ${FAL_KEY}` } }
  );
  const result = await resultRes.json();
  return result.video.url; // HTTPS URL to the generated video (download promptly)
}

// Text-to-video example
const videoUrl = await generateVideo("fal-ai/veo3", {
  prompt:
    "Golden hour on a quiet beach, waves gently lapping the shore, seagulls calling in the distance, light wind rustling beach grass",
  duration: "8s",
  aspect_ratio: "16:9",
  resolution: "1080p",
  generate_audio: true,
});
console.log("Video URL:", videoUrl);

// Image-to-video example
const i2vUrl = await generateVideo("fal-ai/veo3/image-to-video", {
  prompt:
    "The lighthouse beacon slowly rotates, fog rolling in from the sea, the distant foghorn echoing",
  image_url: "https://example.com/lighthouse.jpg",
  duration: "8s",
  resolution: "1080p",
  generate_audio: true,
});
console.log("Video URL:", i2vUrl);
```

## Notes

- Output URLs are temporary — download and back up as soon as generation completes.
- `generate_audio` defaults to `true`; Veo 3 generates audio natively. Include sound cues in the prompt for best results.
- `aspect_ratio` is ignored (treated as `"auto"`) in image-to-video mode; the output inherits the input image's aspect ratio.
- Duration values are strings with the `s` suffix (`"4s"`, `"6s"`, `"8s"`), unlike the Replicate version which uses bare integers.
- Veo 3 generation takes 2–5 minutes — use a 10-second poll interval.
- Fire concurrent requests rather than waiting sequentially — fal.ai runs them in parallel.
- Pricing (standard): $0.20/s audio off, $0.40/s audio on. Fast variant: $0.10/s audio off, $0.15/s audio on.
