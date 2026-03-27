#!/usr/bin/env node

const { readFile, writeFile } = require("node:fs/promises");
const { extname } = require("node:path");
const { parseArgs } = require("node:util");

const CHATTERBOX_API_URL =
  "https://api.replicate.com/v1/models/resemble-ai/chatterbox/predictions";
const DEFAULT_POLL_INTERVAL_MS = 1000;

function printUsage() {
  console.log(`Usage:
  REPLICATE_API_TOKEN=<token> node .agent/skills/text-to-speech/scripts/chatterbox_tts.js --prompt "<text>" --output <output-audio-path> [--audio-ref <reference-audio-path>] [--poll-interval-ms <ms>]

Options:
  --prompt, -p             Prompt text to speak (required)
  --output, -o             Output audio path (required)
  --audio-ref, -a          Optional reference audio path (wav/mp3/m4a/flac/ogg)
  --poll-interval-ms       Prediction polling interval in milliseconds (default: 1000)
  --help, -h               Show this help message
`);
}

function getAudioMimeType(filepath) {
  const ext = extname(filepath).toLowerCase();
  const mimeTypes = {
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".flac": "audio/flac",
    ".ogg": "audio/ogg",
  };
  return mimeTypes[ext] || "audio/wav";
}

async function buildAudioPromptDataUri(audioRefPath) {
  const audioBuffer = await readFile(audioRefPath);
  const base64Audio = audioBuffer.toString("base64");
  const mimeType = getAudioMimeType(audioRefPath);
  return `data:${mimeType};base64,${base64Audio}`;
}

function extractAudioUrl(output) {
  if (typeof output === "string") {
    return output;
  }
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") {
    return output[0];
  }
  throw new Error("Unexpected prediction output format");
}

async function waitForPrediction(predictionUrl, apiToken, pollIntervalMs) {
  let prediction = { status: "starting", output: null, error: null };

  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const pollResponse = await fetch(predictionUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!pollResponse.ok) {
      throw new Error(`Error polling prediction: ${await pollResponse.text()}`);
    }

    prediction = await pollResponse.json();
    console.log(`Status: ${prediction.status}...`);
  }

  if (prediction.status === "failed") {
    throw new Error(`Prediction failed: ${prediction.error || "unknown error"}`);
  }

  return extractAudioUrl(prediction.output);
}

async function generateTts({
  prompt,
  outputPath,
  audioRefPath,
  apiToken,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}) {
  console.log("Generating TTS...");

  const input = { prompt };
  if (audioRefPath) {
    input.audio_prompt = await buildAudioPromptDataUri(audioRefPath);
  }

  const createResponse = await fetch(CHATTERBOX_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!createResponse.ok) {
    throw new Error(
      `Error creating TTS prediction: ${await createResponse.text()}`
    );
  }

  const prediction = await createResponse.json();
  if (!prediction?.urls?.get) {
    throw new Error("Prediction response missing polling URL");
  }
  console.log(`Prediction created: ${prediction.id}`);

  const audioUrl = await waitForPrediction(
    prediction.urls.get,
    apiToken,
    pollIntervalMs
  );
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Error downloading audio: ${audioResponse.statusText}`);
  }

  const outputBuffer = await audioResponse.arrayBuffer();
  await writeFile(outputPath, Buffer.from(outputBuffer));

  console.log(`Saved: ${outputPath}`);
}

function parsePositiveInteger(value, optionName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return parsed;
}

async function main() {
  const { values } = parseArgs({
    options: {
      prompt: { type: "string", short: "p" },
      output: { type: "string", short: "o" },
      "audio-ref": { type: "string", short: "a" },
      "poll-interval-ms": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printUsage();
    return;
  }

  const prompt = values.prompt?.trim();
  if (!prompt) {
    throw new Error("Missing required argument: --prompt");
  }

  const outputPath = values.output;
  if (!outputPath) {
    throw new Error("Missing required argument: --output");
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  const pollIntervalMs = values["poll-interval-ms"]
    ? parsePositiveInteger(values["poll-interval-ms"], "--poll-interval-ms")
    : DEFAULT_POLL_INTERVAL_MS;

  await generateTts({
    prompt,
    outputPath,
    audioRefPath: values["audio-ref"],
    apiToken,
    pollIntervalMs,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  CHATTERBOX_API_URL,
  DEFAULT_POLL_INTERVAL_MS,
  generateTts,
  getAudioMimeType,
  main,
  waitForPrediction,
};
