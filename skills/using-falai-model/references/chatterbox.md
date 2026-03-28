# Chatterbox TTS — fal.ai Reference

| Field          | Value                                                                    |
|----------------|--------------------------------------------------------------------------|
| Model ID       | `fal-ai/chatterbox/text-to-speech`                                       |
| Queue endpoint | `https://queue.fal.run/fal-ai/chatterbox/text-to-speech`                |
| Use            | TTS voiceover with voice cloning and expressive paralinguistic controls   |

> **Variants:** The base endpoint (`/text-to-speech`) supports voice cloning via a reference audio URL. A turbo variant (`/text-to-speech/turbo`) offers faster generation with preset voices. A multilingual variant (`/text-to-speech/multilingual`) supports 23 languages. All share the same queue pattern.

## Key Inputs — Base (`fal-ai/chatterbox/text-to-speech`)

| Parameter      | Type    | Default                                                                  | Options / Range | Description                                                                                        |
|----------------|---------|--------------------------------------------------------------------------|-----------------|----------------------------------------------------------------------------------------------------|
| `text`         | string  | —                                                                        | required        | Text to synthesize. Supports emotive tags: `<laugh>` `<chuckle>` `<sigh>` `<cough>` `<sniffle>` `<groan>` `<yawn>` `<gasp>` |
| `audio_url`    | string  | `https://storage.googleapis.com/chatterbox-demo-samples/prompts/male_rickmorty.mp3` | HTTPS URL (wav/mp3) | Reference audio for voice style matching (voice cloning)                        |
| `exaggeration` | float   | `0.25`                                                                   | 0.0–1.0         | Expressiveness intensity; higher = more dramatic delivery                                          |
| `temperature`  | float   | `0.7`                                                                    | 0.05–2.0        | Sampling creativity; higher = more varied output                                                   |
| `cfg`          | float   | `0.5`                                                                    | 0.1–1.0         | Classifier-free guidance weight; higher = closer adherence to reference voice                      |
| `seed`         | integer | —                                                                        | any integer     | Random seed for reproducible output; 0 = random                                                    |

## Key Inputs — Turbo (`fal-ai/chatterbox/text-to-speech/turbo`)

| Parameter     | Type    | Default  | Options / Range     | Description                                                                    |
|---------------|---------|----------|---------------------|--------------------------------------------------------------------------------|
| `text`        | string  | —        | required            | Text to synthesize. Supports paralinguistic tags: `[clear throat]` `[sigh]` `[shush]` `[cough]` `[groan]` `[sniff]` `[gasp]` `[chuckle]` `[laugh]` |
| `voice`       | string  | `lucy`   | preset name or URL  | Preset voice name or custom audio URL for voice cloning                        |
| `audio_url`   | string  | —        | HTTPS URL (5–10 s)  | Custom audio for voice cloning (overrides `voice` when provided)               |
| `temperature` | float   | `0.8`    | 0.05–2.0            | Sampling creativity                                                             |
| `seed`        | integer | —        | any integer         | Random seed for reproducible output                                            |

## Curl — Base (voice cloning)

```bash
# 1. Submit to queue
REQUEST=$(curl -s -X POST "https://queue.fal.run/fal-ai/chatterbox/text-to-speech" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome back to the channel! Today we are diving deep into the world of AI-generated video. <chuckle> Trust me, you do not want to miss this.",
    "audio_url": "https://example.com/reference-voice.mp3",
    "exaggeration": 0.35,
    "cfg": 0.5,
    "temperature": 0.7
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/chatterbox/text-to-speech/requests/$REQUEST_ID/status?logs=1" \
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
curl -s "https://queue.fal.run/fal-ai/chatterbox/text-to-speech/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.audio.url'
```

## JavaScript — async/await

```js
const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/chatterbox/text-to-speech";
const BASE = "https://queue.fal.run";

async function synthesizeSpeech(input) {
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
  return result.audio.url; // HTTPS URL to the generated WAV file (download promptly)
}

// Voice cloning example
const audioUrl = await synthesizeSpeech({
  text: "Welcome back to the channel! Today we are diving deep into the world of AI-generated video. <chuckle> Trust me, you do not want to miss this.",
  audio_url: "https://example.com/reference-voice.mp3",
  exaggeration: 0.35,
  cfg: 0.5,
  temperature: 0.7,
});
console.log("Audio URL:", audioUrl);
```

## Notes

- Output URLs are temporary — download and back up as soon as generation completes.
- The output audio is a WAV file; convert to MP3 if needed before embedding in video.
- For voice cloning, the `audio_url` reference clip should be 5–30 seconds of clean, noise-free speech.
- `exaggeration` controls emotional intensity — keep below 0.5 for natural-sounding narration; raise toward 1.0 for dramatic or character voices.
- `cfg` controls how closely the output adheres to the reference voice; 0.5 is a good starting point.
- Use emotive tags sparingly — they work best when placed at natural pause points in the script.
- Generation typically completes in 10–30 seconds — use a 5-second poll interval.
- For multilingual voiceover, use `fal-ai/chatterbox/text-to-speech/multilingual` (supports 23 languages, max 300 chars per request, parameter `cfg_scale` instead of `cfg`).
