import { describe, expect, it } from "vitest";

const {
  buildDefaultOutputPath,
  buildFrameFilter,
  computeSceneTimings,
  parseFitMode,
} = require("./compile.js");

describe(".agents/skills/mv-compilation/scripts/compile.js", () => {
  describe("buildDefaultOutputPath", () => {
    it("builds default output filename from song path", () => {
      expect(buildDefaultOutputPath("assets/song.mp3")).toBe(
        "assets/final/song.full-song.1080p.mp4"
      );
    });
  });

  describe("parseFitMode", () => {
    it("defaults to fill-crop", () => {
      expect(parseFitMode(undefined)).toBe("fill-crop");
    });

    it("accepts contain mode", () => {
      expect(parseFitMode("contain")).toBe("contain");
    });

    it("throws on invalid mode", () => {
      expect(() => parseFitMode("stretch")).toThrow(
        "--fit-mode must be one of: fill-crop | contain"
      );
    });
  });

  describe("buildFrameFilter", () => {
    it("builds fill-crop filter chain", () => {
      const filter = buildFrameFilter({
        setptsFactor: 1.25,
        width: 1920,
        height: 1080,
        fps: 24,
        fitMode: "fill-crop",
      });

      expect(filter).toContain("setpts=1.25*PTS");
      expect(filter).toContain("fps=24");
      expect(filter).toContain(
        "scale=1920:1080:force_original_aspect_ratio=increase"
      );
      expect(filter).toContain("crop=1920:1080");
      expect(filter).toContain("format=yuv420p");
    });

    it("builds contain filter chain", () => {
      const filter = buildFrameFilter({
        setptsFactor: 0.8,
        width: 1920,
        height: 1080,
        fps: 24,
        fitMode: "contain",
      });

      expect(filter).toContain("setpts=0.8*PTS");
      expect(filter).toContain("fps=24");
      expect(filter).toContain(
        "scale=1920:1080:force_original_aspect_ratio=decrease"
      );
      expect(filter).toContain("pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black");
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
      expect(() =>
        computeSceneTimings({
          scenes: [{ scene_id: 1, lyrics: ["line 1"] }],
          alignedLines: [],
          songDuration: 10,
        })
      ).toThrow("Aligned lyrics JSON must contain lines");
    });
  });
});
