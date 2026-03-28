# Topaz Video Upscale — Replicate Reference

| Field        | Value                                                                             |
|--------------|-----------------------------------------------------------------------------------|
| Model ID     | `topazlabs/video-upscale`                                                         |
| API Endpoint | `https://api.replicate.com/v1/models/topazlabs/video-upscale/predictions`        |
| Use          | AI-powered video upscaling and frame-rate enhancement for final export polish     |

## Key Inputs

| Parameter           | Type    | Default    | Options / Range          | Description                                      |
|---------------------|---------|------------|--------------------------|--------------------------------------------------|
| `video`             | string  | —          | required, HTTPS URL      | Video file to upscale                            |
| `target_resolution` | string  | `"1080p"`  | `720p` `1080p` `4k`      | Target output resolution                         |
| `target_fps`        | integer | `60`       | `15` – `120`             | Target output frame rate in frames per second    |

## Curl — Video Upscale

```bash
# 1. Create prediction
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/topazlabs/video-upscale/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "video": "https://example.com/raw-edit-720p.mp4",
      "target_resolution": "1080p",
      "target_fps": 60
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
  sleep 15
done
```

## Curl — 4K Upscale

```bash
# 1. Create prediction targeting 4K
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/topazlabs/video-upscale/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "video": "https://example.com/final-cut-1080p.mp4",
      "target_resolution": "4k",
      "target_fps": 60
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
  sleep 15
done
```

## JavaScript — async/await

```js
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const BASE = "https://api.replicate.com/v1";

async function upscaleVideo(input) {
  // 1. Create prediction
  const createRes = await fetch(
    `${BASE}/models/topazlabs/video-upscale/predictions`,
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
    await new Promise((r) => setTimeout(r, 15000));
    const pollRes = await fetch(`${BASE}/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const result = await pollRes.json();
    console.log("Status:", result.status);

    if (result.status === "succeeded") {
      return result.output; // HTTPS URL to the upscaled video (expires in 1 hour)
    }
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(result.error ?? `Prediction ${result.status}`);
    }
  }
}

// 1080p upscale example
const upscaledUrl = await upscaleVideo({
  video: "https://example.com/raw-edit-720p.mp4",
  target_resolution: "1080p",
  target_fps: 60,
});
console.log("Upscaled video URL:", upscaledUrl);

// 4K upscale example
const upscaled4kUrl = await upscaleVideo({
  video: "https://example.com/final-cut-1080p.mp4",
  target_resolution: "4k",
  target_fps: 60,
});
console.log("4K video URL:", upscaled4kUrl);
```

## Notes

- Output URLs expire after **1 hour** — download and back up immediately.
- `video` must be a publicly accessible HTTPS URL to an MP4 or other supported video format.
- `target_resolution` upscales relative to the source: sending a 720p video to `"1080p"` applies a 1.5x spatial upscale; `"4k"` applies a larger upscale.
- `target_fps` applies temporal interpolation (frame generation) on top of spatial upscaling; set to match the source FPS to skip interpolation or increase it for smoother motion.
- Processing time scales with video length and upscale factor — use a 15-second poll interval.
- Run upscaling as the final step in the pipeline after all edits are locked.
