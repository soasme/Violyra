# Topaz Video Upscale — fal.ai Reference

| Field          | Value                                                                   |
|----------------|-------------------------------------------------------------------------|
| Model ID       | `fal-ai/topaz/upscale/video`                                            |
| Queue endpoint | `https://queue.fal.run/fal-ai/topaz/upscale/video`                     |
| Use            | Professional video upscaling and enhancement for final delivery         |

## Key Inputs

| Parameter        | Type    | Default    | Options / Range                                                                                      | Description                                                                   |
|------------------|---------|------------|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| `video_url`      | string  | —          | HTTPS URL, required                                                                                  | Input video to upscale                                                        |
| `model`          | enum    | `Proteus`  | `Proteus` `Artemis HQ` `Artemis MQ` `Artemis LQ` `Nyx` (variants) `Gaia HQ` `Gaia CG`              | Enhancement model; Proteus is general-purpose, Artemis targets live action    |
| `upscale_factor` | float   | `2`        | 1–4                                                                                                  | Resolution multiplier (e.g. `2` doubles width and height)                    |
| `target_fps`     | integer | —          | 16–60                                                                                                | Frame interpolation target; omit to keep original frame rate                  |
| `compression`    | float   | varies     | 0.0–1.0                                                                                              | Compression artifact reduction strength                                       |
| `noise`          | float   | varies     | 0.0–1.0                                                                                              | Noise reduction strength                                                      |
| `halo`           | float   | varies     | 0.0–1.0                                                                                              | Halo artifact suppression strength                                            |
| `grain`          | float   | varies     | 0.0–1.0                                                                                              | Film grain addition (0 = none, 1 = heavy)                                    |
| `recover_detail` | float   | varies     | 0.0–1.0                                                                                              | Detail recovery and sharpening strength                                       |
| `H264_output`    | boolean | `false`    | `true` `false`                                                                                       | Force H.264 codec output; default is H.265                                   |

## Curl

```bash
# 1. Submit to queue
REQUEST=$(curl -s -X POST "https://queue.fal.run/fal-ai/topaz/upscale/video" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://example.com/draft-720p.mp4",
    "model": "Proteus",
    "upscale_factor": 2,
    "recover_detail": 0.5,
    "noise": 0.3,
    "compression": 0.3
  }')

REQUEST_ID=$(echo "$REQUEST" | jq -r '.request_id')
echo "Request ID: $REQUEST_ID"

# 2. Poll until COMPLETED
while true; do
  STATUS_RESP=$(curl -s \
    "https://queue.fal.run/fal-ai/topaz/upscale/video/requests/$REQUEST_ID/status?logs=1" \
    -H "Authorization: Key $FAL_KEY")
  STATUS=$(echo "$STATUS_RESP" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "Error: $(echo "$STATUS_RESP" | jq -r '.error')"
    exit 1
  fi
  sleep 15
done

# 3. Fetch result
curl -s "https://queue.fal.run/fal-ai/topaz/upscale/video/requests/$REQUEST_ID/response" \
  -H "Authorization: Key $FAL_KEY" | jq '.video.url'
```

## JavaScript — async/await

```js
const FAL_KEY = process.env.FAL_KEY;
const MODEL_ID = "fal-ai/topaz/upscale/video";
const BASE = "https://queue.fal.run";

async function upscaleVideo(input) {
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
    await new Promise((r) => setTimeout(r, 15000));
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
  return result.video.url; // HTTPS URL to the upscaled video (download promptly)
}

const upscaledUrl = await upscaleVideo({
  video_url: "https://example.com/draft-720p.mp4",
  model: "Proteus",
  upscale_factor: 2,
  recover_detail: 0.5,
  noise: 0.3,
  compression: 0.3,
});
console.log("Upscaled Video URL:", upscaledUrl);
```

## Model Selection Guide

| Model        | Best for                                                              |
|--------------|-----------------------------------------------------------------------|
| `Proteus`    | General-purpose; good default for most AI-generated or mixed content  |
| `Artemis HQ` | Live-action footage; highest quality, slower                          |
| `Artemis MQ` | Live-action footage; balanced quality and speed                       |
| `Artemis LQ` | Live-action footage; fastest Artemis variant                          |
| `Gaia HQ`    | CGI and animation; preserves clean lines and flat color regions       |
| `Gaia CG`    | Video game footage and stylized CG                                    |

## Notes

- Output URLs are temporary — download and back up as soon as generation completes.
- Default output codec is H.265 (HEVC); set `H264_output: true` for broader compatibility.
- `upscale_factor` of 2 is the most common choice (720p → 1440p, 1080p → 4K).
- `target_fps` triggers frame interpolation — useful for 24fps → 60fps smoothing; omit if not needed.
- Enhancement parameter defaults vary by model; start with 0.3–0.5 and adjust to taste.
- Processing time scales with video length and `upscale_factor` — use a 15-second poll interval.
- Fire concurrent requests rather than waiting sequentially — fal.ai runs them in parallel.
