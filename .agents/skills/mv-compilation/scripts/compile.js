#!/usr/bin/env node

const { access, mkdir, readFile, writeFile } = require("node:fs/promises");
const { constants } = require("node:fs");
const { basename, dirname, extname, join, resolve } = require("node:path");
const { execFileSync } = require("node:child_process");
const { parseArgs } = require("node:util");

const CLI_SCRIPT_PATH = ".agents/skills/mv-compilation/scripts/compile.js";
const DEFAULT_STORYBOARD_PATH = "assets/storyboard.json";
const DEFAULT_ALIGNED_PATH = "assets/aligned_lyrics.json";
const DEFAULT_SONG_PATH = "assets/song.mp3";
const DEFAULT_SCENES_DIR = "assets/scenes";
const DEFAULT_WORK_DIR = "assets/final/build-compile";
const DEFAULT_OUTPUT_DIR = "assets/final";
const DEFAULT_OUTPUT_WIDTH = 1920;
const DEFAULT_OUTPUT_HEIGHT = 1080;
const DEFAULT_FPS = 24;
const DEFAULT_FIT_MODE = "fill-crop";
const ALLOWED_FIT_MODES = new Set(["fill-crop", "contain"]);

function printUsage() {
  console.log(`Usage:
  pnpm exec dotenv -- node ${CLI_SCRIPT_PATH} [options]

Options:
  --storyboard            Storyboard JSON path (default: ${DEFAULT_STORYBOARD_PATH})
  --aligned               Aligned lyric JSON path (default: ${DEFAULT_ALIGNED_PATH})
  --song                  Song audio path (default: ${DEFAULT_SONG_PATH})
  --scenes-dir            Scene clips directory (default: ${DEFAULT_SCENES_DIR})
  --work-dir              Working directory for intermediates (default: ${DEFAULT_WORK_DIR})
  --output, -o            Final output mp4 path (default: assets/final/<song>.full-song.1080p.mp4)
  --width                 Output width (default: ${DEFAULT_OUTPUT_WIDTH})
  --height                Output height (default: ${DEFAULT_OUTPUT_HEIGHT})
  --fps                   Output fps (default: ${DEFAULT_FPS})
  --fit-mode              Frame fit mode: fill-crop | contain (default: ${DEFAULT_FIT_MODE})
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
      "scenes-dir": { type: "string" },
      "work-dir": { type: "string" },
      output: { type: "string", short: "o" },
      width: { type: "string" },
      height: { type: "string" },
      fps: { type: "string" },
      "fit-mode": { type: "string" },
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
  const scenesDir = values["scenes-dir"] || DEFAULT_SCENES_DIR;
  const workDir = values["work-dir"] || DEFAULT_WORK_DIR;
  const outputPath = values.output || buildDefaultOutputPath(songPath);
  const outputWidth = parsePositiveInteger(values.width, "--width", DEFAULT_OUTPUT_WIDTH);
  const outputHeight = parsePositiveInteger(values.height, "--height", DEFAULT_OUTPUT_HEIGHT);
  const fps = parseIntegerInRange(values.fps, "--fps", 1, 120, DEFAULT_FPS);
  const fitMode = parseFitMode(values["fit-mode"]);

  await assertReadableFile(storyboardPath, "--storyboard");
  await assertReadableFile(alignedPath, "--aligned");
  await assertReadableFile(songPath, "--song");

  const storyboard = await loadJsonFile(storyboardPath);
  const alignedLines = await loadJsonFile(alignedPath);
  const songDuration = getMediaDuration(songPath);
  const scenes = Array.isArray(storyboard?.scenes) ? storyboard.scenes : [];

  const timings = computeSceneTimings({
    scenes,
    alignedLines,
    songDuration,
  });

  const stretchedDir = join(workDir, "stretched");
  const concatPath = join(workDir, "scenes.concat.txt");
  const planPath = join(workDir, "compile-plan.json");

  await mkdir(stretchedDir, { recursive: true });
  await ensureParentDirectory(outputPath);

  const concatLines = [];
  const scenePlan = [];

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const sceneId = resolveSceneId(scene, index);
    const sourcePath = join(scenesDir, `${sceneId}.mp4`);
    await assertReadableFile(sourcePath, `scene ${sceneId}`);

    const timing = timings[index];
    const stretchedPath = join(stretchedDir, `${sceneId}.mp4`);
    console.log(
      `Stretching scene ${sceneId} to ${timing.duration.toFixed(3)}s (${fitMode}, ${outputWidth}x${outputHeight})`
    );
    const stretchResult = stretchSceneToTarget({
      inputPath: sourcePath,
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
    scenes_dir: scenesDir,
    output: outputPath,
    output_settings: {
      width: outputWidth,
      height: outputHeight,
      fps,
      fit_mode: fitMode,
    },
    song_duration: Number(songDuration.toFixed(6)),
    output_duration: Number(outputDuration.toFixed(6)),
    scenes: scenePlan,
  };
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  console.log(`Saved final video: ${outputPath}`);
  console.log(`Saved compile plan: ${planPath}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

module.exports = {
  ALLOWED_FIT_MODES,
  DEFAULT_ALIGNED_PATH,
  DEFAULT_FIT_MODE,
  DEFAULT_FPS,
  DEFAULT_OUTPUT_HEIGHT,
  DEFAULT_OUTPUT_WIDTH,
  DEFAULT_SCENES_DIR,
  DEFAULT_SONG_PATH,
  DEFAULT_STORYBOARD_PATH,
  DEFAULT_WORK_DIR,
  buildDefaultOutputPath,
  buildFrameFilter,
  computeSceneTimings,
  getMediaDuration,
  main,
  muxVideoWithSong,
  parseFitMode,
  resolveSceneId,
  stretchSceneToTarget,
};
