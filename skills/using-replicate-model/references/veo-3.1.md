# Veo 3.1 — Replicate Reference

| Field        | Value                                                               |
|--------------|---------------------------------------------------------------------|
| Model ID     | `google/veo-3.1`                                                    |
| API Endpoint | `https://api.replicate.com/v1/models/google/veo-3.1/predictions`   |
| Use          | Text-to-video and image-to-video with native audio generation       |

> **Audio note:** Veo 3.1 generates audio natively alongside video (`generate_audio` defaults to `true`). Include sound cues in your prompt — ambient sounds, music style, dialogue, or silence directives — to guide the audio output. See the `writing-veo31-prompt` skill for prompt writing guidance.

## Key Inputs

| Parameter          | Type    | Default   | Options / Range                              | Description                                                                                     |
|--------------------|---------|-----------|----------------------------------------------|-------------------------------------------------------------------------------------------------|
| `prompt`           | string  | —         | required                                     | Text description of the video content, motion, and audio                                        |
| `duration`         | integer | `8`       | `4` `6` `8`                                  | Video duration in seconds                                                                       |
| `aspect_ratio`     | string  | `"16:9"`  | `16:9` `9:16`                                | Output aspect ratio; ignored when `image` is provided                                           |
| `resolution`       | string  | `"1080p"` | `720p` `1080p`                               | Output resolution                                                                               |
| `image`            | string  | —         | HTTPS URL                                    | Start frame for image-to-video; ideal size is 1280×720 (16:9) or 720×1280 (9:16)               |
| `last_frame`       | string  | —         | HTTPS URL                                    | End frame for interpolation; requires `image` to be set                                         |
| `reference_images` | array   | `[]`      | 1–3 HTTPS URLs                               | Subject-consistent generation (R2V); only works with 16:9 and 8 s; ignored if `last_frame` set |
| `negative_prompt`  | string  | —         | free text                                    | Elements to exclude from the generated video                                                    |
| `generate_audio`   | boolean | `true`    | `true` `false`                               | Generate native audio alongside the video                                                       |
| `seed`             | integer | —         | any integer                                  | Random seed for reproducible generation                                                         |

## Curl — Text-to-Video

```bash
# 1. Create prediction
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/google/veo-3.1/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Golden hour on a quiet beach, waves gently lapping the shore, seagulls calling in the distance, light wind rustling beach grass",
      "duration": 8,
      "aspect_ratio": "16:9",
      "resolution": "1080p",
      "generate_audio": true
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

## Curl — Image-to-Video

```bash
# 1. Create prediction with an input image
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/google/veo-3.1/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "The lighthouse beacon slowly rotates, fog rolling in from the sea, the distant foghorn echoing",
      "image": "https://example.com/lighthouse.jpg",
      "duration": 8,
      "resolution": "1080p",
      "generate_audio": true
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

async function generateVideo(input) {
  // 1. Create prediction
  const createRes = await fetch(
    `${BASE}/models/google/veo-3.1/predictions`,
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
      return result.output; // HTTPS URL to the generated video+audio (expires in 1 hour)
    }
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(result.error ?? `Prediction ${result.status}`);
    }
  }
}

// Text-to-video example
const videoUrl = await generateVideo({
  prompt:
    "Golden hour on a quiet beach, waves gently lapping the shore, seagulls calling in the distance, light wind rustling beach grass",
  duration: 8,
  aspect_ratio: "16:9",
  resolution: "1080p",
  generate_audio: true,
});
console.log("Video URL:", videoUrl);

// Image-to-video example
const i2vUrl = await generateVideo({
  prompt:
    "The lighthouse beacon slowly rotates, fog rolling in from the sea, the distant foghorn echoing",
  image: "https://example.com/lighthouse.jpg",
  duration: 8,
  resolution: "1080p",
  generate_audio: true,
});
console.log("Video URL:", i2vUrl);
```

## Notes

- Output URLs expire after **1 hour** — download and back up immediately.
- `generate_audio` defaults to `true`; Veo 3.1 generates audio natively. Include sound cues in the prompt for best results.
- `aspect_ratio` is ignored when `image` is provided; the output inherits the input image's aspect ratio.
- `reference_images` (R2V mode) only works with `aspect_ratio: "16:9"` and `duration: 8`; providing `last_frame` disables R2V.
- Veo 3.1 generation takes 2–5 minutes — use a 10-second poll interval.
- Fire concurrent predictions rather than waiting sequentially — Replicate runs them in parallel.
