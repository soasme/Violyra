#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs } from "node:util";

import { upscaleVideo, parseTargetResolution } from "../../upscaling-video/scripts/upscale.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLI_SCRIPT_PATH = ".agents/skills/compiling-video/scripts/compile.js";
const DEFAULT_STORYBOARD_PATH = "assets/storyboard.json";
const DEFAULT_ALIGNED_PATH = "assets/aligned_lyrics.json";
const DEFAULT_SONG_PATH = "assets/song.mp3";
const DEFAULT_SCENES_DIR = "assets/scenes";
const DEFAULT_WORK_DIR = "assets/final/build-compile";
const DEFAULT_OUTPUT_DIR = "assets/final";
const DEFAULT_OUTPUT_WIDTH = 1920;
const DEFAULT_OUTPUT_HEIGHT = 1080;
const DEFAULT_FPS = 24;
const DEFAULT_TARGET_FPS = 24;
const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_FIT_MODE = "fill-crop";
const ALLOWED_FIT_MODES = new Set(["fill-crop", "contain"]);

function printUsage() {
  console.log(`Usage:
  source .env && node ${CLI_SCRIPT_PATH} [options]

Options:
  --storyboard            Storyboard JSON path (default: ${DEFAULT_STORYBOARD_PATH})
  --aligned               Aligned lyric JSON path (default: ${DEFAULT_ALIGNED_PATH})
  --song                  Song audio path (default: ${DEFAULT_SONG_PATH})
  --manifest              Optional generation manifest JSON path (uses scene prediction.output_urls for upscale input)
  --scenes-dir            Scene clips directory (default: ${DEFAULT_SCENES_DIR})
  --work-dir              Working directory for intermediates (default: ${DEFAULT_WORK_DIR})
  --output, -o            Final output mp4 path (default: assets/final/<song>.full-song.1080p.mp4)
  --width                 Output width (default: ${DEFAULT_OUTPUT_WIDTH})
  --height                Output height (default: ${DEFAULT_OUTPUT_HEIGHT})
  --fps                   Output fps (default: ${DEFAULT_FPS})
  --fit-mode              Frame fit mode: fill-crop | contain (default: ${DEFAULT_FIT_MODE})
  --target-resolution     Upscale target: 720p | 1080p | 4k (default: 1080p)
  --target-fps            Upscale target fps (default: ${DEFAULT_TARGET_FPS})
  --poll-interval-ms      Replicate poll interval in ms (default: ${DEFAULT_POLL_INTERVAL_MS})
  --no-upscale            Disable auto-upscale (always skip Replicate)
  --force-upscale         Re-run upscaler even if cached upscaled clip exists
  --help, -h              Show this help
`);
}

function parsePositiveInteger(rawValue, optionName, fallback) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return fallback;
  }
  const parsed = Number.parseInt(String(rawValue), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return parsed;
}

function parseIntegerInRange(rawValue, optionName, min, max, fallback) {
  const parsed = parsePositiveInteger(rawValue, optionName, fallback);
  if (parsed < min || parsed > max) {
    throw new Error(`${optionName} must be between ${min} and ${max}`);
  }
  return parsed;
}

function parseFitMode(rawValue) {
  const mode = rawValue || DEFAULT_FIT_MODE;
  if (!ALLOWED_FIT_MODES.has(mode)) {
    throw new Error(
      `--fit-mode must be one of: ${Array.from(ALLOWED_FIT_MODES).join(" | ")}`
    );
  }
  return mode;
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

async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return false;
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to check file "${filePath}": ${message}`);
  }
}

function execRead(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function execRun(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function loadJsonFile(filePath) {
  return readFile(filePath, "utf8").then((raw) => JSON.parse(raw));
}

function buildDefaultOutputPath(songPath) {
  const songName = basename(songPath, extname(songPath));
  return join(DEFAULT_OUTPUT_DIR, `${songName}.full-song.1080p.mp4`);
}

function getMediaDuration(filePath) {
  const output = execRead("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);
  const duration = Number(output);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Could not read media duration for ${filePath}`);
  }
  return duration;
}

function getVideoDimensions(filePath) {
  const output = execRead("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=p=0:s=x",
    filePath,
  ]);
  const [widthRaw, heightRaw] = output.split("x");
  const width = Number.parseInt(widthRaw, 10);
  const height = Number.parseInt(heightRaw, 10);
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`Could not read video dimensions for ${filePath}`);
  }
  return { width, height };
}

function resolveSceneId(scene, index) {
  return scene?.scene_id ?? index + 1;
}

function computeSceneTimings({ scenes, alignedLines, songDuration }) {
  if (!Array.isArray(scenes) || scenes.length === 0) {
    throw new Error("Storyboard must contain scenes");
  }
  if (!Array.isArray(alignedLines) || alignedLines.length === 0) {
    throw new Error("Aligned lyrics JSON must contain lines");
  }

  const sceneLineStartTimes = [];
  let lineCursor = 0;
  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const scene = scenes[sceneIndex];
    const lyricCount = Array.isArray(scene?.lyrics) ? scene.lyrics.length : 0;
    if (lyricCount <= 0) {
      throw new Error(`Scene ${resolveSceneId(scene, sceneIndex)} has no lyrics`);
    }
    if (!alignedLines[lineCursor]) {
      throw new Error(`Missing aligned timing line for scene ${resolveSceneId(scene, sceneIndex)}`);
    }
    sceneLineStartTimes.push(Number(alignedLines[lineCursor].start));
    lineCursor += lyricCount;
  }

  if (lineCursor !== alignedLines.length) {
    throw new Error(
      `Aligned lines mismatch: consumed ${lineCursor}, aligned has ${alignedLines.length}`
    );
  }

  const timings = [];
  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const scene = scenes[sceneIndex];
    const start = sceneIndex === 0 ? 0 : sceneLineStartTimes[sceneIndex];
    const end =
      sceneIndex === scenes.length - 1 ? songDuration : sceneLineStartTimes[sceneIndex + 1];
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      throw new Error(`Invalid timing window for scene ${resolveSceneId(scene, sceneIndex)}`);
    }
    timings.push({
      scene_id: resolveSceneId(scene, sceneIndex),
      start,
      end,
      duration: end - start,
    });
  }

  return timings;
}

function buildManifestOutputUrlMap(manifest) {
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.scenes)) {
    return new Map();
  }

  const map = new Map();
  for (let index = 0; index < manifest.scenes.length; index += 1) {
    const scene = manifest.scenes[index];
    const sceneId = resolveSceneId(scene, index);
    const outputUrl = scene?.prediction?.output_urls?.[0];
    if (typeof outputUrl === "string" && outputUrl.trim()) {
      map.set(String(sceneId), outputUrl.trim());
    }
  }
  return map;
}

function shouldUpscale({ width, height, targetWidth, targetHeight }) {
  return width < targetWidth || height < targetHeight;
}

function buildFrameFilter({ setptsFactor, width, height, fps, fitMode }) {
  if (fitMode === "contain") {
    return [
      `setpts=${setptsFactor}*PTS`,
      `fps=${fps}`,
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
      "setsar=1",
      "format=yuv420p",
    ].join(",");
  }

  return [
    `setpts=${setptsFactor}*PTS`,
    `fps=${fps}`,
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
    "setsar=1",
    "format=yuv420p",
  ].join(",");
}

function stretchSceneToTarget({
  inputPath,
  outputPath,
  targetDuration,
  width,
  height,
  fps,
  fitMode,
}) {
  const inputDuration = getMediaDuration(inputPath);
  const setptsFactor = targetDuration / inputDuration;
  const filter = buildFrameFilter({
    setptsFactor,
    width,
    height,
    fps,
    fitMode,
  });

  execRun("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-an",
    "-vf",
    filter,
    "-t",
    targetDuration.toFixed(6),
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    outputPath,
  ]);

  return {
    inputDuration,
    setptsFactor,
    stretchedDuration: getMediaDuration(outputPath),
  };
}

function muxVideoWithSong({ concatListPath, songPath, outputPath, fps }) {
  execRun("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListPath,
    "-i",
    songPath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(fps),
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-shortest",
    outputPath,
  ]);
}

async function main() {
  const { values } = parseArgs({
    options: {
      storyboard: { type: "string" },
      aligned: { type: "string" },
      song: { type: "string" },
      manifest: { type: "string" },
      "scenes-dir": { type: "string" },
      "work-dir": { type: "string" },
      output: { type: "string", short: "o" },
      width: { type: "string" },
      height: { type: "string" },
      fps: { type: "string" },
      "fit-mode": { type: "string" },
      "target-resolution": { type: "string" },
      "target-fps": { type: "string" },
      "poll-interval-ms": { type: "string" },
      "no-upscale": { type: "boolean" },
      "force-upscale": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
    allowPositionals: false,
  });

  if (values.help) {
    printUsage();
    return;
  }

  const storyboardPath = values.storyboard || DEFAULT_STORYBOARD_PATH;
  const alignedPath = values.aligned || DEFAULT_ALIGNED_PATH;
  const songPath = values.song || DEFAULT_SONG_PATH;
  const manifestPath = values.manifest || "";
  const scenesDir = values["scenes-dir"] || DEFAULT_SCENES_DIR;
  const workDir = values["work-dir"] || DEFAULT_WORK_DIR;
  const outputPath = values.output || buildDefaultOutputPath(songPath);
  const outputWidth = parsePositiveInteger(values.width, "--width", DEFAULT_OUTPUT_WIDTH);
  const outputHeight = parsePositiveInteger(values.height, "--height", DEFAULT_OUTPUT_HEIGHT);
  const fps = parseIntegerInRange(values.fps, "--fps", 1, 120, DEFAULT_FPS);
  const fitMode = parseFitMode(values["fit-mode"]);
  const targetResolution = parseTargetResolution(values["target-resolution"] || "1080p");
  const targetFps = parseIntegerInRange(
    values["target-fps"],
    "--target-fps",
    15,
    120,
    DEFAULT_TARGET_FPS
  );
  const pollIntervalMs = parseIntegerInRange(
    values["poll-interval-ms"],
    "--poll-interval-ms",
    100,
    60000,
    DEFAULT_POLL_INTERVAL_MS
  );
  const disableUpscale = values["no-upscale"] === true;
  const forceUpscale = values["force-upscale"] === true;

  await assertReadableFile(storyboardPath, "--storyboard");
  await assertReadableFile(alignedPath, "--aligned");
  await assertReadableFile(songPath, "--song");
  if (manifestPath) {
    await assertReadableFile(manifestPath, "--manifest");
  }

  const storyboard = await loadJsonFile(storyboardPath);
  const alignedLines = await loadJsonFile(alignedPath);
  const manifest = manifestPath ? await loadJsonFile(manifestPath) : null;
  const manifestOutputUrlMap = buildManifestOutputUrlMap(manifest);
  const songDuration = getMediaDuration(songPath);
  const scenes = Array.isArray(storyboard?.scenes) ? storyboard.scenes : [];

  const timings = computeSceneTimings({
    scenes,
    alignedLines,
    songDuration,
  });

  const upscaledDir = join(workDir, "upscaled");
  const stretchedDir = join(workDir, "stretched");
  const concatPath = join(workDir, "scenes.concat.txt");
  const planPath = join(workDir, "compile-plan.json");

  await mkdir(upscaledDir, { recursive: true });
  await mkdir(stretchedDir, { recursive: true });
  await ensureParentDirectory(outputPath);

  const concatLines = [];
  const scenePlan = [];
  let apiToken = process.env.REPLICATE_API_TOKEN || "";

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const sceneId = resolveSceneId(scene, index);
    const sourcePath = join(scenesDir, `${sceneId}.mp4`);
    await assertReadableFile(sourcePath, `scene ${sceneId}`);

    const timing = timings[index];
    const originalDimensions = getVideoDimensions(sourcePath);
    let inputPathForStretch = sourcePath;
    let upscaledPath = null;

    const needsUpscale = shouldUpscale({
      width: originalDimensions.width,
      height: originalDimensions.height,
      targetWidth: outputWidth,
      targetHeight: outputHeight,
    });

    let upscaleInput = sourcePath;
    if (!disableUpscale && needsUpscale) {
      if (!apiToken) {
        throw new Error(
          `Scene ${sceneId} needs upscale but REPLICATE_API_TOKEN is not set`
        );
      }

      const manifestOutputUrl = manifestOutputUrlMap.get(String(sceneId));
      if (manifestOutputUrl) {
        upscaleInput = manifestOutputUrl;
      }

      upscaledPath = join(upscaledDir, `${sceneId}.mp4`);
      const canReuseUpscaled = !forceUpscale && (await fileExists(upscaledPath));
      if (canReuseUpscaled) {
        console.log(`Reusing upscaled scene ${sceneId}: ${upscaledPath}`);
      } else {
        console.log(
          `Upscaling scene ${sceneId} (${originalDimensions.width}x${originalDimensions.height}) -> ${targetResolution}`
        );
        try {
          await upscaleVideo({
            inputPath: upscaleInput,
            outputPath: upscaledPath,
            targetResolution,
            targetFps,
            pollIntervalMs,
            apiToken,
          });
        } catch (error) {
          if (upscaleInput !== sourcePath) {
            throw error;
          }
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(
            `Upscale failed for scene ${sceneId} with local file input. ` +
              `If this scene came from Replicate generation, rerun with --manifest <manifest.json> so upscale uses original scene URLs. ` +
              `Underlying error: ${message}`
          );
        }
      }
      inputPathForStretch = upscaledPath;
    }

    const stretchedPath = join(stretchedDir, `${sceneId}.mp4`);
    console.log(
      `Stretching scene ${sceneId} to ${timing.duration.toFixed(3)}s (${fitMode}, ${outputWidth}x${outputHeight})`
    );
    const stretchResult = stretchSceneToTarget({
      inputPath: inputPathForStretch,
      outputPath: stretchedPath,
      targetDuration: timing.duration,
      width: outputWidth,
      height: outputHeight,
      fps,
      fitMode,
    });

    const absoluteStretchedPath = resolve(stretchedPath);
    concatLines.push(`file '${absoluteStretchedPath.replace(/'/g, "'\\''")}'`);

    scenePlan.push({
      scene_id: sceneId,
      source_file: sourcePath,
      source_dimensions: originalDimensions,
      upscale_input: !disableUpscale && needsUpscale ? upscaleInput : null,
      upscaled_file: upscaledPath,
      stretch_input_file: inputPathForStretch,
      stretched_file: stretchedPath,
      timing,
      stretch: {
        input_duration: Number(stretchResult.inputDuration.toFixed(6)),
        setpts_factor: Number(stretchResult.setptsFactor.toFixed(9)),
        output_duration: Number(stretchResult.stretchedDuration.toFixed(6)),
      },
    });
  }

  await writeFile(concatPath, `${concatLines.join("\n")}\n`, "utf8");

  console.log(`Muxing ${scenePlan.length} scenes with song audio...`);
  muxVideoWithSong({
    concatListPath: concatPath,
    songPath,
    outputPath,
    fps,
  });

  const outputDuration = getMediaDuration(outputPath);
  const plan = {
    generated_at: new Date().toISOString(),
    storyboard: storyboardPath,
    aligned: alignedPath,
    song: songPath,
    manifest: manifestPath || null,
    scenes_dir: scenesDir,
    output: outputPath,
    output_settings: {
      width: outputWidth,
      height: outputHeight,
      fps,
      fit_mode: fitMode,
      upscale_enabled: !disableUpscale,
      upscale_target_resolution: targetResolution,
      upscale_target_fps: targetFps,
    },
    song_duration: Number(songDuration.toFixed(6)),
    output_duration: Number(outputDuration.toFixed(6)),
    scenes: scenePlan,
  };
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  console.log(`Saved final video: ${outputPath}`);
  console.log(`Saved compile plan: ${planPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

export {
  ALLOWED_FIT_MODES,
  DEFAULT_ALIGNED_PATH,
  DEFAULT_FIT_MODE,
  DEFAULT_FPS,
  DEFAULT_POLL_INTERVAL_MS,
  DEFAULT_OUTPUT_HEIGHT,
  DEFAULT_OUTPUT_WIDTH,
  DEFAULT_SCENES_DIR,
  DEFAULT_SONG_PATH,
  DEFAULT_STORYBOARD_PATH,
  DEFAULT_TARGET_FPS,
  DEFAULT_WORK_DIR,
  buildDefaultOutputPath,
  buildManifestOutputUrlMap,
  buildFrameFilter,
  computeSceneTimings,
  getMediaDuration,
  getVideoDimensions,
  main,
  muxVideoWithSong,
  parseFitMode,
  resolveSceneId,
  shouldUpscale,
  stretchSceneToTarget,
};
