#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, extname } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const CLI_SCRIPT_PATH = ".agents/skills/aligning-lyrics/scripts/align.js";
const DEFAULT_MODEL = "dashed/whisperx-subtitles-replicate";
const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const REPLICATE_FILES_URL = `${REPLICATE_API_BASE}/files`;
const DEFAULT_POLL_INTERVAL_MS = 1000;

const DEFAULT_APPROX_OUTPUT_PATH = "assets/approximate-lyric-segmentation.json";
const DEFAULT_JSON_OUTPUT_PATH = "assets/aligned_lyrics.json";
const DEFAULT_SRT_OUTPUT_PATH = "assets/subtitle.srt";
const DEFAULT_LRC_OUTPUT_PATH = "assets/subtitle.lrc";

const DEFAULT_MIN_SIMILARITY = 0.58;
const DEFAULT_HARD_FLOOR_SIMILARITY = 0.35;
const DEFAULT_DELETION_PENALTY = 1.0;
const DEFAULT_INSERTION_PENALTY = 0.8;
const DEFAULT_DEFAULT_WORD_DURATION = 0.28;
const DEFAULT_MIN_WORD_DURATION = 0.05;
const DEFAULT_PADDING_SECONDS = 0.05;
const DEFAULT_LINE_QUALITY_THRESHOLD = 0.3;
const DEFAULT_GLOBAL_QUALITY_THRESHOLD = 0.18;

const TERMINAL_PREDICTION_STATUSES = new Set(["succeeded", "failed", "canceled"]);

const APOSTROPHE_PATTERN = /[\u2018\u2019\u201a\u201b\u2032`´]/g;
const SECTION_LABEL_PATTERN = /^\[[^\]]+\]$/;

const CONTRACTION_NORMALIZATION_MAP = new Map([
  ["cannot", "cant"],
  ["wont", "willnot"],
  ["aint", "aint"],
  ["im", "im"],
  ["ive", "ive"],
  ["id", "id"],
  ["youre", "youre"],
  ["youve", "youve"],
  ["youll", "youll"],
  ["hes", "hes"],
  ["shes", "shes"],
  ["its", "its"],
  ["were", "were"],
  ["theyre", "theyre"],
  ["dont", "dont"],
  ["doesnt", "doesnt"],
  ["didnt", "didnt"],
  ["isnt", "isnt"],
  ["arent", "arent"],
  ["wasnt", "wasnt"],
  ["werent", "werent"],
  ["havent", "havent"],
  ["hasnt", "hasnt"],
  ["hadnt", "hadnt"],
  ["shouldnt", "shouldnt"],
  ["wouldnt", "wouldnt"],
  ["couldnt", "couldnt"],
  ["mustnt", "mustnt"],
]);

function printUsage() {
  console.log(`Usage:
  source .env && node ${CLI_SCRIPT_PATH} --audio <song.mp3> --lyrics <lyrics.txt> [--json] [--srt] [--lrc]

Required:
  --audio, -a                 Local audio file path (mp3/wav/m4a/flac/ogg)
  --lyrics, -l                Local lyrics text path (non-empty line per lyric line)

Output flags:
  --json                      Write aligned JSON output
  --srt                       Write SRT output
  --lrc                       Write LRC output

Output paths:
  --approx-output             Approximate WhisperX segments JSON (default: ${DEFAULT_APPROX_OUTPUT_PATH})
  --json-output               Aligned JSON output path (default: ${DEFAULT_JSON_OUTPUT_PATH})
  --srt-output                SRT output path (default: ${DEFAULT_SRT_OUTPUT_PATH})
  --lrc-output                LRC output path (default: ${DEFAULT_LRC_OUTPUT_PATH})

Replicate/model:
  --model                     Replicate model slug (default: ${DEFAULT_MODEL})
  --audio-input-key           Force model audio input key (for schema mismatches)
  --model-input-json          Extra model input JSON object, e.g. '{"language":"en"}'
  --poll-interval-ms          Poll interval in milliseconds (default: ${DEFAULT_POLL_INTERVAL_MS})

Normalization:
  --keep-section-labels       Keep lines like [Verse 1] in lyrics alignment
  --no-normalize-contractions Disable contraction normalization

Thresholds/timing:
  --min-similarity            Minimum token similarity to accept a matched pair (default: ${DEFAULT_MIN_SIMILARITY})
  --hard-floor-similarity     Similarity below this is strongly penalized in DP (default: ${DEFAULT_HARD_FLOOR_SIMILARITY})
  --deletion-penalty          Lyric-word deletion penalty in DP (default: ${DEFAULT_DELETION_PENALTY})
  --insertion-penalty         ASR-word insertion penalty in DP (default: ${DEFAULT_INSERTION_PENALTY})
  --default-word-duration     Default inferred word duration in seconds (default: ${DEFAULT_DEFAULT_WORD_DURATION})
  --min-word-duration         Minimum per-word duration in seconds (default: ${DEFAULT_MIN_WORD_DURATION})
  --padding-seconds           Padding used for edge inference in seconds (default: ${DEFAULT_PADDING_SECONDS})
  --line-quality-threshold    Low-confidence line threshold in [0,1] (default: ${DEFAULT_LINE_QUALITY_THRESHOLD})
  --global-quality-threshold  Low-confidence global threshold in [0,1] (default: ${DEFAULT_GLOBAL_QUALITY_THRESHOLD})

Other:
  --help, -h                  Show this help message
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
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  const mimeByExtension = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
    ".flac": "audio/flac",
    ".ogg": "audio/ogg",
    ".opus": "audio/opus",
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

function parseNumberOption(rawValue, optionName, { min = -Infinity, max = Infinity } = {}) {
  if (rawValue === undefined) {
    return undefined;
  }
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${optionName} must be a number`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${optionName} must be between ${min} and ${max}`);
  }
  return parsed;
}

function parseIntegerOption(rawValue, optionName, { min = 1, max = Infinity } = {}) {
  if (rawValue === undefined) {
    return undefined;
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

function parseJsonObjectOption(rawValue, optionName) {
  if (!rawValue) {
    return {};
  }
  let parsed;
  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${optionName} must be valid JSON: ${message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${optionName} must be a JSON object`);
  }
  return parsed;
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundTime(value, precision = 3) {
  return Number(value.toFixed(precision));
}

function normalizeContractionToken(token) {
  return CONTRACTION_NORMALIZATION_MAP.get(token) || token;
}

function normalizeWord(rawValue, { normalizeContractions }) {
  if (rawValue === null || rawValue === undefined) {
    return "";
  }

  let value = String(rawValue).trim();
  if (!value) {
    return "";
  }

  value = value.replace(APOSTROPHE_PATTERN, "'");
  value = value.toLowerCase();
  value = value.replace(/[^\p{L}\p{N}'\s]+/gu, " ");
  value = value.replace(/\s+/g, " ").trim();
  if (!value) {
    return "";
  }

  value = value.replace(/\s+/g, "");
  value = value.replace(/'/g, "");
  if (!value) {
    return "";
  }

  if (normalizeContractions) {
    value = normalizeContractionToken(value);
  }

  return value;
}

function splitRawWords(lineText) {
  return String(lineText)
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

async function loadLyricsLines(lyricsPath, { keepSectionLabels, normalizeContractions }) {
  const rawLyrics = await readFile(lyricsPath, "utf8");
  const sourceLines = rawLyrics.split(/\r?\n/);

  const lines = [];
  for (let sourceLineIndex = 0; sourceLineIndex < sourceLines.length; sourceLineIndex += 1) {
    const sourceLine = sourceLines[sourceLineIndex];
    const text = sourceLine.trim();
    if (!text) {
      continue;
    }
    if (!keepSectionLabels && SECTION_LABEL_PATTERN.test(text)) {
      continue;
    }

    const rawTokens = splitRawWords(text);
    const tokens = [];
    for (const rawToken of rawTokens) {
      const normalized = normalizeWord(rawToken, { normalizeContractions });
      if (!normalized) {
        continue;
      }
      tokens.push({
        raw: rawToken,
        normalized,
      });
    }

    if (tokens.length === 0) {
      continue;
    }

    lines.push({
      lineIndex: lines.length,
      sourceLineNumber: sourceLineIndex + 1,
      text,
      tokens,
    });
  }

  return lines;
}

function flattenLyricWords(lines) {
  const flatWords = [];
  for (const line of lines) {
    line.flatStartIndex = flatWords.length;
    for (let wordIndexInLine = 0; wordIndexInLine < line.tokens.length; wordIndexInLine += 1) {
      const token = line.tokens[wordIndexInLine];
      const flatWord = {
        flatIndex: flatWords.length,
        lineIndex: line.lineIndex,
        wordIndexInLine,
        raw: token.raw,
        normalized: token.normalized,
      };
      token.flatIndex = flatWord.flatIndex;
      flatWords.push(flatWord);
    }
    line.flatEndIndex = flatWords.length - 1;
  }
  return flatWords;
}

async function uploadFileToReplicate(filePath, apiToken) {
  let fileBuffer;
  try {
    fileBuffer = await readFile(filePath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read audio file "${filePath}": ${message}`);
  }

  const formData = new FormData();
  formData.append(
    "content",
    new Blob([fileBuffer], { type: getMimeType(filePath) }),
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
    throw new Error(`Error uploading audio file: ${await response.text()}`);
  }

  const payload = await response.json();
  const uploadedUrl = payload?.urls?.get;
  if (!uploadedUrl || typeof uploadedUrl !== "string") {
    throw new Error("Replicate file upload response missing urls.get");
  }

  return uploadedUrl;
}

async function fetchModelMetadata(modelId, apiToken) {
  const response = await fetch(`${REPLICATE_API_BASE}/models/${modelId}`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function deriveAudioInputKey({ forcedAudioInputKey, modelMetadata }) {
  if (forcedAudioInputKey && forcedAudioInputKey.trim()) {
    return forcedAudioInputKey.trim();
  }

  const properties =
    modelMetadata?.latest_version?.openapi_schema?.components?.schemas?.Input?.properties;
  if (!properties || typeof properties !== "object") {
    return "audio";
  }

  const keys = Object.keys(properties);
  if (keys.length === 0) {
    return "audio";
  }

  // First pass: key name itself contains "audio"
  for (const key of keys) {
    if (key.toLowerCase().includes("audio")) {
      return key;
    }
  }

  const knownCandidates = ["audio", "audio_file", "input_audio", "file", "media"];
  for (const candidate of knownCandidates) {
    if (Object.prototype.hasOwnProperty.call(properties, candidate)) {
      return candidate;
    }
  }

  if (keys.length === 1) {
    return keys[0];
  }

  return "audio";
}

async function createPredictionViaVersion({ versionId, input, apiToken }) {
  const response = await fetch(`${REPLICATE_API_BASE}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: versionId,
      input,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function createPredictionViaModel({ modelId, input, apiToken }) {
  const response = await fetch(`${REPLICATE_API_BASE}/models/${modelId}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function createPrediction({ modelId, versionId, input, apiToken }) {
  const errors = [];

  if (versionId) {
    try {
      return await createPredictionViaVersion({ versionId, input, apiToken });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`version endpoint error: ${message}`);
    }
  }

  try {
    return await createPredictionViaModel({ modelId, input, apiToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`model endpoint error: ${message}`);
  }

  throw new Error(`Failed to create prediction (${errors.join(" | ")})`);
}

async function pollPrediction({ prediction, apiToken, pollIntervalMs }) {
  let currentPrediction = prediction;
  let previousStatus = currentPrediction.status;

  while (!TERMINAL_PREDICTION_STATUSES.has(currentPrediction.status)) {
    await sleep(pollIntervalMs);

    const pollResponse = await fetch(currentPrediction.urls.get, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!pollResponse.ok) {
      throw new Error(`Error polling prediction: ${await pollResponse.text()}`);
    }

    currentPrediction = await pollResponse.json();
    if (currentPrediction.status !== previousStatus) {
      console.log(`Prediction status: ${currentPrediction.status}`);
      previousStatus = currentPrediction.status;
    }
  }

  if (currentPrediction.status === "failed") {
    throw new Error(`Prediction failed: ${currentPrediction.error || "unknown error"}`);
  }

  if (currentPrediction.status === "canceled") {
    throw new Error("Prediction canceled");
  }

  return currentPrediction;
}

async function fetchRemotePayload(url, apiToken) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Error downloading model output from "${url}": ${response.statusText}`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const text = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function normalizePredictionOutput(output, apiToken) {
  if (output === null || output === undefined) {
    return output;
  }

  if (typeof output === "string") {
    if (isHttpUrl(output)) {
      return fetchRemotePayload(output, apiToken);
    }
    try {
      return JSON.parse(output);
    } catch {
      return output;
    }
  }

  if (Array.isArray(output) && output.length > 0 && output.every((item) => typeof item === "string")) {
    const firstUrl = output.find((item) => isHttpUrl(item));
    if (firstUrl) {
      return fetchRemotePayload(firstUrl, apiToken);
    }
  }

  if (
    output &&
    typeof output === "object" &&
    typeof output.url === "string" &&
    isHttpUrl(output.url)
  ) {
    return fetchRemotePayload(output.url, apiToken);
  }

  return output;
}

function isWordObject(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.prototype.hasOwnProperty.call(value, "word");
}

function isSegmentObject(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  return (
    Object.prototype.hasOwnProperty.call(value, "words") ||
    Object.prototype.hasOwnProperty.call(value, "text") ||
    Object.prototype.hasOwnProperty.call(value, "start") ||
    Object.prototype.hasOwnProperty.call(value, "end")
  );
}

function findArrayDeep(payload, matcher, maxDepth = 8) {
  const queue = [{ value: payload, depth: 0 }];
  const seen = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    const { value, depth } = current;
    if (!value || depth > maxDepth) {
      continue;
    }

    if (typeof value === "object") {
      if (seen.has(value)) {
        continue;
      }
      seen.add(value);
    }

    if (Array.isArray(value)) {
      if (matcher(value)) {
        return value;
      }
      for (const item of value) {
        queue.push({ value: item, depth: depth + 1 });
      }
      continue;
    }

    if (typeof value === "object") {
      for (const nested of Object.values(value)) {
        queue.push({ value: nested, depth: depth + 1 });
      }
    }
  }

  return null;
}

function extractSegmentsFromOutput(payload) {
  if (Array.isArray(payload) && payload.length > 0 && payload.every((item) => isSegmentObject(item))) {
    return payload;
  }

  const segmentArray = findArrayDeep(
    payload,
    (candidateArray) =>
      candidateArray.length > 0 && candidateArray.every((item) => isSegmentObject(item))
  );
  if (segmentArray) {
    return segmentArray;
  }

  const wordsArray = findArrayDeep(
    payload,
    (candidateArray) => candidateArray.length > 0 && candidateArray.every((item) => isWordObject(item))
  );
  if (wordsArray) {
    const firstWordStart = toFiniteNumber(wordsArray[0].start) ?? 0;
    const lastWordEnd =
      toFiniteNumber(wordsArray[wordsArray.length - 1].end) ??
      firstWordStart + wordsArray.length * DEFAULT_DEFAULT_WORD_DURATION;
    return [
      {
        start: firstWordStart,
        end: lastWordEnd,
        text: wordsArray.map((item) => item.word).join(" "),
        words: wordsArray,
      },
    ];
  }

  return [];
}

function buildApproximateSegments(segments) {
  return segments.map((segment) => {
    const outputSegment = {};
    const start = toFiniteNumber(segment.start);
    const end = toFiniteNumber(segment.end);
    if (start !== null) {
      outputSegment.start = start;
    }
    if (end !== null) {
      outputSegment.end = end;
    }
    if (typeof segment.text === "string") {
      outputSegment.text = segment.text;
    }
    if (Array.isArray(segment.words)) {
      outputSegment.words = segment.words
        .map((word) => {
          if (!word || typeof word !== "object") {
            return null;
          }
          const wordValue =
            typeof word.word === "string"
              ? word.word
              : typeof word.text === "string"
                ? word.text
                : "";
          const wordStart = toFiniteNumber(word.start);
          const wordEnd = toFiniteNumber(word.end);
          const wordScore = toFiniteNumber(word.score);
          if (!wordValue && wordStart === null && wordEnd === null) {
            return null;
          }
          const outputWord = {};
          if (wordValue) {
            outputWord.word = wordValue;
          }
          if (wordStart !== null) {
            outputWord.start = wordStart;
          }
          if (wordEnd !== null) {
            outputWord.end = wordEnd;
          }
          if (wordScore !== null) {
            outputWord.score = wordScore;
          }
          return outputWord;
        })
        .filter(Boolean);
    }
    return outputSegment;
  });
}

function flattenRecognizedWords(
  segments,
  { normalizeContractions, defaultWordDuration, minWordDuration }
) {
  const recognizedWords = [];

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 1) {
    const segment = segments[segmentIndex];
    const segmentStart = toFiniteNumber(segment.start);
    const segmentEnd = toFiniteNumber(segment.end);

    if (Array.isArray(segment.words) && segment.words.length > 0) {
      const wordsInSegment = segment.words;
      for (let wordIndex = 0; wordIndex < wordsInSegment.length; wordIndex += 1) {
        const wordObject = wordsInSegment[wordIndex];
        const rawWord =
          typeof wordObject?.word === "string"
            ? wordObject.word
            : typeof wordObject?.text === "string"
              ? wordObject.text
              : "";
        const normalized = normalizeWord(rawWord, { normalizeContractions });
        if (!normalized) {
          continue;
        }

        let start = toFiniteNumber(wordObject?.start);
        let end = toFiniteNumber(wordObject?.end);

        if (start === null || end === null || end <= start) {
          if (
            segmentStart !== null &&
            segmentEnd !== null &&
            segmentEnd > segmentStart &&
            wordsInSegment.length > 0
          ) {
            const perWordDuration = (segmentEnd - segmentStart) / wordsInSegment.length;
            start = segmentStart + wordIndex * perWordDuration;
            end = segmentStart + (wordIndex + 1) * perWordDuration;
          } else if (start !== null && (end === null || end <= start)) {
            end = start + defaultWordDuration;
          } else if (end !== null && (start === null || end <= start)) {
            start = Math.max(0, end - defaultWordDuration);
          } else {
            continue;
          }
        }

        recognizedWords.push({
          raw: rawWord.trim() || normalized,
          normalized,
          start,
          end: Math.max(end, start + minWordDuration),
          score: toFiniteNumber(wordObject?.score),
          segmentIndex,
          wordIndexInSegment: wordIndex,
        });
      }
      continue;
    }

    if (
      typeof segment.text === "string" &&
      segmentStart !== null &&
      segmentEnd !== null &&
      segmentEnd > segmentStart
    ) {
      const tokens = splitRawWords(segment.text);
      if (tokens.length === 0) {
        continue;
      }
      const perWordDuration = (segmentEnd - segmentStart) / tokens.length;
      for (let wordIndex = 0; wordIndex < tokens.length; wordIndex += 1) {
        const rawWord = tokens[wordIndex];
        const normalized = normalizeWord(rawWord, { normalizeContractions });
        if (!normalized) {
          continue;
        }
        const start = segmentStart + wordIndex * perWordDuration;
        const end = segmentStart + (wordIndex + 1) * perWordDuration;
        recognizedWords.push({
          raw: rawWord,
          normalized,
          start,
          end: Math.max(end, start + minWordDuration),
          score: null,
          segmentIndex,
          wordIndexInSegment: wordIndex,
        });
      }
    }
  }

  recognizedWords.sort((left, right) => {
    if (left.start !== right.start) {
      return left.start - right.start;
    }
    return left.end - right.end;
  });

  for (let index = 0; index < recognizedWords.length; index += 1) {
    const word = recognizedWords[index];
    if (index > 0) {
      const previous = recognizedWords[index - 1];
      if (word.start < previous.end) {
        word.start = previous.end;
      }
      if (word.end <= word.start) {
        word.end = word.start + minWordDuration;
      }
    }
    word.index = index;
  }

  return recognizedWords;
}

function levenshteinDistance(a, b) {
  if (a === b) {
    return 0;
  }
  const lengthA = a.length;
  const lengthB = b.length;
  if (lengthA === 0) {
    return lengthB;
  }
  if (lengthB === 0) {
    return lengthA;
  }

  const previousRow = new Array(lengthB + 1);
  const currentRow = new Array(lengthB + 1);

  for (let j = 0; j <= lengthB; j += 1) {
    previousRow[j] = j;
  }

  for (let i = 1; i <= lengthA; i += 1) {
    currentRow[0] = i;
    const charA = a[i - 1];
    for (let j = 1; j <= lengthB; j += 1) {
      const charB = b[j - 1];
      const substitutionCost = charA === charB ? 0 : 1;
      currentRow[j] = Math.min(
        previousRow[j] + 1,
        currentRow[j - 1] + 1,
        previousRow[j - 1] + substitutionCost
      );
    }
    for (let j = 0; j <= lengthB; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[lengthB];
}

function tokenSimilarity(a, b, cache) {
  const cacheKey = `${a}\u0000${b}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  if (a === b) {
    cache.set(cacheKey, 1);
    return 1;
  }
  if (!a || !b) {
    cache.set(cacheKey, 0);
    return 0;
  }

  const maxLength = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  let similarity = Math.max(0, 1 - distance / maxLength);

  if (a.startsWith(b) || b.startsWith(a)) {
    similarity = Math.max(similarity, 0.75);
  }

  cache.set(cacheKey, similarity);
  return similarity;
}

function substitutionCost(similarity, options) {
  if (similarity >= 0.999) {
    return 0;
  }
  if (similarity < options.hardFloorSimilarity) {
    return options.deletionPenalty + options.insertionPenalty + 0.2;
  }
  return 1.05 - similarity;
}

function alignWordSequences(lyricWords, recognizedWords, options) {
  const lyricCount = lyricWords.length;
  const recognizedCount = recognizedWords.length;

  const dp = Array.from({ length: lyricCount + 1 }, () => new Float64Array(recognizedCount + 1));
  const trace = Array.from({ length: lyricCount + 1 }, () => new Uint8Array(recognizedCount + 1));
  const similarityCache = new Map();

  for (let i = 1; i <= lyricCount; i += 1) {
    dp[i][0] = dp[i - 1][0] + options.deletionPenalty;
    trace[i][0] = 2;
  }
  for (let j = 1; j <= recognizedCount; j += 1) {
    dp[0][j] = dp[0][j - 1] + options.insertionPenalty;
    trace[0][j] = 3;
  }

  for (let i = 1; i <= lyricCount; i += 1) {
    const lyricToken = lyricWords[i - 1].normalized;
    for (let j = 1; j <= recognizedCount; j += 1) {
      const recognizedToken = recognizedWords[j - 1].normalized;
      const similarity = tokenSimilarity(lyricToken, recognizedToken, similarityCache);

      const diagonalCost = dp[i - 1][j - 1] + substitutionCost(similarity, options);
      const upCost = dp[i - 1][j] + options.deletionPenalty;
      const leftCost = dp[i][j - 1] + options.insertionPenalty;

      let bestCost = diagonalCost;
      let bestDirection = 1;

      if (upCost < bestCost) {
        bestCost = upCost;
        bestDirection = 2;
      }
      if (leftCost < bestCost) {
        bestCost = leftCost;
        bestDirection = 3;
      }

      dp[i][j] = bestCost;
      trace[i][j] = bestDirection;
    }
  }

  const lyricToRecognizedIndex = new Array(lyricCount).fill(-1);
  const lyricToSimilarity = new Array(lyricCount).fill(0);

  let i = lyricCount;
  let j = recognizedCount;
  let matched = 0;
  let exactMatched = 0;
  let fuzzyMatched = 0;
  let unmatchedLyricWords = 0;

  while (i > 0 || j > 0) {
    const direction = trace[i][j];
    if (i > 0 && j > 0 && direction === 1) {
      const lyricIndex = i - 1;
      const recognizedIndex = j - 1;
      const similarity = tokenSimilarity(
        lyricWords[lyricIndex].normalized,
        recognizedWords[recognizedIndex].normalized,
        similarityCache
      );

      if (similarity >= options.minSimilarity) {
        lyricToRecognizedIndex[lyricIndex] = recognizedIndex;
        lyricToSimilarity[lyricIndex] = similarity;
        matched += 1;
        if (similarity >= 0.999) {
          exactMatched += 1;
        } else {
          fuzzyMatched += 1;
        }
      } else {
        unmatchedLyricWords += 1;
      }

      i -= 1;
      j -= 1;
      continue;
    }

    if (i > 0 && (direction === 2 || j === 0)) {
      unmatchedLyricWords += 1;
      i -= 1;
      continue;
    }

    if (j > 0 && (direction === 3 || i === 0)) {
      j -= 1;
      continue;
    }

    if (i > 0 && j > 0) {
      i -= 1;
      j -= 1;
    } else if (i > 0) {
      i -= 1;
    } else if (j > 0) {
      j -= 1;
    }
  }

  return {
    lyricToRecognizedIndex,
    lyricToSimilarity,
    stats: {
      matched,
      exactMatched,
      fuzzyMatched,
      unmatchedLyricWords,
      totalLyricWords: lyricCount,
      totalRecognizedWords: recognizedCount,
      score: dp[lyricCount][recognizedCount],
    },
  };
}

function reconstructWordTimings(lyricWords, recognizedWords, alignment, options) {
  const timedWords = lyricWords.map((word) => ({
    ...word,
    start: null,
    end: null,
    source: "unmatched",
    matchSimilarity: 0,
  }));

  for (let lyricIndex = 0; lyricIndex < lyricWords.length; lyricIndex += 1) {
    const recognizedIndex = alignment.lyricToRecognizedIndex[lyricIndex];
    if (recognizedIndex < 0) {
      continue;
    }
    const recognized = recognizedWords[recognizedIndex];
    if (!recognized) {
      continue;
    }
    timedWords[lyricIndex].start = recognized.start;
    timedWords[lyricIndex].end = recognized.end;
    timedWords[lyricIndex].source = "matched";
    timedWords[lyricIndex].matchSimilarity = alignment.lyricToSimilarity[lyricIndex];
  }

  if (timedWords.length === 0) {
    return timedWords;
  }

  let index = 0;
  while (index < timedWords.length) {
    if (timedWords[index].start !== null && timedWords[index].end !== null) {
      index += 1;
      continue;
    }

    const blockStart = index;
    while (
      index < timedWords.length &&
      (timedWords[index].start === null || timedWords[index].end === null)
    ) {
      index += 1;
    }
    const blockEnd = index - 1;

    const leftAnchorIndex = blockStart - 1;
    const rightAnchorIndex = index < timedWords.length ? index : -1;

    const leftAnchorEnd =
      leftAnchorIndex >= 0 ? toFiniteNumber(timedWords[leftAnchorIndex].end) : null;
    const rightAnchorStart =
      rightAnchorIndex >= 0 ? toFiniteNumber(timedWords[rightAnchorIndex].start) : null;

    const blockCount = blockEnd - blockStart + 1;

    if (
      leftAnchorEnd !== null &&
      rightAnchorStart !== null &&
      rightAnchorStart > leftAnchorEnd + options.minWordDuration
    ) {
      const span = rightAnchorStart - leftAnchorEnd;
      const perWordSpan = span / blockCount;
      for (let offset = 0; offset < blockCount; offset += 1) {
        const currentIndex = blockStart + offset;
        const start = leftAnchorEnd + offset * perWordSpan;
        const end = leftAnchorEnd + (offset + 1) * perWordSpan;
        timedWords[currentIndex].start = start;
        timedWords[currentIndex].end = Math.max(end, start + options.minWordDuration);
        timedWords[currentIndex].source = "interpolated";
      }
      continue;
    }

    if (leftAnchorEnd !== null) {
      let cursor = leftAnchorEnd + options.paddingSeconds;
      for (let currentIndex = blockStart; currentIndex <= blockEnd; currentIndex += 1) {
        timedWords[currentIndex].start = cursor;
        timedWords[currentIndex].end = cursor + options.defaultWordDuration;
        timedWords[currentIndex].source = "inferred";
        cursor = timedWords[currentIndex].end;
      }
      continue;
    }

    if (rightAnchorStart !== null) {
      let cursor = rightAnchorStart - options.paddingSeconds;
      for (let currentIndex = blockEnd; currentIndex >= blockStart; currentIndex -= 1) {
        timedWords[currentIndex].end = cursor;
        timedWords[currentIndex].start = cursor - options.defaultWordDuration;
        timedWords[currentIndex].source = "inferred";
        cursor = timedWords[currentIndex].start;
      }
      continue;
    }

    let cursor = 0;
    for (let currentIndex = blockStart; currentIndex <= blockEnd; currentIndex += 1) {
      timedWords[currentIndex].start = cursor;
      timedWords[currentIndex].end = cursor + options.defaultWordDuration;
      timedWords[currentIndex].source = "inferred";
      cursor = timedWords[currentIndex].end;
    }
  }

  const minimumStart = timedWords.reduce((acc, word) => Math.min(acc, word.start ?? acc), 0);
  if (minimumStart < 0) {
    for (const word of timedWords) {
      word.start -= minimumStart;
      word.end -= minimumStart;
    }
  }

  for (let i = 0; i < timedWords.length; i += 1) {
    const current = timedWords[i];
    if (current.start === null || current.end === null) {
      const previousEnd = i > 0 ? timedWords[i - 1].end : 0;
      current.start = previousEnd;
      current.end = previousEnd + options.defaultWordDuration;
      current.source = "inferred";
    }
    if (current.start < 0) {
      current.start = 0;
    }
    if (i > 0) {
      const previous = timedWords[i - 1];
      if (current.start < previous.end) {
        current.start = previous.end;
        if (current.source !== "matched") {
          current.source = "adjusted";
        }
      }
    }
    if (current.end <= current.start) {
      current.end = current.start + options.minWordDuration;
    }
  }

  return timedWords;
}

function distributeWordsEvenly(words, start, end, minWordDuration) {
  if (words.length === 0) {
    return;
  }
  const totalSpan = Math.max(end - start, words.length * minWordDuration);
  const perWord = totalSpan / words.length;
  for (let i = 0; i < words.length; i += 1) {
    const wordStart = start + i * perWord;
    const wordEnd = start + (i + 1) * perWord;
    words[i].start = wordStart;
    words[i].end = Math.max(wordEnd, wordStart + minWordDuration);
  }
}

function shiftWords(words, delta) {
  if (!Number.isFinite(delta) || delta === 0) {
    return;
  }
  for (const word of words) {
    word.start += delta;
    word.end += delta;
  }
}

function enforceWordMonotonicity(words, minWordDuration) {
  for (let i = 0; i < words.length; i += 1) {
    const current = words[i];
    const currentDuration = Math.max(minWordDuration, current.end - current.start);
    if (i > 0) {
      const previous = words[i - 1];
      if (current.start < previous.end) {
        current.start = previous.end;
      }
    }
    current.end = Math.max(current.end, current.start + currentDuration);
  }
}

function buildLineResults(lines, timedWords) {
  const lineResults = [];

  for (const line of lines) {
    const words = [];
    for (const token of line.tokens) {
      const timedWord = timedWords[token.flatIndex];
      if (!timedWord) {
        continue;
      }
      words.push({
        word: token.raw,
        start: timedWord.start,
        end: timedWord.end,
        matched: timedWord.source === "matched",
      });
    }

    if (words.length === 0) {
      continue;
    }

    const matchedWords = words.filter((word) => word.matched).length;
    const quality = matchedWords / words.length;

    lineResults.push({
      line_index: line.lineIndex,
      text: line.text,
      start: words[0].start,
      end: words[words.length - 1].end,
      words,
      _quality: quality,
      _matchedWords: matchedWords,
    });
  }

  return lineResults;
}

function computeTimelineRange(recognizedWords, lineResults, options) {
  if (recognizedWords.length > 0) {
    return {
      start: Math.max(0, recognizedWords[0].start),
      end: Math.max(
        recognizedWords[recognizedWords.length - 1].end,
        recognizedWords[0].start + options.minWordDuration
      ),
    };
  }

  if (lineResults.length > 0) {
    return {
      start: Math.max(0, lineResults[0].start),
      end: Math.max(
        lineResults[lineResults.length - 1].end,
        lineResults[0].start + options.minWordDuration
      ),
    };
  }

  return { start: 0, end: 0 };
}

function distributeLinesProportionally(lineResults, start, end, options) {
  if (lineResults.length === 0) {
    return;
  }

  const totalWords = lineResults.reduce(
    (sum, line) => sum + Math.max(1, line.words.length),
    0
  );
  const availableSpan = Math.max(
    end - start,
    totalWords * options.minWordDuration
  );

  let cursor = start;
  for (const line of lineResults) {
    const lineWeight = Math.max(1, line.words.length) / totalWords;
    const lineDuration = Math.max(
      availableSpan * lineWeight,
      line.words.length * options.minWordDuration
    );
    line.start = cursor;
    line.end = cursor + lineDuration;
    distributeWordsEvenly(line.words, line.start, line.end, options.minWordDuration);
    cursor = line.end;
  }
}

function applyLowQualityFallback(lineResults, options, timelineRange) {
  if (lineResults.length === 0) {
    return;
  }

  let index = 0;
  while (index < lineResults.length) {
    if (lineResults[index]._quality >= options.lineQualityThreshold) {
      index += 1;
      continue;
    }

    const blockStart = index;
    while (
      index < lineResults.length &&
      lineResults[index]._quality < options.lineQualityThreshold
    ) {
      index += 1;
    }
    const blockEnd = index - 1;

    const leftAnchor =
      blockStart > 0 ? lineResults[blockStart - 1].end : timelineRange.start;
    const rightAnchor =
      blockEnd + 1 < lineResults.length
        ? lineResults[blockEnd + 1].start
        : timelineRange.end;

    if (!Number.isFinite(leftAnchor) || !Number.isFinite(rightAnchor) || rightAnchor <= leftAnchor) {
      let cursor = Number.isFinite(leftAnchor) ? leftAnchor + options.paddingSeconds : timelineRange.start;
      for (let i = blockStart; i <= blockEnd; i += 1) {
        const line = lineResults[i];
        const fallbackDuration = Math.max(
          line.words.length * options.defaultWordDuration,
          line.words.length * options.minWordDuration
        );
        line.start = cursor;
        line.end = cursor + fallbackDuration;
        distributeWordsEvenly(line.words, line.start, line.end, options.minWordDuration);
        cursor = line.end;
      }
      continue;
    }

    const blockLines = lineResults.slice(blockStart, blockEnd + 1);
    const innerStart = leftAnchor + options.paddingSeconds;
    const innerEnd = Math.max(innerStart, rightAnchor - options.paddingSeconds);
    distributeLinesProportionally(blockLines, innerStart, innerEnd, options);
  }
}

function applyGlobalFallbackIfNeeded(lineResults, alignmentStats, options, timelineRange) {
  if (!alignmentStats || alignmentStats.totalLyricWords === 0) {
    return false;
  }

  const overallQuality = alignmentStats.matched / alignmentStats.totalLyricWords;
  if (overallQuality >= options.globalQualityThreshold) {
    return false;
  }

  console.warn(
    `Warning: low global alignment quality (${overallQuality.toFixed(3)}). Applying conservative proportional fallback.`
  );
  distributeLinesProportionally(lineResults, timelineRange.start, timelineRange.end, options);
  return true;
}

function enforceMonotonicLines(lineResults, options) {
  for (let i = 0; i < lineResults.length; i += 1) {
    const line = lineResults[i];
    if (line.words.length === 0) {
      continue;
    }

    enforceWordMonotonicity(line.words, options.minWordDuration);
    line.start = line.words[0].start;
    line.end = line.words[line.words.length - 1].end;

    if (i > 0 && line.start < lineResults[i - 1].end) {
      const delta = lineResults[i - 1].end - line.start;
      shiftWords(line.words, delta);
      line.start += delta;
      line.end += delta;
    }

    if (line.end <= line.start) {
      line.end = line.start + Math.max(options.minWordDuration, line.words.length * options.minWordDuration);
      distributeWordsEvenly(line.words, line.start, line.end, options.minWordDuration);
    }
  }
}

function toOutputLines(lineResults) {
  return lineResults.map((line) => ({
    line_index: line.line_index,
    text: line.text,
    start: roundTime(line.start),
    end: roundTime(line.end),
    words: line.words.map((word) => ({
      word: word.word,
      start: roundTime(word.start),
      end: roundTime(word.end),
    })),
  }));
}

function formatSrtTimestamp(secondsRaw) {
  const safeSeconds = Math.max(0, secondsRaw);
  const totalMilliseconds = Math.round(safeSeconds * 1000);

  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}

function buildSrt(lines) {
  const chunks = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const start = line.start;
    const end = line.end > line.start ? line.end : line.start + 0.2;
    chunks.push(
      `${i + 1}\n${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}\n${line.text}\n`
    );
  }
  return `${chunks.join("\n")}\n`;
}

function formatLrcTimestamp(secondsRaw) {
  const safeSeconds = Math.max(0, secondsRaw);
  const totalCentiseconds = Math.round(safeSeconds * 100);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(
    centiseconds
  ).padStart(2, "0")}`;
}

function buildLrc(lines) {
  return `${lines
    .map((line) => `[${formatLrcTimestamp(line.start)}]${line.text}`)
    .join("\n")}\n`;
}

async function writeJsonFile(filePath, data) {
  await ensureParentDirectory(filePath);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function writeTextFile(filePath, content) {
  await ensureParentDirectory(filePath);
  await writeFile(filePath, content, "utf8");
}

async function main() {
  const { values } = parseArgs({
    options: {
      audio: { type: "string", short: "a" },
      lyrics: { type: "string", short: "l" },
      model: { type: "string" },
      "audio-input-key": { type: "string" },
      "model-input-json": { type: "string" },
      "poll-interval-ms": { type: "string" },
      "keep-section-labels": { type: "boolean" },
      "normalize-contractions": { type: "boolean" },
      "min-similarity": { type: "string" },
      "hard-floor-similarity": { type: "string" },
      "deletion-penalty": { type: "string" },
      "insertion-penalty": { type: "string" },
      "default-word-duration": { type: "string" },
      "min-word-duration": { type: "string" },
      "padding-seconds": { type: "string" },
      "line-quality-threshold": { type: "string" },
      "global-quality-threshold": { type: "string" },
      json: { type: "boolean" },
      srt: { type: "boolean" },
      lrc: { type: "boolean" },
      "approx-output": { type: "string" },
      "json-output": { type: "string" },
      "srt-output": { type: "string" },
      "lrc-output": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowNegative: true,
  });

  if (values.help) {
    printUsage();
    return;
  }

  const audioPath = typeof values.audio === "string" ? values.audio.trim() : "";
  const lyricsPath = typeof values.lyrics === "string" ? values.lyrics.trim() : "";
  if (!audioPath) {
    throw new Error("--audio is required");
  }
  if (!lyricsPath) {
    throw new Error("--lyrics is required");
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  const modelId = typeof values.model === "string" && values.model.trim() ? values.model.trim() : DEFAULT_MODEL;
  const pollIntervalMs =
    parseIntegerOption(values["poll-interval-ms"], "--poll-interval-ms", {
      min: 200,
      max: 60000,
    }) ?? DEFAULT_POLL_INTERVAL_MS;

  const keepSectionLabels = values["keep-section-labels"] === true;
  const normalizeContractions = values["normalize-contractions"] !== false;
  const modelInputJson = parseJsonObjectOption(values["model-input-json"], "--model-input-json");

  const alignmentOptions = {
    minSimilarity:
      parseNumberOption(values["min-similarity"], "--min-similarity", {
        min: 0,
        max: 1,
      }) ?? DEFAULT_MIN_SIMILARITY,
    hardFloorSimilarity:
      parseNumberOption(values["hard-floor-similarity"], "--hard-floor-similarity", {
        min: 0,
        max: 1,
      }) ?? DEFAULT_HARD_FLOOR_SIMILARITY,
    deletionPenalty:
      parseNumberOption(values["deletion-penalty"], "--deletion-penalty", {
        min: 0.01,
        max: 10,
      }) ?? DEFAULT_DELETION_PENALTY,
    insertionPenalty:
      parseNumberOption(values["insertion-penalty"], "--insertion-penalty", {
        min: 0.01,
        max: 10,
      }) ?? DEFAULT_INSERTION_PENALTY,
    defaultWordDuration:
      parseNumberOption(values["default-word-duration"], "--default-word-duration", {
        min: 0.01,
        max: 5,
      }) ?? DEFAULT_DEFAULT_WORD_DURATION,
    minWordDuration:
      parseNumberOption(values["min-word-duration"], "--min-word-duration", {
        min: 0.005,
        max: 1,
      }) ?? DEFAULT_MIN_WORD_DURATION,
    paddingSeconds:
      parseNumberOption(values["padding-seconds"], "--padding-seconds", {
        min: 0,
        max: 1,
      }) ?? DEFAULT_PADDING_SECONDS,
    lineQualityThreshold:
      parseNumberOption(values["line-quality-threshold"], "--line-quality-threshold", {
        min: 0,
        max: 1,
      }) ?? DEFAULT_LINE_QUALITY_THRESHOLD,
    globalQualityThreshold:
      parseNumberOption(values["global-quality-threshold"], "--global-quality-threshold", {
        min: 0,
        max: 1,
      }) ?? DEFAULT_GLOBAL_QUALITY_THRESHOLD,
  };

  const approxOutputPath =
    typeof values["approx-output"] === "string" && values["approx-output"].trim()
      ? values["approx-output"].trim()
      : DEFAULT_APPROX_OUTPUT_PATH;
  const jsonOutputPath =
    typeof values["json-output"] === "string" && values["json-output"].trim()
      ? values["json-output"].trim()
      : DEFAULT_JSON_OUTPUT_PATH;
  const srtOutputPath =
    typeof values["srt-output"] === "string" && values["srt-output"].trim()
      ? values["srt-output"].trim()
      : DEFAULT_SRT_OUTPUT_PATH;
  const lrcOutputPath =
    typeof values["lrc-output"] === "string" && values["lrc-output"].trim()
      ? values["lrc-output"].trim()
      : DEFAULT_LRC_OUTPUT_PATH;

  const anyOutputFormatFlag = values.json === true || values.srt === true || values.lrc === true;
  const writeJson = anyOutputFormatFlag ? values.json === true : true;
  const writeSrt = values.srt === true;
  const writeLrc = values.lrc === true;

  console.log("[1/8] Reading inputs...");
  await assertReadableFile(audioPath, "--audio");
  await assertReadableFile(lyricsPath, "--lyrics");

  const lyricLines = await loadLyricsLines(lyricsPath, {
    keepSectionLabels,
    normalizeContractions,
  });
  if (lyricLines.length === 0) {
    throw new Error("No usable lyric lines found after filtering/normalization");
  }
  const lyricWords = flattenLyricWords(lyricLines);
  if (lyricWords.length === 0) {
    throw new Error("No usable lyric words found after normalization");
  }

  console.log(
    `Loaded ${lyricLines.length} lyric lines and ${lyricWords.length} lyric words from ${lyricsPath}`
  );

  console.log(`[2/8] Resolving Replicate model metadata (${modelId})...`);
  const modelMetadata = await fetchModelMetadata(modelId, apiToken);
  const versionId = modelMetadata?.latest_version?.id;
  if (!versionId) {
    console.warn("Warning: could not resolve latest model version; falling back to model predictions endpoint.");
  }
  const audioInputKey = deriveAudioInputKey({
    forcedAudioInputKey: values["audio-input-key"],
    modelMetadata,
  });
  console.log(`Using model audio input key: ${audioInputKey}`);

  console.log("[3/8] Uploading audio file to Replicate...");
  const uploadedAudioUrl = await uploadFileToReplicate(audioPath, apiToken);

  console.log("[4/8] Creating and running WhisperX prediction...");
  const predictionInput = {
    ...modelInputJson,
    [audioInputKey]: uploadedAudioUrl,
  };

  const initialPrediction = await createPrediction({
    modelId,
    versionId,
    input: predictionInput,
    apiToken,
  });
  const completedPrediction = TERMINAL_PREDICTION_STATUSES.has(initialPrediction.status)
    ? initialPrediction
    : await pollPrediction({
        prediction: initialPrediction,
        apiToken,
        pollIntervalMs,
      });

  console.log("[5/8] Extracting approximate word timestamps from model output...");
  const normalizedOutput = await normalizePredictionOutput(completedPrediction.output, apiToken);
  const extractedSegments = extractSegmentsFromOutput(normalizedOutput);
  if (extractedSegments.length === 0) {
    throw new Error("Unable to find segment/word data in model output");
  }
  const approximateSegments = buildApproximateSegments(extractedSegments);
  await writeJsonFile(approxOutputPath, approximateSegments);
  console.log(`Wrote approximate segmentation: ${approxOutputPath}`);

  const recognizedWords = flattenRecognizedWords(approximateSegments, {
    normalizeContractions,
    defaultWordDuration: alignmentOptions.defaultWordDuration,
    minWordDuration: alignmentOptions.minWordDuration,
  });
  if (recognizedWords.length === 0) {
    console.warn("Warning: no recognized words with timestamps found; using conservative fallback timing.");
  } else {
    console.log(`Extracted ${recognizedWords.length} recognized words from approximate segments`);
  }

  console.log("[6/8] Aligning recognized words to ground-truth lyric words...");
  const alignment =
    recognizedWords.length > 0
      ? alignWordSequences(lyricWords, recognizedWords, alignmentOptions)
      : {
          lyricToRecognizedIndex: new Array(lyricWords.length).fill(-1),
          lyricToSimilarity: new Array(lyricWords.length).fill(0),
          stats: {
            matched: 0,
            exactMatched: 0,
            fuzzyMatched: 0,
            unmatchedLyricWords: lyricWords.length,
            totalLyricWords: lyricWords.length,
            totalRecognizedWords: 0,
            score: 0,
          },
        };

  console.log(
    `Alignment summary: matched ${alignment.stats.matched}/${alignment.stats.totalLyricWords} lyric words ` +
      `(exact=${alignment.stats.exactMatched}, fuzzy=${alignment.stats.fuzzyMatched})`
  );

  console.log("[7/8] Reconstructing monotonic lyric-line timestamps...");
  const timedWords = reconstructWordTimings(lyricWords, recognizedWords, alignment, alignmentOptions);
  const lineResults = buildLineResults(lyricLines, timedWords);
  const timelineRange = computeTimelineRange(recognizedWords, lineResults, alignmentOptions);
  applyLowQualityFallback(lineResults, alignmentOptions, timelineRange);
  applyGlobalFallbackIfNeeded(lineResults, alignment.stats, alignmentOptions, timelineRange);
  enforceMonotonicLines(lineResults, alignmentOptions);

  const outputLines = toOutputLines(lineResults);

  console.log("[8/8] Writing requested output files...");
  if (writeJson) {
    await writeJsonFile(jsonOutputPath, outputLines);
    console.log(`Wrote aligned JSON: ${jsonOutputPath}`);
  }
  if (writeSrt) {
    await writeTextFile(srtOutputPath, buildSrt(outputLines));
    console.log(`Wrote SRT: ${srtOutputPath}`);
  }
  if (writeLrc) {
    await writeTextFile(lrcOutputPath, buildLrc(outputLines));
    console.log(`Wrote LRC: ${lrcOutputPath}`);
  }

  console.log("Done.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  });
}

export {
  alignWordSequences,
  buildApproximateSegments,
  buildLrc,
  buildSrt,
  deriveAudioInputKey,
  distributeLinesProportionally,
  flattenRecognizedWords,
  loadLyricsLines,
  normalizeWord,
  reconstructWordTimings,
  tokenSimilarity,
};
