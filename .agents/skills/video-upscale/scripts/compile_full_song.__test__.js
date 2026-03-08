import { describe, expect, it } from "vitest";

const {
  buildCoverFilter,
  buildDefaultOutputPath,
  buildManifestOutputUrlMap,
  computeSceneTimings,
  shouldUpscale,
} = require("./compile_full_song.js");

describe(".agents/skills/video-upscale/scripts/compile_full_song.js", () => {
  describe("buildDefaultOutputPath", () => {
    it("builds default output filename from song path", () => {
      expect(buildDefaultOutputPath("assets/song.mp3")).toBe(
        "assets/final/song.full-song.1080p.mp4"
      );
    });
  });

  describe("shouldUpscale", () => {
    it("returns true when clip is below target dimensions", () => {
      expect(
        shouldUpscale({
          width: 1280,
          height: 720,
          targetWidth: 1920,
          targetHeight: 1080,
        })
      ).toBe(true);
    });

    it("returns false when clip already meets or exceeds target dimensions", () => {
      expect(
        shouldUpscale({
          width: 1920,
          height: 1080,
          targetWidth: 1920,
          targetHeight: 1080,
        })
      ).toBe(false);
      expect(
        shouldUpscale({
          width: 2560,
          height: 1440,
          targetWidth: 1920,
          targetHeight: 1080,
        })
      ).toBe(false);
    });
  });

  describe("buildCoverFilter", () => {
    it("builds fill-and-crop filter chain", () => {
      const filter = buildCoverFilter({
        setptsFactor: 1.25,
        width: 1920,
        height: 1080,
        fps: 24,
      });

      expect(filter).toContain("setpts=1.25*PTS");
      expect(filter).toContain("fps=24");
      expect(filter).toContain(
        "scale=1920:1080:force_original_aspect_ratio=increase"
      );
      expect(filter).toContain("crop=1920:1080");
      expect(filter).toContain("format=yuv420p");
    });
  });

  describe("computeSceneTimings", () => {
    it("maps scenes to continuous windows using aligned start anchors", () => {
      const scenes = [
        { scene_id: 1, lyrics: ["l1", "l2"] },
        { scene_id: 2, lyrics: ["l3", "l4"] },
        { scene_id: 3, lyrics: ["l5", "l6"] },
      ];
      const alignedLines = [
        { line_index: 0, start: 5.0, end: 6.0, text: "l1" },
        { line_index: 1, start: 6.0, end: 7.0, text: "l2" },
        { line_index: 2, start: 8.0, end: 9.0, text: "l3" },
        { line_index: 3, start: 9.0, end: 10.0, text: "l4" },
        { line_index: 4, start: 11.0, end: 12.0, text: "l5" },
        { line_index: 5, start: 12.0, end: 13.0, text: "l6" },
      ];

      const timings = computeSceneTimings({
        scenes,
        alignedLines,
        songDuration: 15.0,
      });

      expect(timings).toEqual([
        { scene_id: 1, start: 0, end: 8, duration: 8 },
        { scene_id: 2, start: 8, end: 11, duration: 3 },
        { scene_id: 3, start: 11, end: 15, duration: 4 },
      ]);
    });

    it("throws when aligned lines do not match scene lyric count", () => {
      const scenes = [{ scene_id: 1, lyrics: ["line 1"] }];
      const alignedLines = [];

      expect(() =>
        computeSceneTimings({
          scenes,
          alignedLines,
          songDuration: 10,
        })
      ).toThrow("Aligned lyrics JSON must contain lines");
    });
  });

  describe("buildManifestOutputUrlMap", () => {
    it("indexes first prediction output URL by scene id", () => {
      const map = buildManifestOutputUrlMap({
        scenes: [
          {
            scene_id: 1,
            prediction: {
              output_urls: ["https://example.com/1.mp4"],
            },
          },
          {
            scene_id: 2,
            prediction: {
              output_urls: ["https://example.com/2.mp4"],
            },
          },
        ],
      });

      expect(map.get("1")).toBe("https://example.com/1.mp4");
      expect(map.get("2")).toBe("https://example.com/2.mp4");
    });
  });
});
