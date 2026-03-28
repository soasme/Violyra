# Nano Banana Pro — fal.ai Reference

| Field          | Value                                                                   |
|----------------|-------------------------------------------------------------------------|
| Model ID       | `fal-ai/nano-banana-pro`                                                |
| Queue endpoint | `https://queue.fal.run/fal-ai/nano-banana-pro`                         |
| Use            | High-quality text-to-image generation with resolution and aspect ratio control |

> **Image-to-image:** The same endpoint also accepts `image_urls` (array of HTTPS URLs) alongside `prompt` for image editing and style transfer.

## Key Inputs — Text-to-Image

| Parameter           | Type    | Default | Options / Range                                                                            | Description                                                        |
|---------------------|---------|---------|--------------------------------------------------------------------------------------------|--------------------------------------------------------------------|
| `prompt`            | string  | —       | required                                                                                   | Text description of the image to generate                          |
| `aspect_ratio`      | enum    | `1:1`   | `auto` `21:9` `16:9` `3:2` `4:3` `5:4` `1:1` `4:5` `3:4` `2:3` `9:16`                   | Output aspect ratio                                                |
| `resolution`        | enum    | `1K`    | `1K` `2K` `4K`                                                                             | Output resolution tier                                             |
| `num_images`        | integer | `1`     | 1–4                                                                                        | Number of images to generate in one request                        |
| `output_format`     | enum    | `png`   | `jpeg` `png` `webp`                                                                        | Output image format                                                |
| `safety_tolerance`  | enum    | `4`     | `1`–`6`                                                                                    | Content moderation strictness (1 = strictest, 6 = least strict)   |
| `enable_web_search` | boolean | `false` | `true` `false`                                                                             | Enrich generation with live web search context                     |
| `sync_mode`         | boolean | `false` | `true` `false`                                                                             | Return base64 data URI inline instead of a hosted URL              |
| `seed`              | integer | —       | any integer                                                                                | Random seed for reproducible generation                            |

## Key Inputs — Image-to-Image (additional parameter)

| Parameter    | Type          | Default | Options / Range   | Description                                  |
|--------------|---------------|---------|-------------------|----------------------------------------------|
| `image_urls` | array[string] | —       | required for I2I  | One or more HTTPS URLs of images to edit     |

## Curl — Text-to-Image

```bash
# 1. Submit to queue
REQUEST=$(curl -s -X POST "https://queue.fal.run/fal-ai/nano-banana-pro" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A vibrant YouTube thumbnail showing a glowing AI brain floating above a city skyline at night, neon colors, dramatic lighting, ultra-detailed",
    "aspect_ratio": "16:9",
    "resolution": "2K",
    "num_images": 1,
    "output_format": "jpeg"
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/nano-banana-pro/requests/$REQUEST_ID/status?logs=1" \
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
curl -s "https://queue.fal.run/fal-ai/nano-banana-pro/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.images[0].url'
```

## JavaScript — async/await

```js
const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/nano-banana-pro";
const BASE = "https://queue.fal.run";

async function generateImage(input) {
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
  return result.images[0].url; // HTTPS URL to the generated image (download promptly)
}

// Text-to-image example
const imageUrl = await generateImage({
  prompt:
    "A vibrant YouTube thumbnail showing a glowing AI brain floating above a city skyline at night, neon colors, dramatic lighting, ultra-detailed",
  aspect_ratio: "16:9",
  resolution: "2K",
  num_images: 1,
  output_format: "jpeg",
});
console.log("Image URL:", imageUrl);

// Image-to-image / edit example
const editedUrl = await generateImage({
  prompt: "Change the sky to a dramatic stormy sunset with purple and orange hues",
  image_urls: ["https://example.com/original.jpg"],
  aspect_ratio: "16:9",
  resolution: "2K",
  output_format: "jpeg",
});
console.log("Edited Image URL:", editedUrl);
```

## Notes

- Output URLs are temporary — download and back up as soon as generation completes.
- `resolution` tiers (`1K`, `2K`, `4K`) scale with `aspect_ratio`; use `2K` for YouTube thumbnails.
- `aspect_ratio: "auto"` lets the model choose the most natural ratio for the prompt.
- `enable_web_search` enriches prompts with real-time context; useful for prompts referencing current events or public figures.
- For image editing, pass one or more reference images via `image_urls` alongside a `prompt` describing the desired change.
- Generation typically completes in 10–30 seconds — use a 5-second poll interval.
- Fire concurrent requests rather than waiting sequentially — fal.ai runs them in parallel.
