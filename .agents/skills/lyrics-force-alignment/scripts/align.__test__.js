import { describe, expect, it } from "vitest";

const {
  alignWordSequences,
  buildApproximateSegments,
  buildLrc,
  buildSrt,
  deriveAudioInputKey,
  distributeLinesProportionally,
  flattenRecognizedWords,
  normalizeWord,
  reconstructWordTimings,
  tokenSimilarity,
} = require("./align.js");

function makeLyricWords(text) {
  return text.split(/\s+/).map((word, index) => ({
    flatIndex: index,
    lineIndex: 0,
    wordIndexInLine: index,
    raw: word,
    normalized: normalizeWord(word, { normalizeContractions: true }),
  }));
}

function makeRecognizedWords(text) {
  return text.split(/\s+/).map((word, index) => ({
    normalized: normalizeWord(word, { normalizeContractions: true }),
    start: index,
    end: index + 0.5,
  }));
}

describe(".agents/skills/lyrics-force-alignment/scripts/align.js", () => {
  describe("normalizeWord", () => {
    it("normalizes case, apostrophes, and punctuation", () => {
      expect(
        normalizeWord(" I\u2019m!! ", { normalizeContractions: true })
      ).toBe("im");
      expect(
        normalizeWord("Rock'n'Roll", { normalizeContractions: true })
      ).toBe("rocknroll");
      expect(normalizeWord("...", { normalizeContractions: true })).toBe("");
    });
  });

  describe("tokenSimilarity", () => {
    it("scores misspellings with a high fuzzy similarity", () => {
      const similarity = tokenSimilarity("twinkle", "twinkl", new Map());
      expect(similarity).toBeGreaterThan(0.8);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe("alignWordSequences", () => {
    it("handles merged chunks and misspellings while preserving lyric order", () => {
      const lyricWords = makeLyricWords(
        "twinkle twinkle little star how i wonder what you are"
      );
      const recognizedWords = makeRecognizedWords(
        "twinkl twinkl litl star how i wonder what are"
      );

      const result = alignWordSequences(lyricWords, recognizedWords, {
        minSimilarity: 0.58,
        hardFloorSimilarity: 0.35,
        deletionPenalty: 1.0,
        insertionPenalty: 0.8,
      });

      expect(result.stats.matched).toBe(9);
      expect(result.lyricToRecognizedIndex).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, -1, 8,
      ]);
    });
  });

  describe("reconstructWordTimings", () => {
    it("interpolates missing words between matched anchor words", () => {
      const lyricWords = makeLyricWords("one two three four five");
      const recognizedWords = [
        { normalized: "one", start: 0.0, end: 0.5 },
        { normalized: "two", start: 0.5, end: 1.0 },
        { normalized: "four", start: 1.5, end: 2.0 },
        { normalized: "five", start: 2.0, end: 2.5 },
      ];
      const alignment = {
        lyricToRecognizedIndex: [0, 1, -1, 2, 3],
        lyricToSimilarity: [1, 1, 0, 1, 1],
      };

      const timedWords = reconstructWordTimings(
        lyricWords,
        recognizedWords,
        alignment,
        {
          minWordDuration: 0.05,
          defaultWordDuration: 0.25,
          paddingSeconds: 0.05,
        }
      );

      expect(timedWords[2].source).toBe("interpolated");
      expect(timedWords[2].start).toBeCloseTo(1.0, 6);
      expect(timedWords[2].end).toBeCloseTo(1.5, 6);
      expect(timedWords[3].start).toBeGreaterThanOrEqual(timedWords[2].end);
      expect(timedWords[4].start).toBeGreaterThanOrEqual(timedWords[3].end);
    });
  });

  describe("flattenRecognizedWords", () => {
    it("flattens words across segments and infers missing word timings from segment spans", () => {
      const segments = [
        {
          start: 0,
          end: 2,
          text: "twinkl twinkl",
        },
        {
          start: 2,
          end: 4,
          words: [
            { word: "litl" },
            { word: "star", start: 3.0, end: 3.4 },
          ],
        },
      ];

      const recognizedWords = flattenRecognizedWords(segments, {
        normalizeContractions: true,
        defaultWordDuration: 0.3,
        minWordDuration: 0.05,
      });

      expect(recognizedWords.map((word) => word.normalized)).toEqual([
        "twinkl",
        "twinkl",
        "litl",
        "star",
      ]);
      expect(recognizedWords[2].start).toBeCloseTo(2.0, 6);
      expect(recognizedWords[2].end).toBeCloseTo(3.0, 6);
      expect(recognizedWords[3].start).toBeGreaterThanOrEqual(
        recognizedWords[2].end
      );
    });
  });

  describe("buildApproximateSegments", () => {
    it("normalizes segments into a stable JSON-friendly shape", () => {
      const output = buildApproximateSegments([
        {
          start: "1.2",
          end: "2.3",
          text: "hello world",
          words: [{ word: "hello", start: "1.2", end: "1.7", score: "0.9" }],
        },
      ]);

      expect(output).toEqual([
        {
          start: 1.2,
          end: 2.3,
          text: "hello world",
          words: [{ word: "hello", start: 1.2, end: 1.7, score: 0.9 }],
        },
      ]);
    });
  });

  describe("deriveAudioInputKey", () => {
    it("prefers explicit key and otherwise infers from model schema", () => {
      expect(
        deriveAudioInputKey({
          forcedAudioInputKey: "song",
          modelMetadata: null,
        })
      ).toBe("song");

      expect(
        deriveAudioInputKey({
          forcedAudioInputKey: "",
          modelMetadata: {
            latest_version: {
              openapi_schema: {
                components: {
                  schemas: {
                    Input: {
                      properties: {
                        audio_file: { type: "string", description: "Audio URL" },
                        language: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      ).toBe("audio_file");
    });
  });

  describe("distributeLinesProportionally", () => {
    it("allocates line durations by word count and keeps words monotonic", () => {
      const lines = [
        {
          words: [{}, {}],
          start: 0,
          end: 0,
        },
        {
          words: [{}, {}, {}, {}],
          start: 0,
          end: 0,
        },
      ];

      distributeLinesProportionally(lines, 0, 6, {
        minWordDuration: 0.05,
      });

      expect(lines[0].end - lines[0].start).toBeCloseTo(2, 6);
      expect(lines[1].end - lines[1].start).toBeCloseTo(4, 6);
      expect(lines[1].start).toBeCloseTo(lines[0].end, 6);
      expect(lines[1].words[0].start).toBeCloseTo(lines[1].start, 6);
    });
  });

  describe("subtitle formatting", () => {
    it("builds expected SRT and LRC outputs", () => {
      const lines = [
        { start: 0.5, end: 2.0, text: "Twinkle twinkle little star" },
        { start: 2.0, end: 4.2, text: "How I wonder what you are" },
      ];

      const srt = buildSrt(lines);
      const lrc = buildLrc(lines);

      expect(srt).toContain("00:00:00,500 --> 00:00:02,000");
      expect(srt).toContain("Twinkle twinkle little star");
      expect(lrc).toContain("[00:00.50]Twinkle twinkle little star");
      expect(lrc).toContain("[00:02.00]How I wonder what you are");
    });
  });
});
