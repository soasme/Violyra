import { describe, expect, it, vi } from "vitest";
import {
  ALLOWED_ASPECT_RATIOS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_RESOLUTION,
  DEFAULT_SAFETY_FILTER_LEVEL,
  MODEL_PREDICTIONS_URL,
  buildModelInputOptions,
  createPrediction,
  extractOutputUrl,
  parseImageInputs,
  resolveImageInput,
} from "./generate.js";

describe(".agents/skills/youtube-thumbnail-generator/scripts/generate.js", () => {
  describe("parseImageInputs", () => {
    it("returns empty array when image is omitted", () => {
      expect(parseImageInputs(undefined)).toEqual([]);
    });

    it("supports repeated flags and comma-separated values", () => {
      expect(parseImageInputs(["a.png,b.png", "c.png"])).toEqual([
        "a.png",
        "b.png",
        "c.png",
      ]);
    });
  });

  describe("buildModelInputOptions", () => {
    it("uses defaults and maps option names", () => {
      expect(buildModelInputOptions({ prompt: "thumbnail prompt" })).toEqual({
        prompt: "thumbnail prompt",
        aspect_ratio: DEFAULT_ASPECT_RATIO,
        resolution: DEFAULT_RESOLUTION,
        output_format: DEFAULT_OUTPUT_FORMAT,
        safety_filter_level: DEFAULT_SAFETY_FILTER_LEVEL,
        allow_fallback_model: false,
      });
    });

    it("accepts explicit values", () => {
      expect(
        buildModelInputOptions({
          prompt: "thumbnail prompt",
          "aspect-ratio": "21:9",
          resolution: "4K",
          "output-format": "png",
          "safety-filter-level": "block_medium_and_above",
          "allow-fallback-model": true,
        })
      ).toEqual({
        prompt: "thumbnail prompt",
        aspect_ratio: "21:9",
        resolution: "4K",
        output_format: "png",
        safety_filter_level: "block_medium_and_above",
        allow_fallback_model: true,
      });
    });

    it("validates prompt and aspect ratio", () => {
      expect(() => buildModelInputOptions({ prompt: "" })).toThrow(
        "--prompt is required"
      );
      expect(() =>
        buildModelInputOptions({
          prompt: "x",
          "aspect-ratio": "99:99",
        })
      ).toThrow(
        `--aspect-ratio must be one of: ${Array.from(ALLOWED_ASPECT_RATIOS).join(" | ")}`
      );
    });
  });

  describe("resolveImageInput", () => {
    it("returns hosted URL unchanged", async () => {
      await expect(
        resolveImageInput("https://example.com/image.jpg", "token")
      ).resolves.toBe("https://example.com/image.jpg");
    });
  });

  describe("extractOutputUrl", () => {
    it("normalizes supported output shapes", () => {
      expect(extractOutputUrl("https://example.com/a.jpg")).toBe(
        "https://example.com/a.jpg"
      );
      expect(
        extractOutputUrl([
          "https://example.com/a.jpg",
          "https://example.com/b.jpg",
        ])
      ).toBe("https://example.com/a.jpg");
      expect(extractOutputUrl({ url: "https://example.com/c.jpg" })).toBe(
        "https://example.com/c.jpg"
      );
    });
  });

  describe("createPrediction", () => {
    it("posts to the Nano Banana Pro model prediction endpoint", async () => {
      const previousFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pred_1",
          status: "starting",
          urls: { get: "https://api.replicate.com/v1/predictions/pred_1" },
        }),
      });
      global.fetch = fetchMock;

      try {
        const prediction = await createPrediction({
          input: { prompt: "thumbnail prompt", aspect_ratio: "16:9" },
          apiToken: "token-123",
        });

        expect(prediction.id).toBe("pred_1");
        expect(fetchMock).toHaveBeenCalledWith(
          MODEL_PREDICTIONS_URL,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer token-123",
              "Content-Type": "application/json",
              Prefer: "wait",
            }),
          })
        );

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toEqual({
          input: { prompt: "thumbnail prompt", aspect_ratio: "16:9" },
        });
      } finally {
        global.fetch = previousFetch;
      }
    });
  });
});
