import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

import { NextRequest, NextResponse } from "next/server";

import { resolveAssetPath } from "@/lib/assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

function badRequest(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function parseRange(rangeHeader: string, size: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/i);
  if (!match) {
    return null;
  }

  const startGroup = match[1];
  const endGroup = match[2];

  let start = 0;
  let end = size - 1;

  if (startGroup && endGroup) {
    start = Number.parseInt(startGroup, 10);
    end = Number.parseInt(endGroup, 10);
  } else if (startGroup) {
    start = Number.parseInt(startGroup, 10);
  } else if (endGroup) {
    const suffixLength = Number.parseInt(endGroup, 10);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }
    start = Math.max(size - suffixLength, 0);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || end >= size) {
    return null;
  }

  return { start, end };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ assetPath: string[] }> },
): Promise<NextResponse> {
  const params = await context.params;
  const rawSegments = params.assetPath;
  if (!Array.isArray(rawSegments) || rawSegments.length === 0) {
    return badRequest("Asset path is required.", 404);
  }

  const decodedSegments = rawSegments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });

  const absolutePath = resolveAssetPath(decodedSegments);
  if (!absolutePath) {
    return badRequest("Asset path is invalid.", 400);
  }

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    return badRequest("Asset not found.", 404);
  }

  if (!stat.isFile()) {
    return badRequest("Asset is not a file.", 400);
  }

  const totalSize = stat.size;
  const contentType = contentTypeFor(absolutePath);
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  };

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, totalSize);
    if (!range) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes */${totalSize}`,
        },
      });
    }

    const chunkSize = range.end - range.start + 1;
    const stream = createReadStream(absolutePath, {
      start: range.start,
      end: range.end,
    });

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${range.start}-${range.end}/${totalSize}`,
      },
    });
  }

  const stream = createReadStream(absolutePath);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      ...baseHeaders,
      "Content-Length": String(totalSize),
    },
  });
}
