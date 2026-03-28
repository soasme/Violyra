# FLUX 1.1 Pro — Replicate Reference

| Field        | Value                                                                               |
|--------------|-------------------------------------------------------------------------------------|
| Model ID     | `black-forest-labs/flux-1.1-pro`                                                    |
| API Endpoint | `https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions`   |
| Use          | Text-to-image generation for thumbnails, cover art, and visual assets               |

## Key Inputs

| Parameter           | Type    | Default  | Options / Range                                          | Description                                                              |
|---------------------|---------|----------|----------------------------------------------------------|--------------------------------------------------------------------------|
| `prompt`            | string  | —        | required                                                 | Text description of the image to generate                                |
| `aspect_ratio`      | string  | `"1:1"`  | `1:1` `16:9` `9:16` `4:3` `3:4` `3:2` `2:3` `4:5` `5:4` `custom` | Aspect ratio of the output image                        |
| `width`             | integer | —        | `256` – `1440`, multiple of 32                           | Width in pixels; only used when `aspect_ratio=custom`                    |
| `height`            | integer | —        | `256` – `1440`, multiple of 32                           | Height in pixels; only used when `aspect_ratio=custom`                   |
| `output_format`     | string  | `"webp"` | `webp` `jpg` `png`                                       | Format of the output image                                               |
| `output_quality`    | integer | `80`     | `0` – `100`                                              | Save quality (0–100); not applicable to PNG                              |
| `safety_tolerance`  | integer | `2`      | `1` – `6`                                                | Safety filter level; 1 = strictest, 6 = most permissive                 |
| `prompt_upsampling` | boolean | `false`  | `true` `false`                                           | Auto-enhance the prompt for more creative generation                     |
| `image_prompt`      | string  | —        | HTTPS URL (jpeg/png/gif/webp)                            | Reference image for Flux Redux composition guidance                      |
| `seed`              | integer | —        | any integer                                              | Random seed for reproducible generation                                  |

## Curl — Text-to-Image

```bash
# 1. Create prediction
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A dramatic YouTube thumbnail: a glowing deep-sea creature illuminates the dark ocean, photorealistic, cinematic lighting, high contrast",
      "aspect_ratio": "16:9",
      "output_format": "jpg",
      "output_quality": 90,
      "safety_tolerance": 2
    }
  }')

PREDICTION_ID=$(echo "$PREDICTION" | jq -r '.id')
echo "Prediction ID: $PREDICTION_ID"

# 2. Poll until complete
while true; do
  RESULT=$(curl -s "https://api.replicate.com/v1/predictions/$PREDICTION_ID" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN")
  STATUS=$(echo "$RESULT" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "succeeded" ]; then
    echo "Output: $(echo "$RESULT" | jq -r '.output')"
    break
  elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "canceled" ]; then
    echo "Error: $(echo "$RESULT" | jq -r '.error')"
    break
  fi
  sleep 5
done
```

## Curl — Image-Guided Generation (Flux Redux)

```bash
# 1. Create prediction with a reference image
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Same composition but at sunset, warm golden tones, cinematic",
      "image_prompt": "https://example.com/reference-thumbnail.jpg",
      "aspect_ratio": "16:9",
      "output_format": "jpg",
      "output_quality": 90
    }
  }')

PREDICTION_ID=$(echo "$PREDICTION" | jq -r '.id')
echo "Prediction ID: $PREDICTION_ID"

# 2. Poll until complete
while true; do
  RESULT=$(curl -s "https://api.replicate.com/v1/predictions/$PREDICTION_ID" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN")
  STATUS=$(echo "$RESULT" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "succeeded" ]; then
    echo "Output: $(echo "$RESULT" | jq -r '.output')"
    break
  elif [ "$STATUS" = "failed" ] || [ "$STATUS" = "canceled" ]; then
    echo "Error: $(echo "$RESULT" | jq -r '.error')"
    break
  fi
  sleep 5
done
```

## JavaScript — async/await

```js
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const BASE = "https://api.replicate.com/v1";

async function generateImage(input) {
  // 1. Create prediction
  const createRes = await fetch(
    `${BASE}/models/black-forest-labs/flux-1.1-pro/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    }
  );
  const prediction = await createRes.json();
  if (!createRes.ok) throw new Error(prediction.detail ?? "Create failed");

  const predictionId = prediction.id;
  console.log("Prediction ID:", predictionId);

  // 2. Poll until complete
  while (true) {
    await new Promise((r) => setTimeout(r, 5000));
    const pollRes = await fetch(`${BASE}/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const result = await pollRes.json();
    console.log("Status:", result.status);

    if (result.status === "succeeded") {
      return result.output; // HTTPS URL to the generated image (expires in 1 hour)
    }
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(result.error ?? `Prediction ${result.status}`);
    }
  }
}

// Text-to-image thumbnail example
const imageUrl = await generateImage({
  prompt:
    "A dramatic YouTube thumbnail: a glowing deep-sea creature illuminates the dark ocean, photorealistic, cinematic lighting, high contrast",
  aspect_ratio: "16:9",
  output_format: "jpg",
  output_quality: 90,
  safety_tolerance: 2,
});
console.log("Image URL:", imageUrl);

// Image-guided generation (Flux Redux) example
const remixUrl = await generateImage({
  prompt: "Same composition but at sunset, warm golden tones, cinematic",
  image_prompt: "https://example.com/reference-thumbnail.jpg",
  aspect_ratio: "16:9",
  output_format: "jpg",
  output_quality: 90,
});
console.log("Image URL:", remixUrl);
```

## Notes

- Output URLs expire after **1 hour** — download and back up immediately.
- For YouTube thumbnails use `aspect_ratio: "16:9"` and `output_format: "jpg"` with `output_quality: 90`.
- `width` and `height` are only respected when `aspect_ratio` is set to `"custom"`; otherwise they are ignored.
- `image_prompt` enables Flux Redux mode — the model uses the reference image's composition to guide generation while following the text prompt.
- `prompt_upsampling` auto-rewrites the prompt for variety; disable it when you need precise control.
- FLUX 1.1 Pro typically completes in 5–15 seconds — use a 5-second poll interval.
- Fix `seed` to reproduce the same image across runs.
