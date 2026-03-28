# Nano Banana Pro — Replicate Reference

| Field        | Value                                                                            |
|--------------|----------------------------------------------------------------------------------|
| Model ID     | `google/nano-banana-pro`                                                         |
| API Endpoint | `https://api.replicate.com/v1/models/google/nano-banana-pro/predictions`        |
| Use          | High-resolution text-to-image generation and image editing with reference inputs |

> **Note:** The parameter name for input images is `image_input` (an array of HTTPS URLs), not `image`. The model accepts up to 14 reference images.

## Key Inputs

| Parameter            | Type    | Default               | Options / Range                                                                    | Description                                                                    |
|----------------------|---------|-----------------------|------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| `prompt`             | string  | —                     | required                                                                           | Text description of the image to generate                                      |
| `image_input`        | array   | `[]`                  | array of HTTPS URLs (up to 14)                                                     | Input images to transform or use as reference                                  |
| `aspect_ratio`       | string  | `"match_input_image"` | `match_input_image` `1:1` `2:3` `3:2` `3:4` `4:3` `4:5` `5:4` `9:16` `16:9` `21:9` | Aspect ratio of the output image                                             |
| `resolution`         | string  | `"2K"`                | `1K` `2K` `4K`                                                                    | Output resolution                                                              |
| `output_format`      | string  | `"jpg"`               | `jpg` `png`                                                                        | Format of the output image                                                     |
| `safety_filter_level` | string | `"block_only_high"`   | `block_low_and_above` `block_medium_and_above` `block_only_high`                  | Safety filter strictness; `block_low_and_above` is strictest                  |
| `allow_fallback_model` | boolean | `false`             | `true` `false`                                                                     | Fall back to bytedance/seedream-5 if Nano Banana Pro is at capacity            |

## Curl — Text-to-Image

```bash
# 1. Create prediction
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A dramatic YouTube thumbnail: bold typography overlay, neon-lit cityscape at night, cinematic depth of field, ultra-detailed",
      "aspect_ratio": "16:9",
      "resolution": "2K",
      "output_format": "jpg",
      "safety_filter_level": "block_only_high"
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
  sleep 10
done
```

## Curl — Image Editing with Reference

```bash
# 1. Create prediction with reference images
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/google/nano-banana-pro/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Transform this scene to look like a watercolor painting, soft brush strokes, artistic",
      "image_input": ["https://example.com/source-frame.jpg"],
      "aspect_ratio": "16:9",
      "resolution": "2K",
      "output_format": "jpg"
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
  sleep 10
done
```

## JavaScript — async/await

```js
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const BASE = "https://api.replicate.com/v1";

async function generateImage(input) {
  // 1. Create prediction
  const createRes = await fetch(
    `${BASE}/models/google/nano-banana-pro/predictions`,
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
    await new Promise((r) => setTimeout(r, 10000));
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

// Text-to-image example
const imageUrl = await generateImage({
  prompt:
    "A dramatic YouTube thumbnail: bold typography overlay, neon-lit cityscape at night, cinematic depth of field, ultra-detailed",
  aspect_ratio: "16:9",
  resolution: "2K",
  output_format: "jpg",
  safety_filter_level: "block_only_high",
});
console.log("Image URL:", imageUrl);

// Image editing example
const editedUrl = await generateImage({
  prompt: "Transform this scene to look like a watercolor painting, soft brush strokes, artistic",
  image_input: ["https://example.com/source-frame.jpg"],
  aspect_ratio: "16:9",
  resolution: "2K",
  output_format: "jpg",
});
console.log("Image URL:", editedUrl);
```

## Notes

- Output URLs expire after **1 hour** — download and back up immediately.
- `image_input` is an **array** of HTTPS URLs (not a single string); always wrap even a single image in `[]`.
- When `image_input` is empty (text-to-image mode), set `aspect_ratio` to a fixed ratio such as `"16:9"` rather than `"match_input_image"`.
- `resolution` controls the output size: `"1K"` (~1024px), `"2K"` (~2048px), `"4K"` (~4096px) on the long edge.
- `allow_fallback_model` falls back to `bytedance/seedream-5` if capacity is exceeded — useful for time-sensitive pipelines but may change model behavior.
- Nano Banana Pro generation typically completes in 15–60 seconds — use a 10-second poll interval.
- For thumbnail generation, `aspect_ratio: "16:9"` with `resolution: "2K"` and `output_format: "jpg"` is the recommended combination.
