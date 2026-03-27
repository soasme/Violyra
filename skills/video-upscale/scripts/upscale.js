#!/usr/bin/env node

const { access, mkdir, readFile, writeFile } = require("node:fs/promises");
const { constants } = require("node:fs");
const { basename, dirname, extname } = require("node:path");
const { parseArgs } = require("node:util");

const CLI_SCRIPT_PATH = ".agents/skills/video-upscale/scripts/upscale.js";
const MODEL_ID = "topazlabs/video-upscale";
const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const MODEL_PREDICTIONS_URL = `${REPLICATE_API_BASE}/models/${MODEL_ID}/predictions`;
const REPLICATE_FILES_URL = `${REPLICATE_API_BASE}/files`;

const DEFAULT_TARGET_RESOLUTION = "1080p";
const ALLOWED_TARGET_RESOLUTIONS = new Set(["720p", "1080p", "4k"]);
const DEFAULT_TARGET_FPS = 24;
const MIN_TARGET_FPS = 15;
const MAX_TARGET_FPS = 120;
const DEFAULT_POLL_INTERVAL_MS = 1000;

const TERMINAL_PREDICTION_STATUSES = new Set(["succeeded", "failed", "canceled"]);

function printUsage() {
  console.log(`Usage:
  pnpm exec dotenv -- node ${CLI_SCRIPT_PATH} --input <video.mp4> [--output <upscaled.mp4>] [--target-resolution <720p|1080p|4k>] [--target-fps <15-120>] [--poll-interval-ms <ms>]

Options:
  --input, -i             Input video path or URL (required)
  --output, -o            Output file path (default: <input>.upscaled.<ext> for local files, otherwise assets/upscaled.mp4)
  --target-resolution     Target resolution: 720p | 1080p | 4k (default: ${DEFAULT_TARGET_RESOLUTION})
  --target-fps            Target fps: ${MIN_TARGET_FPS}-${MAX_TARGET_FPS} (default: ${DEFAULT_TARGET_FPS})
  --poll-interval-ms      Poll interval in milliseconds (default: ${DEFAULT_POLL_INTERVAL_MS})
  --help, -h              Show this help message
`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpUrl(value) {
  if (typeof value !== "string") {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isDataUri(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function parseIntegerInRange(rawValue, optionName, min, max, fallback) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return fallback;
  }
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${optionName} must be an integer`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${optionName} must be between ${min} and ${max}`);
  }
  return parsed;
}

function parseTargetResolution(rawValue) {
  const value = rawValue || DEFAULT_TARGET_RESOLUTION;
  if (!ALLOWED_TARGET_RESOLUTIONS.has(value)) {
    throw new Error(
      `--target-resolution must be one of: ${Array.from(
        ALLOWED_TARGET_RESOLUTIONS
      ).join(" | ")}`
    );
  }
  return value;
}

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  const mimeByExtension = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".m4v": "video/x-m4v",
  };
  return mimeByExtension[ext] || "application/octet-stream";
}

async function assertReadableFile(filePath, optionName) {
  try {
    await access(filePath, constants.R_OK);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${optionName} is not readable: ${filePath} (${message})`);
  }
}

async function ensureParentDirectory(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

function buildDefaultOutputPath(inputValue) {
  if (isHttpUrl(inputValue) || isDataUri(inputValue)) {
    return "assets/upscaled.mp4";
  }

  const extension = extname(inputValue);
  if (!extension) {
    return `${inputValue}.upscaled.mp4`;
  }

  return `${inputValue.slice(0, -extension.length)}.upscaled${extension}`;
}

async function uploadFileToReplicate(filePath, apiToken) {
  let fileContent;
  try {
    fileContent = await readFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read video file "${filePath}": ${message}`);
  }

  const formData = new FormData();
  formData.append(
    "content",
    new Blob([fileContent], { type: getMimeType(filePath) }),
    basename(filePath)
  );

  const response = await fetch(REPLICATE_FILES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error uploading video file: ${await response.text()}`);
  }

  const payload = await response.json();
  const uploadedUrl = payload?.urls?.get;
  if (!uploadedUrl || typeof uploadedUrl !== "string") {
    throw new Error("Replicate file upload response missing urls.get");
  }

  return uploadedUrl;
}

async function resolveVideoInput(videoInput, apiToken) {
  if (!videoInput) {
    throw new Error("--input is required");
  }

  if (isHttpUrl(videoInput) || isDataUri(videoInput)) {
    return videoInput;
  }

  await assertReadableFile(videoInput, "--input");
  return uploadFileToReplicate(videoInput, apiToken);
}

function extractOutputUrl(output) {
  if (typeof output === "string") {
    return output;
  }
  if (Array.isArray(output)) {
    return output.find((item) => typeof item === "string") || null;
  }
  if (output && typeof output === "object" && typeof output.url === "string") {
    return output.url;
  }
  return null;
}

async function createPrediction({ input, apiToken }) {
  const response = await fetch(MODEL_PREDICTIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(`Error creating prediction: ${await response.text()}`);
  }

  return response.json();
}

async function waitForPrediction(predictionUrl, apiToken, pollIntervalMs) {
  let prediction = { status: "starting", output: null, error: null };

  while (!TERMINAL_PREDICTION_STATUSES.has(prediction.status)) {
    await sleep(pollIntervalMs);

    const pollResponse = await fetch(predictionUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!pollResponse.ok) {
      throw new Error(`Error polling prediction: ${await pollResponse.text()}`);
    }

    prediction = await pollResponse.json();
    console.log(`Status: ${prediction.status}...`);
  }

  if (prediction.status === "failed" || prediction.status === "canceled") {
    throw new Error(`Prediction ${prediction.status}: ${prediction.error || "unknown error"}`);
  }

  return prediction;
}

async function downloadToFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error downloading upscaled video: ${response.status} ${response.statusText}`);
  }

  const outputBuffer = await response.arrayBuffer();
  await ensureParentDirectory(outputPath);
  await writeFile(outputPath, Buffer.from(outputBuffer));
}

async function upscaleVideo({
  inputPath,
  outputPath,
  targetResolution = DEFAULT_TARGET_RESOLUTION,
  targetFps = DEFAULT_TARGET_FPS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  apiToken,
}) {
  const resolvedVideoInput = await resolveVideoInput(inputPath, apiToken);

  const predictionInput = {
    video: resolvedVideoInput,
    target_resolution: targetResolution,
    target_fps: targetFps,
  };

  let prediction = await createPrediction({
    input: predictionInput,
    apiToken,
  });

  if (!TERMINAL_PREDICTION_STATUSES.has(prediction.status)) {
    const predictionUrl = prediction?.urls?.get;
    if (!predictionUrl) {
      throw new Error("Prediction response missing polling URL");
    }
    prediction = await waitForPrediction(predictionUrl, apiToken, pollIntervalMs);
  }

  const outputUrl = extractOutputUrl(prediction.output);
  if (!outputUrl) {
    throw new Error("Prediction succeeded but no output URL was returned");
  }

  await downloadToFile(outputUrl, outputPath);

  return {
    outputPath,
    outputUrl,
    prediction: {
      id: prediction.id ?? null,
      status: prediction.status ?? null,
      error: prediction.error ?? null,
      completed_at: prediction.completed_at ?? null,
    },
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      "target-resolution": { type: "string" },
      "target-fps": { type: "string" },
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

  const inputPath = typeof values.input === "string" ? values.input.trim() : "";
  if (!inputPath) {
    throw new Error("--input is required");
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  const targetResolution = parseTargetResolution(values["target-resolution"]);
  const targetFps = parseIntegerInRange(
    values["target-fps"],
    "--target-fps",
    MIN_TARGET_FPS,
    MAX_TARGET_FPS,
    DEFAULT_TARGET_FPS
  );
  const pollIntervalMs = parseIntegerInRange(
    values["poll-interval-ms"],
    "--poll-interval-ms",
    100,
    60000,
    DEFAULT_POLL_INTERVAL_MS
  );
  const outputPath =
    typeof values.output === "string" && values.output.trim()
      ? values.output.trim()
      : buildDefaultOutputPath(inputPath);

  console.log(`[1/3] Upscaling via ${MODEL_ID}...`);
  const result = await upscaleVideo({
    inputPath,
    outputPath,
    targetResolution,
    targetFps,
    pollIntervalMs,
    apiToken,
  });
  console.log(`[2/3] Downloaded upscaled file to ${result.outputPath}`);
  console.log(`[3/3] Output URL: ${result.outputUrl}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  ALLOWED_TARGET_RESOLUTIONS,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_TARGET_FPS,
  DEFAULT_TARGET_RESOLUTION,
  MAX_TARGET_FPS,
  MIN_TARGET_FPS,
  MODEL_ID,
  MODEL_PREDICTIONS_URL,
  REPLICATE_FILES_URL,
  buildDefaultOutputPath,
  createPrediction,
  downloadToFile,
  extractOutputUrl,
  getMimeType,
  isDataUri,
  isHttpUrl,
  main,
  parseIntegerInRange,
  parseTargetResolution,
  resolveVideoInput,
  sleep,
  upscaleVideo,
  uploadFileToReplicate,
  waitForPrediction,
};

