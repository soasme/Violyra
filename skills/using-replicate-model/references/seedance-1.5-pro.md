# Seedance 1.5 Pro — Replicate Reference

| Field        | Value                                                                  |
|--------------|------------------------------------------------------------------------|
| Model ID     | `bytedance/seedance-1.5-pro`                                           |
| API Endpoint | `https://api.replicate.com/v1/models/bytedance/seedance-1.5-pro/predictions` |
| Use          | Text-to-video and image-to-video generation with optional audio        |

> Use the `writing-seedance15-prompt` skill to craft effective prompts for this model.

## Key Inputs

| Parameter        | Type    | Default  | Options / Range                                      | Description                                                         |
|------------------|---------|----------|------------------------------------------------------|---------------------------------------------------------------------|
| `prompt`         | string  | —        | required                                             | Text description of the video content and motion                    |
| `duration`       | integer | `5`      | `2`–`12`                                             | Video duration in seconds                                           |
| `aspect_ratio`   | string  | `"16:9"` | `16:9` `9:16` `4:3` `3:4` `1:1` `21:9` `9:21`       | Output aspect ratio; ignored when an input image is provided        |
| `resolution`     | string  | `"1080p"`| `480p` `720p` `1080p`                                | Output resolution                                                   |
| `fps`            | integer | `24`     | `24` only                                            | Frame rate (only 24 fps is supported)                               |
| `image`          | string  | —        | HTTPS URL                                            | Start frame for image-to-video; triggers i2v mode                   |
| `last_frame_image`| string | —        | HTTPS URL                                            | End frame; requires `image` to be set                               |
| `generate_audio` | boolean | `false`  | `true` `false`                                       | Generate audio synchronized with the video                          |
| `camera_fixed`   | boolean | `false`  | `true` `false`                                       | Lock the camera position throughout the video                       |
| `seed`           | integer | —        | any integer                                          | Random seed for reproducible generation                             |

## Curl — Text-to-Video

```bash
# 1. Create prediction
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/bytedance/seedance-1.5-pro/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A serene mountain lake at dawn, mist rising from the water, a lone heron standing still at the shore",
      "duration": 5,
      "aspect_ratio": "16:9",
      "resolution": "1080p",
      "generate_audio": false
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

## Curl — Image-to-Video

```bash
# 1. Create prediction with an input image
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/bytedance/seedance-1.5-pro/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "The heron slowly lifts its wings and takes flight over the misty lake",
      "image": "https://example.com/heron-at-lake.jpg",
      "duration": 5,
      "resolution": "1080p",
      "generate_audio": false
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

## JavaScript — Text-to-Video (async/await)

```js
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const BASE = "https://api.replicate.com/v1";

async function generateVideo(input) {
  // 1. Create prediction
  const createRes = await fetch(
    `${BASE}/models/bytedance/seedance-1.5-pro/predictions`,
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

// Text-to-video example
const videoUrl = await generateVideo({
  prompt:
    "A serene mountain lake at dawn, mist rising from the water, a lone heron standing still at the shore",
  duration: 5,
  aspect_ratio: "16:9",
  resolution: "1080p",
  generate_audio: false,
});
console.log("Video URL:", videoUrl);

// Image-to-video example
const i2vUrl = await generateVideo({
  prompt: "The heron slowly lifts its wings and takes flight over the misty lake",
  image: "https://example.com/heron-at-lake.jpg",
  duration: 5,
  resolution: "1080p",
  generate_audio: false,
});
console.log("Video URL:", i2vUrl);
```

## Notes

- Output URLs expire after **1 hour** — download and back up immediately.
- `aspect_ratio` is ignored when an `image` is provided; the output inherits the input image's aspect ratio.
- `generate_audio` is a joint audio-video model feature; it generates audio synchronized with the visuals based on the prompt.
- `last_frame_image` only works when `image` (start frame) is also set.
- Fire concurrent predictions rather than waiting sequentially — Replicate runs them in parallel.
