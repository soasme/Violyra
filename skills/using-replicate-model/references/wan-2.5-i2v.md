# Wan 2.5 Image-to-Video — Replicate Reference

| Field        | Value                                                                        |
|--------------|------------------------------------------------------------------------------|
| Model ID     | `wan-video/wan-2.5-i2v`                                                      |
| API Endpoint | `https://api.replicate.com/v1/models/wan-video/wan-2.5-i2v/predictions`     |
| Use          | Animate a still image into a video clip with optional audio synchronization  |

## Key Inputs

| Parameter                | Type    | Default   | Options / Range         | Description                                                              |
|--------------------------|---------|-----------|-------------------------|--------------------------------------------------------------------------|
| `image`                  | string  | —         | HTTPS URL, required     | Input image to animate                                                   |
| `prompt`                 | string  | —         | required                | Text description of the desired motion and video content                 |
| `negative_prompt`        | string  | `""`      | free text               | Elements to exclude from the generated video                             |
| `audio`                  | string  | —         | HTTPS URL (wav/mp3)     | Audio file (3–30 s, ≤15 MB) for voice/music synchronization             |
| `resolution`             | string  | `"720p"`  | `480p` `720p` `1080p`   | Output resolution                                                        |
| `duration`               | integer | `5`       | `5` `10`                | Video duration in seconds                                                |
| `enable_prompt_expansion`| boolean | `true`    | `true` `false`          | Auto-expand the prompt with the built-in optimizer                       |
| `seed`                   | integer | —         | any integer             | Random seed for reproducible generation                                  |

## Curl — Image-to-Video

```bash
# 1. Create prediction
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/wan-video/wan-2.5-i2v/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "image": "https://example.com/portrait.jpg",
      "prompt": "The subject slowly turns their head and smiles, soft studio lighting, subtle background bokeh",
      "resolution": "720p",
      "duration": 5,
      "enable_prompt_expansion": true
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

## Curl — Image-to-Video with Audio Sync

```bash
# 1. Create prediction with audio synchronization
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/wan-video/wan-2.5-i2v/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "image": "https://example.com/singer.jpg",
      "prompt": "The singer performs expressively, lips moving in sync, natural hand gestures",
      "audio": "https://example.com/vocals.mp3",
      "resolution": "720p",
      "duration": 5,
      "enable_prompt_expansion": false
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

async function animateImage(input) {
  // 1. Create prediction
  const createRes = await fetch(
    `${BASE}/models/wan-video/wan-2.5-i2v/predictions`,
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
      return result.output; // HTTPS URL to the generated video (expires in 1 hour)
    }
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(result.error ?? `Prediction ${result.status}`);
    }
  }
}

// Basic image-to-video example
const videoUrl = await animateImage({
  image: "https://example.com/portrait.jpg",
  prompt:
    "The subject slowly turns their head and smiles, soft studio lighting, subtle background bokeh",
  resolution: "720p",
  duration: 5,
  enable_prompt_expansion: true,
});
console.log("Video URL:", videoUrl);

// Image-to-video with audio sync example
const syncedUrl = await animateImage({
  image: "https://example.com/singer.jpg",
  prompt:
    "The singer performs expressively, lips moving in sync, natural hand gestures",
  audio: "https://example.com/vocals.mp3",
  resolution: "720p",
  duration: 5,
  enable_prompt_expansion: false,
});
console.log("Video URL:", syncedUrl);
```

## Notes

- Output URLs expire after **1 hour** — download and back up immediately.
- `audio` accepts wav or mp3 files between 3–30 seconds and ≤15 MB; used for lip-sync or music-driven animation.
- `enable_prompt_expansion` auto-enriches short prompts; disable it when you need precise prompt control (e.g., when syncing to audio).
- `duration` is either `5` or `10` seconds — there are no intermediate values.
- Fire concurrent predictions rather than waiting sequentially — Replicate runs them in parallel.
