# Wan 2.5 Image-to-Video — fal.ai Reference

| Field          | Value                                                                      |
|----------------|----------------------------------------------------------------------------|
| Model ID       | `fal-ai/wan-25-preview/image-to-video`                                     |
| Queue endpoint | `https://queue.fal.run/fal-ai/wan-25-preview/image-to-video`              |
| Use            | Animate a still image into a video clip with optional background audio     |

> **Note:** This endpoint uses the `wan-25-preview` route, which may be updated or renamed when the model reaches stable release. Check `https://fal.ai/models` for a stable `wan-2.5` endpoint before using in production.

## Key Inputs

| Parameter                | Type    | Default  | Options / Range          | Description                                                              |
|--------------------------|---------|----------|--------------------------|--------------------------------------------------------------------------|
| `image_url`              | string  | —        | HTTPS URL, required      | Input image to animate (resized/center-cropped if aspect ratio differs)  |
| `prompt`                 | string  | —        | required, max 800 chars  | Text description of the desired motion and video content                 |
| `negative_prompt`        | string  | —        | free text                | Elements to exclude from the generated video                             |
| `audio_url`              | string  | —        | HTTPS URL (wav/mp3)      | Background audio for the generated video                                 |
| `resolution`             | enum    | `"1080p"`| `"480p"` `"720p"` `"1080p"` | Output resolution                                                     |
| `duration`               | enum    | `"5"`    | `"5"` `"10"`             | Video duration in seconds                                                |
| `enable_prompt_expansion`| boolean | `true`   | `true` `false`           | Auto-expand the prompt with the built-in LLM optimizer                  |
| `enable_safety_checker`  | boolean | `true`   | `true` `false`           | Safety filtering toggle                                                  |
| `seed`                   | integer | —        | any integer              | Random seed for reproducible generation                                  |

## Curl — Image-to-Video

```bash
# 1. Submit to queue
REQUEST=$(curl -s -X POST \
  "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/portrait.jpg",
    "prompt": "The subject slowly turns their head and smiles, soft studio lighting, subtle background bokeh",
    "resolution": "720p",
    "duration": "5",
    "enable_prompt_expansion": true
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video/requests/$REQUEST_ID/status?logs=1" \
    -H "Authorization: Key $FAL_KEY")
  STATUS=$(echo "$STATUS_RESP" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Error: $(echo "$STATUS_RESP" | jq -r '.error')"
    exit 1
  fi
  sleep 5
done

# 3. Fetch result
curl -s \
  "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.video.url'
```

## Curl — Image-to-Video with Background Audio

```bash
# 1. Submit to queue with audio
REQUEST=$(curl -s -X POST \
  "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/singer.jpg",
    "prompt": "The singer performs expressively, lips moving, natural hand gestures",
    "audio_url": "https://example.com/vocals.mp3",
    "resolution": "720p",
    "duration": "5",
    "enable_prompt_expansion": false
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video/requests/$REQUEST_ID/status?logs=1" \
    -H "Authorization: Key $FAL_KEY")
  STATUS=$(echo "$STATUS_RESP" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Error: $(echo "$STATUS_RESP" | jq -r '.error')"
    exit 1
  fi
  sleep 5
done

# 3. Fetch result
curl -s \
  "https://queue.fal.run/fal-ai/wan-25-preview/image-to-video/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.video.url'
```

## JavaScript — async/await

```js
const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/wan-25-preview/image-to-video";
const BASE = "https://queue.fal.run";

async function animateImage(input) {
  // 1. Submit to queue
  const submitRes = await fetch(`${BASE}/${MODEL_ID}`, {
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
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(
      `${BASE}/${MODEL_ID}/requests/${requestId}/status?logs=1`,
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
    `${BASE}/${MODEL_ID}/requests/${requestId}/response`,
    { headers: { Authorization: `Key ${FAL_KEY}` } }
  );
  const result = await resultRes.json();
  return result.video.url; // HTTPS URL to the generated video (download promptly)
}

// Basic image-to-video example
const videoUrl = await animateImage({
  image_url: "https://example.com/portrait.jpg",
  prompt:
    "The subject slowly turns their head and smiles, soft studio lighting, subtle background bokeh",
  resolution: "720p",
  duration: "5",
  enable_prompt_expansion: true,
});
console.log("Video URL:", videoUrl);

// Image-to-video with background audio example
const syncedUrl = await animateImage({
  image_url: "https://example.com/singer.jpg",
  prompt:
    "The singer performs expressively, lips moving, natural hand gestures",
  audio_url: "https://example.com/vocals.mp3",
  resolution: "720p",
  duration: "5",
  enable_prompt_expansion: false,
});
console.log("Video URL:", syncedUrl);
```

## Notes

- Output URLs are temporary — download and back up as soon as generation completes.
- `audio_url` accepts wav or mp3 files; used for background music or voice accompaniment.
- `enable_prompt_expansion` auto-enriches short prompts; disable it when you need precise prompt control (e.g., when passing audio).
- `duration` is either `"5"` or `"10"` seconds — there are no intermediate values.
- Generation takes approximately 1 minute — use a 5-second poll interval.
- Fire concurrent requests rather than waiting sequentially — fal.ai runs them in parallel.
- Pricing: $0.20 (480p), $0.40 (720p); frames above 81 add a 25% surcharge.
