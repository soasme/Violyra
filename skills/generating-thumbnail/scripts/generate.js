#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname } from "node:path";
import { parseArgs } from "node:util";

const MODEL_ID = "google/nano-banana-pro";
const MODEL_PREDICTIONS_URL = `https://api.replicate.com/v1/models/${MODEL_ID}/predictions`;
const REPLICATE_FILES_URL = "https://api.replicate.com/v1/files";
const CLI_SCRIPT_PATH = ".agents/skills/generating-thumbnail/scripts/generate.js";
const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_ASPECT_RATIO = "16:9";
const DEFAULT_RESOLUTION = "2K";
const DEFAULT_OUTPUT_FORMAT = "jpg";
const DEFAULT_SAFETY_FILTER_LEVEL = "block_only_high";

const ALLOWED_ASPECT_RATIOS = new Set([
  "match_input_image",
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
]);
const ALLOWED_RESOLUTIONS = new Set(["1K", "2K", "4K"]);
const ALLOWED_OUTPUT_FORMATS = new Set(["jpg", "png"]);
const ALLOWED_SAFETY_FILTER_LEVELS = new Set([
  "block_low_and_above",
  "block_medium_and_above",
  "block_only_high",
]);

function printUsage() {
  console.log(`Usage:
  source .env && node ${CLI_SCRIPT_PATH} --prompt "<text>" --output <path> [--image <path-or-url>] [--aspect-ratio <value>] [--resolution <value>] [--output-format <jpg|png>] [--safety-filter-level <value>] [--allow-fallback-model] [--poll-interval-ms <ms>]

Options:
  --prompt, -p               Prompt text for the thumbnail (required)
  --output, -o               Local output image path (required)
  --image                    Reference image path/URL/data URI (repeat or comma-separate)
  --aspect-ratio             match_input_image | 1:1 | 2:3 | 3:2 | 3:4 | 4:3 | 4:5 | 5:4 | 9:16 | 16:9 | 21:9 (default: ${DEFAULT_ASPECT_RATIO})
  --resolution               1K | 2K | 4K (default: ${DEFAULT_RESOLUTION})
  --output-format            jpg | png (default: ${DEFAULT_OUTPUT_FORMAT})
  --safety-filter-level      block_low_and_above | block_medium_and_above | block_only_high (default: ${DEFAULT_SAFETY_FILTER_LEVEL})
  --allow-fallback-model     Allow model fallback
  --poll-interval-ms         Prediction polling interval in milliseconds (default: ${DEFAULT_POLL_INTERVAL_MS})
  --help, -h                 Show this help message
`);
}

function parsePositiveInteger(value, optionName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return parsed;
}

function parseAllowedString(value, optionName, allowedValues) {
  if (!allowedValues.has(value)) {
    throw new Error(
      `${optionName} must be one of: ${Array.from(allowedValues).join(" | ")}`
    );
  }
  return value;
}

function parseImageInputs(rawValues) {
  if (rawValues === undefined) {
    return [];
  }

  const values = Array.isArray(rawValues) ? rawValues : [rawValues];
  const parsed = [];
  for (const value of values) {
    const tokens = String(value)
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
    parsed.push(...tokens);
  }
  return parsed;
}

function buildModelInputOptions(values) {
  const prompt = typeof values.prompt === "string" ? values.prompt.trim() : "";
  if (!prompt) {
    throw new Error("--prompt is required");
  }

  const aspectRatio = values["aspect-ratio"]
    ? parseAllowedString(
        values["aspect-ratio"],
        "--aspect-ratio",
        ALLOWED_ASPECT_RATIOS
      )
    : DEFAULT_ASPECT_RATIO;

  const resolution = values.resolution
    ? parseAllowedString(values.resolution, "--resolution", ALLOWED_RESOLUTIONS)
    : DEFAULT_RESOLUTION;

  const outputFormat = values["output-format"]
    ? parseAllowedString(
        values["output-format"],
        "--output-format",
        ALLOWED_OUTPUT_FORMATS
      )
    : DEFAULT_OUTPUT_FORMAT;

  const safetyFilterLevel = values["safety-filter-level"]
    ? parseAllowedString(
        values["safety-filter-level"],
        "--safety-filter-level",
        ALLOWED_SAFETY_FILTER_LEVELS
      )
    : DEFAULT_SAFETY_FILTER_LEVEL;

  return {
    prompt,
    aspect_ratio: aspectRatio,
    resolution,
    output_format: outputFormat,
    safety_filter_level: safetyFilterLevel,
    allow_fallback_model: values["allow-fallback-model"] === true,
  };
}

function isTerminalStatus(status) {
  return status === "succeeded" || status === "failed" || status === "canceled";
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isDataUri(value) {
  return value.startsWith("data:");
}

function getMimeType(filepath) {
  const ext = extname(filepath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".avif": "image/avif",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

async function uploadFileToReplicate(filePath, apiToken) {
  let fileContent;
  try {
    fileContent = await readFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read image file "${filePath}": ${message}`);
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
    throw new Error(`Error uploading image file: ${await response.text()}`);
  }

  const payload = await response.json();
  const uploadedUrl = payload?.urls?.get;
  if (!uploadedUrl || typeof uploadedUrl !== "string") {
    throw new Error("Replicate file upload response missing urls.get");
  }

  return uploadedUrl;
}

async function resolveImageInput(imageInput, apiToken) {
  if (isHttpUrl(imageInput) || isDataUri(imageInput)) {
    return imageInput;
  }
  return uploadFileToReplicate(imageInput, apiToken);
}

async function resolveImageInputs(imageInputs, apiToken) {
  if (imageInputs.length === 0) {
    return [];
  }
  return Promise.all(
    imageInputs.map((imageInput) => resolveImageInput(imageInput, apiToken))
  );
}

function extractOutputUrl(output) {
  if (typeof output === "string") {
    return output;
  }
  if (Array.isArray(output)) {
    const firstString = output.find((value) => typeof value === "string");
    if (firstString) {
      return firstString;
    }
  }
  if (output && typeof output === "object" && typeof output.url === "string") {
    return output.url;
  }
  return "";
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

async function pollPrediction({ prediction, apiToken, pollIntervalMs }) {
  let current = prediction;
  while (!isTerminalStatus(current.status)) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    const pollResponse = await fetch(current.urls.get, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
    if (!pollResponse.ok) {
      throw new Error(`Error polling prediction: ${await pollResponse.text()}`);
    }
    current = await pollResponse.json();
    console.log(`Status: ${current.status}`);
  }
  return current;
}

async function downloadOutput({ outputUrl, outputPath }) {
  const response = await fetch(outputUrl);
  if (!response.ok) {
    throw new Error(`Error downloading output: ${response.status} ${response.statusText}`);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  const content = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(content));
}

async function main() {
  const { values } = parseArgs({
    options: {
      prompt: { type: "string", short: "p" },
      output: { type: "string", short: "o" },
      image: { type: "string", multiple: true },
      "aspect-ratio": { type: "string" },
      resolution: { type: "string" },
      "output-format": { type: "string" },
      "safety-filter-level": { type: "string" },
      "allow-fallback-model": { type: "boolean" },
      "poll-interval-ms": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const outputPath = typeof values.output === "string" ? values.output.trim() : "";
  if (!outputPath) {
    console.error("Error: --output is required");
    process.exit(1);
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error("Error: REPLICATE_API_TOKEN environment variable is not set");
    process.exit(1);
  }

  const modelInput = buildModelInputOptions(values);
  const imageInputs = parseImageInputs(values.image);
  const resolvedImages = await resolveImageInputs(imageInputs, apiToken);
  if (resolvedImages.length > 0) {
    modelInput.image_input = resolvedImages;
  }

  const pollIntervalMs = values["poll-interval-ms"]
    ? parsePositiveInteger(values["poll-interval-ms"], "--poll-interval-ms")
    : DEFAULT_POLL_INTERVAL_MS;

  console.log(`Creating thumbnail with ${MODEL_ID}...`);
  const prediction = await createPrediction({ input: modelInput, apiToken });
  console.log(`Prediction created: ${prediction.id}`);
  console.log(`Initial status: ${prediction.status}`);

  const completedPrediction = await pollPrediction({
    prediction,
    apiToken,
    pollIntervalMs,
  });

  if (completedPrediction.status !== "succeeded") {
    throw new Error(
      `Prediction ${completedPrediction.status}: ${completedPrediction.error || "Unknown error"}`
    );
  }

  const outputUrl = extractOutputUrl(completedPrediction.output);
  if (!outputUrl) {
    throw new Error("Prediction completed but output URL is missing");
  }

  await downloadOutput({ outputUrl, outputPath });
  console.log(`Output URL: ${outputUrl}`);
  console.log(`Saved thumbnail: ${outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

export {
  ALLOWED_ASPECT_RATIOS,
  ALLOWED_OUTPUT_FORMATS,
  ALLOWED_RESOLUTIONS,
  ALLOWED_SAFETY_FILTER_LEVELS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_RESOLUTION,
  DEFAULT_SAFETY_FILTER_LEVEL,
  MODEL_ID,
  MODEL_PREDICTIONS_URL,
  REPLICATE_FILES_URL,
  buildModelInputOptions,
  createPrediction,
  extractOutputUrl,
  getMimeType,
  isDataUri,
  isHttpUrl,
  main,
  parseImageInputs,
  resolveImageInput,
  resolveImageInputs,
};
