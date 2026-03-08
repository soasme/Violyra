#!/usr/bin/env node

const { mkdir, readFile, writeFile } = require("node:fs/promises");
const { basename, dirname, extname, join } = require("node:path");
const { parseArgs } = require("node:util");

const MODEL_ID = "bytedance/seedance-1.5-pro";
const MODEL_PREDICTIONS_URL = `https://api.replicate.com/v1/models/${MODEL_ID}/predictions`;
const REPLICATE_FILES_URL = "https://api.replicate.com/v1/files";
const CLI_SCRIPT_PATH = ".agents/skills/seedance15-generate/scripts/generate.js";
const DEFAULT_INPUT_PATH = "assets/storyboard.json";
const DEFAULT_OUTPUT_PATH = "assets/storyboard.manifest.json";
const DEFAULT_SCENES_DIR = "assets/scenes";
const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_DURATION = 5;
const MIN_DURATION = 2;
const MAX_DURATION = 12;
const DEFAULT_RESOLUTION = "720p";
const ALLOWED_RESOLUTIONS = new Set(["480p", "720p", "1080p"]);
const DEFAULT_ASPECT_RATIO = "16:9";
const ALLOWED_ASPECT_RATIOS = new Set([
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "1:1",
  "21:9",
  "9:21",
]);
const DEFAULT_FPS = 24;
const ALLOWED_FPS = new Set([24]);
const DEFAULT_GENERATE_AUDIO = false;

function printUsage() {
  console.log(`Usage:
  pnpm exec dotenv -- node ${CLI_SCRIPT_PATH} [--input <storyboard-json>] [--output <manifest-json>] [--scenes-dir <dir>] [--scene-id <id>] [--duration <seconds>] [--resolution <value>] [--aspect-ratio <value>] [--fps <value>] [--generate-audio] [--image <uri>] [--poll-interval-ms <ms>]

Options:
  --input, -i              Input storyboard JSON path (default: ${DEFAULT_INPUT_PATH})
  --output, -o             Output manifest path (default: <input>.manifest.json, e.g. ${DEFAULT_OUTPUT_PATH})
  --scenes-dir, -s         Directory for downloaded scene videos (default: ${DEFAULT_SCENES_DIR})
  --scene-id               Generate only specific scene IDs (repeat or comma-separate, e.g. --scene-id 1 --scene-id 3,4)
  --duration, -d           Duration in seconds (${MIN_DURATION}-${MAX_DURATION}, default: ${DEFAULT_DURATION})
  --resolution, -r         Video resolution: 480p | 720p | 1080p (default: ${DEFAULT_RESOLUTION})
  --aspect-ratio, -a       Aspect ratio: 16:9 | 9:16 | 4:3 | 3:4 | 1:1 | 21:9 | 9:21 (default: ${DEFAULT_ASPECT_RATIO})
  --fps, -f                Frames per second (allowed: 24, default: ${DEFAULT_FPS})
  --generate-audio         Enable synchronized audio generation (default: ${DEFAULT_GENERATE_AUDIO})
  --image                  Optional image input for image-to-video generation (URL, data URI, or local file path)
  --poll-interval-ms       Prediction polling interval in milliseconds (default: ${DEFAULT_POLL_INTERVAL_MS})
  --help, -h               Show this help message
`);
}

function buildDefaultOutputPath(inputPath) {
  const normalizedInputPath =
    typeof inputPath === "string" && inputPath.trim() ? inputPath : DEFAULT_INPUT_PATH;
  const inputExtension = extname(normalizedInputPath);
  if (!inputExtension) {
    return `${normalizedInputPath}.manifest.json`;
  }
  return `${normalizedInputPath.slice(0, -inputExtension.length)}.manifest${inputExtension}`;
}

function isTerminalStatus(status) {
  return status === "succeeded" || status === "failed" || status === "canceled";
}

function parsePositiveInteger(value, optionName) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return parsed;
}

function parseIntegerInRange(value, optionName, min, max) {
  const parsed = parsePositiveInteger(value, optionName);
  if (parsed < min || parsed > max) {
    throw new Error(`${optionName} must be between ${min} and ${max}`);
  }
  return parsed;
}

function parseSceneDurationValue(rawDuration, sceneId, fallbackDuration) {
  if (rawDuration === undefined || rawDuration === null || rawDuration === "") {
    return fallbackDuration;
  }

  const optionName = `Scene ${sceneId} "duration"`;

  if (typeof rawDuration === "number") {
    if (!Number.isInteger(rawDuration)) {
      throw new Error(`${optionName} must be an integer`);
    }
    if (rawDuration < MIN_DURATION || rawDuration > MAX_DURATION) {
      throw new Error(`${optionName} must be between ${MIN_DURATION} and ${MAX_DURATION}`);
    }
    return rawDuration;
  }

  if (typeof rawDuration === "string") {
    return parseIntegerInRange(rawDuration, optionName, MIN_DURATION, MAX_DURATION);
  }

  throw new Error(`${optionName} must be an integer`);
}

function parseAllowedInteger(value, optionName, allowedValues) {
  const parsed = parsePositiveInteger(value, optionName);
  if (!allowedValues.has(parsed)) {
    throw new Error(
      `${optionName} must be one of: ${Array.from(allowedValues).join(", ")}`
    );
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

function parseSceneIds(rawValues) {
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

    for (const token of tokens) {
      parsed.push(parsePositiveInteger(token, "--scene-id"));
    }
  }

  if (parsed.length === 0) {
    throw new Error("--scene-id must include at least one positive integer");
  }

  const deduped = [];
  const seen = new Set();
  for (const sceneId of parsed) {
    if (seen.has(sceneId)) {
      continue;
    }
    seen.add(sceneId);
    deduped.push(sceneId);
  }

  return deduped;
}

function buildModelInputOptions(values) {
  const duration = values.duration
    ? parseIntegerInRange(values.duration, "--duration", MIN_DURATION, MAX_DURATION)
    : DEFAULT_DURATION;

  const resolution = values.resolution
    ? parseAllowedString(values.resolution, "--resolution", ALLOWED_RESOLUTIONS)
    : DEFAULT_RESOLUTION;

  const aspectRatio = values["aspect-ratio"]
    ? parseAllowedString(
        values["aspect-ratio"],
        "--aspect-ratio",
        ALLOWED_ASPECT_RATIOS
      )
    : DEFAULT_ASPECT_RATIO;

  const fps = values.fps
    ? parseAllowedInteger(values.fps, "--fps", ALLOWED_FPS)
    : DEFAULT_FPS;

  const generateAudio = values["generate-audio"] === true;
  const image = typeof values.image === "string" ? values.image.trim() : "";

  return {
    duration,
    resolution,
    aspect_ratio: aspectRatio,
    fps,
    generate_audio: generateAudio,
    ...(image ? { image } : {}),
  };
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
    new Blob([fileContent], { type: "application/octet-stream" }),
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
  if (!imageInput) {
    return "";
  }

  if (isHttpUrl(imageInput) || isDataUri(imageInput)) {
    return imageInput;
  }

  return uploadFileToReplicate(imageInput, apiToken);
}

function extractOutputUrls(output) {
  if (typeof output === "string") {
    return [output];
  }
  if (Array.isArray(output)) {
    return output.filter((value) => typeof value === "string");
  }
  if (output && typeof output === "object" && typeof output.url === "string") {
    return [output.url];
  }
  return [];
}

function buildSceneFilename(sceneId, index) {
  const rawId = sceneId == null ? "" : String(sceneId).trim();
  const normalizedId = rawId ? rawId.replace(/[^a-zA-Z0-9._-]/g, "_") : "";
  const fallbackId = String(index + 1);
  return `${normalizedId || fallbackId}.mp4`;
}

function buildSceneVideoPath(scene, index, scenesDir) {
  const sceneId = resolveSceneId(scene, index);
  return join(scenesDir, buildSceneFilename(sceneId, index));
}

async function downloadToFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error downloading video: ${response.status} ${response.statusText}`);
  }

  const outputBuffer = await response.arrayBuffer();
  await writeFile(outputPath, Buffer.from(outputBuffer));
}

async function downloadSceneVideos({ scenes, scenesDir }) {
  await mkdir(scenesDir, { recursive: true });

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const sceneId = scene?.scene_id ?? index + 1;
    const outputUrl = scene?.prediction?.output_urls?.[0];
    if (!outputUrl) {
      throw new Error(`Scene ${sceneId} has no downloadable output URL`);
    }

    const videoPath = buildSceneVideoPath(scene, index, scenesDir);
    console.log(`Downloading scene ${sceneId} video...`);
    await downloadToFile(outputUrl, videoPath);
    scene.video_file = videoPath;
  }

  return scenes;
}

async function readStoryboard(inputPath) {
  let raw = "";
  try {
    raw = await readFile(inputPath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read input file "${inputPath}": ${message}`);
  }

  let storyboard;
  try {
    storyboard = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in "${inputPath}": ${message}`);
  }

  if (!storyboard || typeof storyboard !== "object" || !Array.isArray(storyboard.scenes)) {
    throw new Error(`"${inputPath}" must contain a "scenes" array`);
  }
  if (storyboard.scenes.length === 0) {
    throw new Error(`"${inputPath}" has no scenes`);
  }

  return storyboard;
}

function selectScenes(storyboardScenes, requestedSceneIds) {
  if (!Array.isArray(requestedSceneIds) || requestedSceneIds.length === 0) {
    return storyboardScenes;
  }

  const scenesById = new Map();
  for (let index = 0; index < storyboardScenes.length; index += 1) {
    const scene = storyboardScenes[index];
    const sceneId = scene?.scene_id ?? index + 1;
    scenesById.set(String(sceneId), scene);
  }

  return requestedSceneIds.map((sceneId) => {
    const scene = scenesById.get(String(sceneId));
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found in storyboard`);
    }
    return scene;
  });
}

function resolveSceneId(scene, index) {
  return scene?.scene_id ?? index + 1;
}

async function readExistingOutputManifest(outputPath) {
  let raw = "";
  try {
    raw = await readFile(outputPath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return null;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read existing output file "${outputPath}": ${message}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in existing output file "${outputPath}": ${message}`);
  }

  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.scenes)) {
    throw new Error(`Existing output file "${outputPath}" must contain a "scenes" array`);
  }

  return manifest;
}

function mergeScenesByStoryboardOrder({
  storyboardScenes = [],
  existingScenes = [],
  generatedScenes = [],
}) {
  const mergedById = new Map();

  for (let index = 0; index < existingScenes.length; index += 1) {
    const scene = existingScenes[index];
    const sceneId = resolveSceneId(scene, index);
    mergedById.set(String(sceneId), scene);
  }

  for (let index = 0; index < generatedScenes.length; index += 1) {
    const scene = generatedScenes[index];
    const sceneId = resolveSceneId(scene, index);
    mergedById.set(String(sceneId), scene);
  }

  const orderedScenes = [];
  const seenIds = new Set();

  for (let index = 0; index < storyboardScenes.length; index += 1) {
    const storyboardScene = storyboardScenes[index];
    const sceneId = String(resolveSceneId(storyboardScene, index));
    if (!mergedById.has(sceneId)) {
      continue;
    }
    orderedScenes.push(mergedById.get(sceneId));
    seenIds.add(sceneId);
  }

  for (const [sceneId, scene] of mergedById.entries()) {
    if (seenIds.has(sceneId)) {
      continue;
    }
    orderedScenes.push(scene);
  }

  return orderedScenes;
}

function splitScenesByCachedManifest({
  scenes,
  existingScenes = [],
  fallbackDuration = DEFAULT_DURATION,
}) {
  const existingScenesById = new Map();
  for (let index = 0; index < existingScenes.length; index += 1) {
    const existingScene = existingScenes[index];
    const sceneId = resolveSceneId(existingScene, index);
    existingScenesById.set(String(sceneId), existingScene);
  }

  const scenesToGenerate = [];
  const skippedScenes = [];

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const sceneId = resolveSceneId(scene, index);
    const sceneDuration = parseSceneDurationValue(
      scene?.duration,
      sceneId,
      fallbackDuration
    );
    const existingScene = existingScenesById.get(String(sceneId));
    if (!existingScene) {
      scenesToGenerate.push(scene);
      continue;
    }

    skippedScenes.push({
      ...existingScene,
      duration: existingScene.duration ?? sceneDuration,
    });
  }

  return {
    scenesToGenerate,
    skippedScenes,
  };
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

  while (!isTerminalStatus(prediction.status)) {
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

  if (prediction.status === "failed" || prediction.status === "canceled") {
    throw new Error(`Prediction ${prediction.status}: ${prediction.error || "unknown error"}`);
  }

  return prediction;
}

async function generateScenes({
  scenes,
  generationInput = {},
  apiToken,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}) {
  const generatedScenes = [];

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const sceneId = scene?.scene_id ?? index + 1;
    const prompt = typeof scene?.prompt === "string" ? scene.prompt.trim() : "";
    if (!prompt) {
      throw new Error(`Scene ${sceneId} is missing "prompt"`);
    }
    const duration = parseSceneDurationValue(
      scene?.duration,
      sceneId,
      generationInput.duration
    );

    console.log(`[${index + 1}/${scenes.length}] Generating scene ${sceneId}...`);

    const input = { ...generationInput, prompt, duration };
    let prediction = await createPrediction({ input, apiToken });
    if (!isTerminalStatus(prediction.status)) {
      const predictionUrl = prediction?.urls?.get;
      if (!predictionUrl) {
        throw new Error(`Prediction response missing polling URL for scene ${sceneId}`);
      }
      prediction = await waitForPrediction(predictionUrl, apiToken, pollIntervalMs);
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(`Scene ${sceneId} failed: ${prediction.error || "unknown error"}`);
    }

    generatedScenes.push({
      scene_id: sceneId,
      section: scene.section ?? null,
      character: scene.character ?? null,
      duration,
      prompt,
      prediction: {
        id: prediction.id ?? null,
        status: prediction.status ?? null,
        output: prediction.output ?? null,
        output_urls: extractOutputUrls(prediction.output),
        error: prediction.error ?? null,
        completed_at: prediction.completed_at ?? null,
      },
    });
  }

  return generatedScenes;
}

async function writeOutput({
  outputPath,
  scenesDir,
  inputPath,
  requestedSceneIds = [],
  storyboard,
  generationInput,
  scenes,
}) {
  const storyboardSceneCount = Array.isArray(storyboard?.scenes)
    ? storyboard.scenes.length
    : null;
  const hasCompleteStoryboard =
    Number.isInteger(storyboardSceneCount) && storyboardSceneCount > 0
      ? scenes.length >= storyboardSceneCount
      : false;

  const payload = {
    model: MODEL_ID,
    generated_at: new Date().toISOString(),
    input_file: inputPath,
    source_storyboard_model: storyboard.model ?? null,
    song_title: storyboard.song_title ?? null,
    generation_input: generationInput,
    requested_scene_ids:
      requestedSceneIds.length > 0 && !hasCompleteStoryboard ? requestedSceneIds : null,
    scenes_dir: scenesDir,
    scene_count: scenes.length,
    scenes,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string", short: "i" },
      output: { type: "string", short: "o" },
      "scenes-dir": { type: "string", short: "s" },
      "scene-id": { type: "string", multiple: true },
      duration: { type: "string", short: "d" },
      resolution: { type: "string", short: "r" },
      "aspect-ratio": { type: "string", short: "a" },
      fps: { type: "string", short: "f" },
      "generate-audio": { type: "boolean" },
      image: { type: "string" },
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

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  const inputPath = values.input || DEFAULT_INPUT_PATH;
  const outputPath = values.output || buildDefaultOutputPath(inputPath);
  const scenesDir = values["scenes-dir"] || DEFAULT_SCENES_DIR;
  const requestedSceneIds = parseSceneIds(values["scene-id"]);
  const pollIntervalMs = values["poll-interval-ms"]
    ? parsePositiveInteger(values["poll-interval-ms"], "--poll-interval-ms")
    : DEFAULT_POLL_INTERVAL_MS;
  const generationInput = buildModelInputOptions(values);

  const storyboard = await readStoryboard(inputPath);
  const selectedScenes = selectScenes(storyboard.scenes, requestedSceneIds);
  const existingManifest = await readExistingOutputManifest(outputPath);
  const existingScenes = existingManifest?.scenes ?? [];
  const { scenesToGenerate, skippedScenes } = splitScenesByCachedManifest({
    scenes: selectedScenes,
    existingScenes,
    fallbackDuration: generationInput.duration,
  });
  for (let index = 0; index < skippedScenes.length; index += 1) {
    const skippedScene = skippedScenes[index];
    const skippedSceneId = resolveSceneId(skippedScene, index);
    console.log(`Skipping scene ${skippedSceneId}: cached in manifest`);
  }

  if (scenesToGenerate.length > 0 && generationInput.image) {
    generationInput.image = await resolveImageInput(generationInput.image, apiToken);
  }

  let generatedScenes = [];
  if (scenesToGenerate.length > 0) {
    generatedScenes = await generateScenes({
      scenes: scenesToGenerate,
      generationInput,
      apiToken,
      pollIntervalMs,
    });
    await downloadSceneVideos({
      scenes: generatedScenes,
      scenesDir,
    });
  } else {
    console.log("No scenes to generate");
  }

  const mergedScenes = mergeScenesByStoryboardOrder({
    storyboardScenes: storyboard.scenes,
    existingScenes,
    generatedScenes: [...skippedScenes, ...generatedScenes],
  });

  await writeOutput({
    outputPath,
    scenesDir,
    inputPath,
    requestedSceneIds,
    storyboard,
    generationInput,
    scenes: mergedScenes,
  });

  console.log(`Saved: ${outputPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_INPUT_PATH,
  DEFAULT_OUTPUT_PATH,
  DEFAULT_SCENES_DIR,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_DURATION,
  MIN_DURATION,
  MAX_DURATION,
  DEFAULT_RESOLUTION,
  ALLOWED_RESOLUTIONS,
  DEFAULT_ASPECT_RATIO,
  ALLOWED_ASPECT_RATIOS,
  DEFAULT_FPS,
  ALLOWED_FPS,
  DEFAULT_GENERATE_AUDIO,
  MODEL_ID,
  MODEL_PREDICTIONS_URL,
  REPLICATE_FILES_URL,
  buildModelInputOptions,
  buildDefaultOutputPath,
  createPrediction,
  downloadSceneVideos,
  downloadToFile,
  buildSceneFilename,
  extractOutputUrls,
  generateScenes,
  isDataUri,
  isHttpUrl,
  main,
  parsePositiveInteger,
  parseSceneDurationValue,
  parseSceneIds,
  readStoryboard,
  readExistingOutputManifest,
  resolveImageInput,
  resolveSceneId,
  selectScenes,
  splitScenesByCachedManifest,
  mergeScenesByStoryboardOrder,
  uploadFileToReplicate,
  waitForPrediction,
  writeOutput,
};
