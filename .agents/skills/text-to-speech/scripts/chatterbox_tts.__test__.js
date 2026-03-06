import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, expect, vi } from "vitest";

const {
  CHATTERBOX_API_URL,
  generateTts,
  getAudioMimeType,
  main,
  waitForPrediction,
} = require("./chatterbox_tts.js");

describe("chatterbox_tts.js", () => {
  describe("getAudioMimeType", () => {
    it("returns expected MIME types for known extensions", () => {
      expect(getAudioMimeType("voice.wav")).toBe("audio/wav");
      expect(getAudioMimeType("voice.MP3")).toBe("audio/mpeg");
      expect(getAudioMimeType("voice.m4a")).toBe("audio/mp4");
      expect(getAudioMimeType("voice.flac")).toBe("audio/flac");
      expect(getAudioMimeType("voice.ogg")).toBe("audio/ogg");
    });

    it("falls back to audio/wav for unknown extension", () => {
      expect(getAudioMimeType("voice.bin")).toBe("audio/wav");
      expect(getAudioMimeType("voice")).toBe("audio/wav");
    });
  });

  describe("waitForPrediction", () => {
    it("polls until succeeded and returns output URL", async () => {
      const previousFetch = global.fetch;
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: "processing", output: null, error: null }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "succeeded",
            output: "https://example.com/audio.wav",
            error: null,
          }),
        });

      try {
        const output = await waitForPrediction(
          "https://example.com/prediction",
          "token",
          1
        );
        expect(output).toBe("https://example.com/audio.wav");
        expect(global.fetch).toHaveBeenCalledTimes(2);
      } finally {
        global.fetch = previousFetch;
      }
    });

    it("throws when prediction fails", async () => {
      const previousFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "failed",
          output: null,
          error: "runtime failure",
        }),
      });

      try {
        await expect(
          waitForPrediction("https://example.com/prediction", "token", 1)
        ).rejects.toThrow("Prediction failed: runtime failure");
      } finally {
        global.fetch = previousFetch;
      }
    });
  });

  describe("generateTts/main", () => {
    it("generates audio and writes output (with audio-ref)", async () => {
      const dir = await mkdtemp(join(tmpdir(), "chatterbox-"));
      const audioRefPath = join(dir, "ref.wav");
      const outputPath = join(dir, "out.wav");
      const audioRefBytes = Buffer.from([1, 2, 3, 4]);
      const downloadedBytes = Uint8Array.from([11, 22, 33, 44]);

      await writeFile(audioRefPath, audioRefBytes);

      const previousFetch = global.fetch;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred-1",
            urls: { get: "https://example.com/pred-1" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "processing",
            output: null,
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "succeeded",
            output: ["https://example.com/audio-output.wav"],
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => downloadedBytes.buffer,
        });
      global.fetch = fetchMock;

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await generateTts({
          prompt: "hello world",
          outputPath,
          audioRefPath,
          apiToken: "token-123",
          pollIntervalMs: 1,
        });

        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(fetchMock).toHaveBeenNthCalledWith(
          1,
          CHATTERBOX_API_URL,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer token-123",
              "Content-Type": "application/json",
            }),
          })
        );

        const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(requestBody.input.prompt).toBe("hello world");
        expect(requestBody.input.audio_prompt).toBe(
          `data:audio/wav;base64,${audioRefBytes.toString("base64")}`
        );
        expect(fetchMock).toHaveBeenLastCalledWith(
          "https://example.com/audio-output.wav"
        );

        const written = await readFile(outputPath);
        expect(Array.from(written)).toEqual(Array.from(downloadedBytes));
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
      }
    });

    it("main throws when REPLICATE_API_TOKEN is missing", async () => {
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      process.argv = [
        "node",
        "chatterbox_tts.js",
        "--prompt",
        "hello",
        "--output",
        "out.wav",
      ];
      delete process.env.REPLICATE_API_TOKEN;

      try {
        await expect(main()).rejects.toThrow(
          "REPLICATE_API_TOKEN environment variable is not set"
        );
      } finally {
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
        errorSpy.mockRestore();
      }
    });

    it("main validates --poll-interval-ms", async () => {
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;

      process.argv = [
        "node",
        "chatterbox_tts.js",
        "--prompt",
        "hello",
        "--output",
        "out.wav",
        "--poll-interval-ms",
        "0",
      ];
      process.env.REPLICATE_API_TOKEN = "token";

      try {
        await expect(main()).rejects.toThrow(
          "--poll-interval-ms must be a positive integer"
        );
      } finally {
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
      }
    });
  });
});
