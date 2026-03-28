# FLUX.1 [dev] — fal.ai Reference

| Field          | Value                                                                 |
|----------------|-----------------------------------------------------------------------|
| Model ID       | `fal-ai/flux/dev`                                                     |
| Queue endpoint | `https://queue.fal.run/fal-ai/flux/dev`                              |
| Use            | Text-to-image for thumbnails, stills, and promotional artwork         |

## Key Inputs

| Parameter               | Type            | Default          | Options / Range                                                                                    | Description                                                          |
|-------------------------|-----------------|------------------|----------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| `prompt`                | string          | —                | required                                                                                           | Text description of the image to generate                            |
| `image_size`            | enum or object  | `landscape_4_3`  | `square_hd` `square` `portrait_4_3` `portrait_16_9` `landscape_4_3` `landscape_16_9` or `{width, height}` | Output dimensions                                              |
| `num_inference_steps`   | integer         | `28`             | 1–50                                                                                               | Denoising steps; higher = more detail, slower generation             |
| `guidance_scale`        | float           | `3.5`            | 1–20                                                                                               | CFG strength; higher = stronger prompt adherence                     |
| `num_images`            | integer         | `1`              | 1–4                                                                                                | Number of images to generate in one request                          |
| `output_format`         | enum            | `jpeg`           | `jpeg` `png`                                                                                       | Output image format                                                  |
| `acceleration`          | enum            | `none`           | `none` `regular` `high`                                                                            | Speed tier; `high` reduces quality slightly                          |
| `sync_mode`             | boolean         | `false`          | `true` `false`                                                                                     | Return base64 data URI inline instead of a hosted URL                |
| `enable_safety_checker` | boolean         | `true`           | `true` `false`                                                                                     | NSFW content filtering                                               |
| `seed`                  | integer         | —                | any integer                                                                                        | Random seed for reproducible generation                              |

## Curl

```bash
# 1. Submit to queue
REQUEST=$(curl -s -X POST "https://queue.fal.run/fal-ai/flux/dev" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cinematic thumbnail of a lone astronaut on a red desert planet, dramatic sunset, wide angle lens, photorealistic",
    "image_size": "landscape_16_9",
    "num_inference_steps": 28,
    "guidance_scale": 3.5,
    "num_images": 1,
    "output_format": "jpeg"
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/flux/dev/requests/$REQUEST_ID/status?logs=1" \
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
curl -s "https://queue.fal.run/fal-ai/flux/dev/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.images[0].url'
```

## JavaScript — async/await

```js
const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/flux/dev";
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

const imageUrl = await generateImage({
  prompt:
    "A cinematic thumbnail of a lone astronaut on a red desert planet, dramatic sunset, wide angle lens, photorealistic",
  image_size: "landscape_16_9",
  num_inference_steps: 28,
  guidance_scale: 3.5,
  num_images: 1,
  output_format: "jpeg",
});
console.log("Image URL:", imageUrl);
```

## Notes

- Output URLs are temporary — download and back up as soon as generation completes.
- `image_size` accepts both named presets (`landscape_16_9`, `square_hd`, etc.) and an explicit `{ width, height }` object.
- `num_inference_steps` default of 28 is a good balance; raising to 40–50 adds detail with diminishing returns.
- `guidance_scale` of 3.5 is the recommended starting point for FLUX [dev]; values above 7 tend to oversaturate.
- Use `acceleration: "high"` to cut latency when speed matters more than maximum quality.
- Generation typically completes in 10–30 seconds — use a 5-second poll interval.
- Fire concurrent requests rather than waiting sequentially — fal.ai runs them in parallel.
