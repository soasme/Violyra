# Chatterbox — Replicate Reference

| Field        | Value                                                                          |
|--------------|--------------------------------------------------------------------------------|
| Model ID     | `resemble-ai/chatterbox`                                                       |
| API Endpoint | `https://api.replicate.com/v1/models/resemble-ai/chatterbox/predictions`      |
| Use          | Text-to-speech voiceover with optional voice cloning from a reference audio    |

## Key Inputs

| Parameter      | Type    | Default | Options / Range    | Description                                                         |
|----------------|---------|---------|--------------------|---------------------------------------------------------------------|
| `prompt`       | string  | —       | required           | Text to synthesize into speech                                      |
| `audio_prompt` | string  | —       | HTTPS URL          | Reference audio file for voice cloning (optional)                   |
| `exaggeration` | number  | `0.5`   | `0.25` – `2.0`    | Emotion exaggeration; 0.5 = neutral, extreme values can be unstable |
| `cfg_weight`   | number  | `0.5`   | `0.2` – `1.0`     | CFG/Pace weight; higher = slower, more deliberate delivery          |
| `temperature`  | number  | `0.8`   | `0.05` – `5.0`    | Sampling temperature; lower = more stable, higher = more varied     |
| `seed`         | integer | `0`     | any integer        | Seed for reproducible generation; 0 = random                       |

## Curl — Text-to-Speech

```bash
# 1. Create prediction
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/resemble-ai/chatterbox/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "Welcome to our channel! Today we explore the hidden wonders of deep ocean bioluminescence.",
      "exaggeration": 0.5,
      "cfg_weight": 0.5,
      "temperature": 0.8
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

## Curl — Voice Cloning

```bash
# 1. Create prediction with a reference voice
PREDICTION=$(curl -s -X POST \
  "https://api.replicate.com/v1/models/resemble-ai/chatterbox/predictions" \
  -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "And that brings us to the end of today'\''s tutorial. Thanks for watching!",
      "audio_prompt": "https://example.com/reference-voice.wav",
      "exaggeration": 0.5,
      "cfg_weight": 0.5
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

async function synthesizeSpeech(input) {
  // 1. Create prediction
  const createRes = await fetch(
    `${BASE}/models/resemble-ai/chatterbox/predictions`,
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
      return result.output; // HTTPS URL to the generated audio file (expires in 1 hour)
    }
    if (result.status === "failed" || result.status === "canceled") {
      throw new Error(result.error ?? `Prediction ${result.status}`);
    }
  }
}

// Basic TTS example
const audioUrl = await synthesizeSpeech({
  prompt:
    "Welcome to our channel! Today we explore the hidden wonders of deep ocean bioluminescence.",
  exaggeration: 0.5,
  cfg_weight: 0.5,
  temperature: 0.8,
});
console.log("Audio URL:", audioUrl);

// Voice cloning example
const clonedAudioUrl = await synthesizeSpeech({
  prompt: "And that brings us to the end of today's tutorial. Thanks for watching!",
  audio_prompt: "https://example.com/reference-voice.wav",
  exaggeration: 0.5,
  cfg_weight: 0.5,
});
console.log("Audio URL:", clonedAudioUrl);
```

## Notes

- Output URLs expire after **1 hour** — download and back up immediately.
- `audio_prompt` must be a publicly accessible HTTPS URL to an audio file (wav, mp3, etc.).
- `exaggeration` controls emotional intensity: 0.5 is neutral, values above 1.0 can produce unstable output.
- `cfg_weight` controls pacing: lower values produce faster, more natural delivery; higher values slow down and add emphasis.
- For consistent voiceover across a video, fix `seed` and reuse the same `audio_prompt`.
- Chatterbox generation typically completes in 10–30 seconds — use a 5-second poll interval.
