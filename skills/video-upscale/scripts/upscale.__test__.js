import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

const {
  ALLOWED_TARGET_RESOLUTIONS,
  DEFAULT_TARGET_FPS,
  MODEL_PREDICTIONS_URL,
  REPLICATE_FILES_URL,
  buildDefaultOutputPath,
  createPrediction,
  extractOutputUrl,
  parseIntegerInRange,
  parseTargetResolution,
  resolveVideoInput,
  upscaleVideo,
  waitForPrediction,
} = require("./upscale.js");

describe(".agents/skills/video-upscale/scripts/upscale.js", () => {
  describe("parseTargetResolution", () => {
    it("accepts supported target resolutions", () => {
      for (const value of ALLOWED_TARGET_RESOLUTIONS) {
        expect(parseTargetResolution(value)).toBe(value);
      }
    });

    it("throws on unsupported target resolution", () => {
      expect(() => parseTargetResolution("2k")).toThrow(
        "--target-resolution must be one of: 720p | 1080p | 4k"
      );
    });
  });

  describe("parseIntegerInRange", () => {
    it("returns fallback when value is missing", () => {
      expect(parseIntegerInRange(undefined, "--target-fps", 15, 120, DEFAULT_TARGET_FPS)).toBe(24);
    });

    it("throws on out-of-range values", () => {
      expect(() => parseIntegerInRange("121", "--target-fps", 15, 120, 24)).toThrow(
        "--target-fps must be between 15 and 120"
      );
    });
  });

  describe("buildDefaultOutputPath", () => {
    it("derives output path from local input path", () => {
      expect(buildDefaultOutputPath("assets/scenes/1.mp4")).toBe(
        "assets/scenes/1.upscaled.mp4"
      );
    });

    it("uses default output path for remote input", () => {
      expect(buildDefaultOutputPath("https://example.com/clip.mp4")).toBe(
        "assets/upscaled.mp4"
      );
    });
  });

  describe("extractOutputUrl", () => {
    it("extracts output URL from supported output types", () => {
      expect(extractOutputUrl("https://example.com/clip.mp4")).toBe(
        "https://example.com/clip.mp4"
      );
      expect(extractOutputUrl(["https://example.com/clip.mp4"])).toBe(
        "https://example.com/clip.mp4"
      );
      expect(extractOutputUrl({ url: "https://example.com/clip.mp4" })).toBe(
        "https://example.com/clip.mp4"
      );
      expect(extractOutputUrl({})).toBeNull();
    });
  });

  describe("createPrediction", () => {
    it("posts input to topazlabs/video-upscale predictions endpoint", async () => {
      const previousFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pred_1",
          status: "succeeded",
          output: "https://example.com/upscaled.mp4",
        }),
      });
      global.fetch = fetchMock;

      try {
        const prediction = await createPrediction({
          input: {
            video: "https://example.com/input.mp4",
            target_resolution: "1080p",
            target_fps: 24,
          },
          apiToken: "token-abc",
        });

        expect(prediction.id).toBe("pred_1");
        expect(fetchMock).toHaveBeenCalledWith(
          MODEL_PREDICTIONS_URL,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer token-abc",
              "Content-Type": "application/json",
              Prefer: "wait",
            }),
          })
        );
      } finally {
        global.fetch = previousFetch;
      }
    });
  });

  describe("resolveVideoInput", () => {
    it("returns remote URL unchanged", async () => {
      await expect(
        resolveVideoInput("https://example.com/input.mp4", "token")
      ).resolves.toBe("https://example.com/input.mp4");
    });

    it("uploads local file to Replicate files API", async () => {
      const dir = await mkdtemp(join(tmpdir(), "video-upscale-upload-"));
      const inputPath = join(dir, "scene.mp4");
      await writeFile(inputPath, Buffer.from([0, 1, 2]));

      const previousFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          urls: { get: "https://delivery.replicate.com/abc123.mp4" },
        }),
      });
      global.fetch = fetchMock;

      try {
        const resolved = await resolveVideoInput(inputPath, "token-abc");
        expect(resolved).toBe("https://delivery.replicate.com/abc123.mp4");
        expect(fetchMock).toHaveBeenCalledWith(
          REPLICATE_FILES_URL,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer token-abc",
            }),
            body: expect.any(FormData),
          })
        );
      } finally {
        global.fetch = previousFetch;
      }
    });
  });

  describe("waitForPrediction", () => {
    it("polls until prediction reaches terminal status", async () => {
      const previousFetch = global.fetch;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "processing",
            output: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "succeeded",
            output: "https://example.com/upscaled.mp4",
          }),
        });
      global.fetch = fetchMock;

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        const prediction = await waitForPrediction(
          "https://example.com/predictions/pred_1",
          "token-xyz",
          1
        );
        expect(prediction.status).toBe("succeeded");
        expect(fetchMock).toHaveBeenCalledTimes(2);
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
      }
    });
  });

  describe("upscaleVideo", () => {
    it("runs prediction and downloads output video", async () => {
      const dir = await mkdtemp(join(tmpdir(), "video-upscale-run-"));
      const inputPath = join(dir, "scene.mp4");
      const outputPath = join(dir, "scene.upscaled.mp4");
      await writeFile(inputPath, Buffer.from([1, 2, 3]));
      const downloadedBytes = Uint8Array.from([0, 0, 0, 32, 102, 116, 121, 112]);

      const previousFetch = global.fetch;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            urls: { get: "https://delivery.replicate.com/input.mp4" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "succeeded",
            output: "https://delivery.replicate.com/output.mp4",
            completed_at: "2026-03-08T00:00:00Z",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => downloadedBytes.buffer,
        });
      global.fetch = fetchMock;

      try {
        const result = await upscaleVideo({
          inputPath,
          outputPath,
          targetResolution: "1080p",
          targetFps: 24,
          pollIntervalMs: 1,
          apiToken: "token",
        });

        expect(result.outputPath).toBe(outputPath);
        expect(result.outputUrl).toBe("https://delivery.replicate.com/output.mp4");
        expect(result.prediction.id).toBe("pred_1");
      } finally {
        global.fetch = previousFetch;
      }
    });
  });
});

