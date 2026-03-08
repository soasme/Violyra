import { promises as fs } from "node:fs";
import path from "node:path";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".m4v"]);
const SUBTITLE_EXTENSIONS = new Set([".srt", ".lrc"]);

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const REPO_ROOT = path.resolve(process.cwd(), "../..");
export const ASSETS_ROOT = path.join(REPO_ROOT, "assets");

export interface MediaAsset {
  name: string;
  relativePath: string;
  sceneId: number | null;
  sizeBytes: number;
  modifiedAt: string;
}

export interface VideoCollection {
  name: string;
  relativePath: string;
  videos: MediaAsset[];
}

export interface StoryboardSceneSummary {
  sceneId: number | null;
  section: string | null;
  character: string | null;
  duration: number | null;
  lyrics: string[];
  prompt: string | null;
  videoFile: string | null;
}

export interface StoryboardDocument {
  fileName: string;
  relativePath: string;
  model: string | null;
  songTitle: string | null;
  generatedAt: string | null;
  scenesDir: string | null;
  sceneCount: number;
  scenes: StoryboardSceneSummary[];
  parseError: string | null;
}

export interface SrtCue {
  index: number;
  start: string;
  end: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface LrcCue {
  line: number;
  timestamp: string;
  seconds: number;
  text: string;
}

export interface AlignedLyricLine {
  lineIndex: number | null;
  start: number | null;
  end: number | null;
  text: string;
  wordCount: number;
}

export interface ApproximateLyricSegment {
  start: number | null;
  end: number | null;
  text: string;
  wordCount: number;
}

export interface AssetTotals {
  files: number;
  videos: number;
  audios: number;
  subtitles: number;
  json: number;
}

export interface AssetsSnapshot {
  generatedAt: string;
  totals: AssetTotals;
  storyboardDocs: StoryboardDocument[];
  videoCollections: VideoCollection[];
  audioFiles: MediaAsset[];
  subtitleSrt: {
    filePath: string | null;
    cues: SrtCue[];
    raw: string | null;
  };
  subtitleLrc: {
    filePath: string | null;
    cues: LrcCue[];
    raw: string | null;
  };
  lyricsText: string[];
  alignedLyrics: AlignedLyricLine[];
  approximateSegments: ApproximateLyricSegment[];
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sceneIdFromName(name: string): number | null {
  const match = name.match(/^(\d+)$/);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function normalizeRelativePath(input: string): string {
  return toPosixPath(input.replace(/^assets[\/]/, "").replace(/^\/+/, ""));
}

function parseSrtTimestamp(value: string): number {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!match) {
    return 0;
  }
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const seconds = Number.parseInt(match[3], 10);
  const milliseconds = Number.parseInt(match[4].padEnd(3, "0"), 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

export function parseSrt(raw: string): SrtCue[] {
  const blocks = raw
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim());
    if (lines.length < 2) {
      continue;
    }

    let cursor = 0;
    let index = Number.parseInt(lines[cursor], 10);
    if (!Number.isFinite(index)) {
      index = cues.length + 1;
    } else {
      cursor += 1;
    }

    const timing = lines[cursor] ?? "";
    cursor += 1;
    const timingMatch = timing.match(/^(.+?)\s*-->\s*(.+)$/);
    if (!timingMatch) {
      continue;
    }

    const start = timingMatch[1].trim();
    const end = timingMatch[2].trim();
    const text = lines.slice(cursor).join(" ").trim();

    cues.push({
      index,
      start,
      end,
      startSeconds: parseSrtTimestamp(start),
      endSeconds: parseSrtTimestamp(end),
      text,
    });
  }

  return cues;
}

export function parseLrc(raw: string): LrcCue[] {
  const lines = raw.replace(/\r/g, "").split("\n");
  const cues: LrcCue[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    const match = line.match(/^\[(\d{2}):(\d{2})(?:[.:](\d{1,3}))?\](.*)$/);
    if (!match) {
      continue;
    }

    const minutes = Number.parseInt(match[1], 10);
    const seconds = Number.parseInt(match[2], 10);
    const fraction = match[3] ? Number.parseInt(match[3].padEnd(3, "0"), 10) : 0;

    cues.push({
      line: i + 1,
      timestamp: `${match[1]}:${match[2]}.${match[3] ?? "000"}`,
      seconds: minutes * 60 + seconds + fraction / 1000,
      text: match[4].trim(),
    });
  }

  return cues;
}

export function mediaUrl(relativePath: string): string {
  return `/api/media/${relativePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export function resolveAssetPath(segments: string[]): string | null {
  const resolved = path.resolve(ASSETS_ROOT, ...segments);
  if (resolved === ASSETS_ROOT) {
    return resolved;
  }

  const prefix = `${ASSETS_ROOT}${path.sep}`;
  return resolved.startsWith(prefix) ? resolved : null;
}

async function fileStat(relativePath: string): Promise<MediaAsset | null> {
  try {
    const absolutePath = path.join(ASSETS_ROOT, relativePath);
    const stat = await fs.stat(absolutePath);
    const parsed = path.parse(relativePath);
    return {
      name: parsed.base,
      relativePath: toPosixPath(relativePath),
      sceneId: sceneIdFromName(parsed.name),
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

async function walkFiles(currentDirectory: string): Promise<string[]> {
  const entries = await fs.readdir(currentDirectory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(currentDirectory, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkFiles(absolutePath);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    files.push(toPosixPath(path.relative(ASSETS_ROOT, absolutePath)));
  }

  return files;
}

function parseStoryboardScene(rawScene: unknown): StoryboardSceneSummary {
  const scene = asRecord(rawScene);
  if (!scene) {
    return {
      sceneId: null,
      section: null,
      character: null,
      duration: null,
      lyrics: [],
      prompt: null,
      videoFile: null,
    };
  }

  const lyrics = Array.isArray(scene.lyrics)
    ? scene.lyrics.filter((item): item is string => typeof item === "string")
    : [];

  return {
    sceneId: asNumber(scene.scene_id),
    section: asString(scene.section),
    character: asString(scene.character),
    duration: asNumber(scene.duration),
    lyrics,
    prompt: asString(scene.prompt),
    videoFile: asString(scene.video_file),
  };
}

async function readJsonFile(relativePath: string): Promise<unknown | null> {
  try {
    const content = await fs.readFile(path.join(ASSETS_ROOT, relativePath), "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function collectStoryboards(jsonFiles: string[]): Promise<StoryboardDocument[]> {
  const storyboardFiles = jsonFiles
    .filter((file) => /^storyboard.*\.json$/i.test(path.basename(file)))
    .sort((a, b) => {
      if (a === "storyboard.json") {
        return -1;
      }
      if (b === "storyboard.json") {
        return 1;
      }
      return collator.compare(a, b);
    });

  const result: StoryboardDocument[] = [];

  for (const relativePath of storyboardFiles) {
    const parsed = await readJsonFile(relativePath);
    const record = asRecord(parsed);

    if (!record) {
      result.push({
        fileName: path.basename(relativePath),
        relativePath,
        model: null,
        songTitle: null,
        generatedAt: null,
        scenesDir: null,
        sceneCount: 0,
        scenes: [],
        parseError: "Unable to parse JSON",
      });
      continue;
    }

    const scenes = Array.isArray(record.scenes)
      ? record.scenes.map((scene) => parseStoryboardScene(scene))
      : [];
    const scenesDirValue = asString(record.scenes_dir);

    const sceneCount = scenes.length > 0 ? scenes.length : asNumber(record.scene_count) ?? 0;

    result.push({
      fileName: path.basename(relativePath),
      relativePath,
      model: asString(record.model),
      songTitle: asString(record.song_title),
      generatedAt: asString(record.generated_at),
      scenesDir: scenesDirValue ? normalizeRelativePath(scenesDirValue) : null,
      sceneCount,
      scenes,
      parseError: null,
    });
  }

  return result;
}

async function collectVideoCollections(videoFiles: string[]): Promise<VideoCollection[]> {
  const grouped = new Map<string, string[]>();

  for (const relativePath of videoFiles) {
    const dir = path.posix.dirname(relativePath);
    const key = dir === "." ? "" : dir;
    const existing = grouped.get(key) ?? [];
    existing.push(relativePath);
    grouped.set(key, existing);
  }

  const collections: VideoCollection[] = [];

  for (const [relativePath, files] of grouped.entries()) {
    const videos: MediaAsset[] = [];

    const sortedFiles = [...files].sort((a, b) => collator.compare(a, b));
    for (const file of sortedFiles) {
      const stat = await fileStat(file);
      if (stat) {
        videos.push(stat);
      }
    }

    collections.push({
      name: relativePath ? path.posix.basename(relativePath) : "assets",
      relativePath,
      videos,
    });
  }

  collections.sort((a, b) => collator.compare(a.relativePath, b.relativePath));
  return collections;
}

async function collectAudioFiles(audioPaths: string[]): Promise<MediaAsset[]> {
  const assets = await Promise.all(audioPaths.map((relativePath) => fileStat(relativePath)));
  return assets
    .filter((asset): asset is MediaAsset => asset !== null)
    .sort((a, b) => collator.compare(a.relativePath, b.relativePath));
}

async function readOptionalText(relativePath: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(ASSETS_ROOT, relativePath), "utf8");
  } catch {
    return null;
  }
}

async function loadAlignedLyrics(): Promise<AlignedLyricLine[]> {
  const json = await readJsonFile("aligned_lyrics.json");
  if (!Array.isArray(json)) {
    return [];
  }

  return json
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .map((entry) => {
      const words = Array.isArray(entry.words) ? entry.words : [];
      return {
        lineIndex: asNumber(entry.line_index),
        start: asNumber(entry.start),
        end: asNumber(entry.end),
        text: asString(entry.text) ?? "",
        wordCount: words.length,
      };
    });
}

async function loadApproximateSegments(): Promise<ApproximateLyricSegment[]> {
  const json = await readJsonFile("approximate-lyric-segmentation.json");
  if (!Array.isArray(json)) {
    return [];
  }

  return json
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null)
    .map((entry) => {
      const words = Array.isArray(entry.words) ? entry.words : [];
      return {
        start: asNumber(entry.start),
        end: asNumber(entry.end),
        text: asString(entry.text) ?? "",
        wordCount: words.length,
      };
    });
}

export async function loadAssetsSnapshot(): Promise<AssetsSnapshot> {
  const allFiles = await walkFiles(ASSETS_ROOT);

  const totals: AssetTotals = {
    files: allFiles.length,
    videos: 0,
    audios: 0,
    subtitles: 0,
    json: 0,
  };

  const jsonFiles: string[] = [];
  const videoFiles: string[] = [];
  const audioFiles: string[] = [];

  for (const relativePath of allFiles) {
    const ext = path.extname(relativePath).toLowerCase();

    if (ext === ".json") {
      totals.json += 1;
      jsonFiles.push(relativePath);
    }

    if (VIDEO_EXTENSIONS.has(ext)) {
      totals.videos += 1;
      videoFiles.push(relativePath);
    }

    if (AUDIO_EXTENSIONS.has(ext)) {
      totals.audios += 1;
      audioFiles.push(relativePath);
    }

    if (SUBTITLE_EXTENSIONS.has(ext)) {
      totals.subtitles += 1;
    }
  }

  const [storyboardDocs, videoCollections, audioAssetFiles, subtitleSrtRaw, subtitleLrcRaw, lyricsText, alignedLyrics, approximateSegments] =
    await Promise.all([
      collectStoryboards(jsonFiles),
      collectVideoCollections(videoFiles),
      collectAudioFiles(audioFiles),
      readOptionalText("subtitle.srt"),
      readOptionalText("subtitle.lrc"),
      readOptionalText("lyrics.txt"),
      loadAlignedLyrics(),
      loadApproximateSegments(),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    totals,
    storyboardDocs,
    videoCollections,
    audioFiles: audioAssetFiles,
    subtitleSrt: {
      filePath: subtitleSrtRaw ? "subtitle.srt" : null,
      cues: subtitleSrtRaw ? parseSrt(subtitleSrtRaw) : [],
      raw: subtitleSrtRaw,
    },
    subtitleLrc: {
      filePath: subtitleLrcRaw ? "subtitle.lrc" : null,
      cues: subtitleLrcRaw ? parseLrc(subtitleLrcRaw) : [],
      raw: subtitleLrcRaw,
    },
    lyricsText: lyricsText ? lyricsText.split(/\r?\n/).filter(Boolean) : [],
    alignedLyrics,
    approximateSegments,
  };
}
