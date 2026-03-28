import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { vi } from "vitest";

import { getMimeType, main, MODEL_VERSION, REPLICATE_API_URL } from "./extract.js";

describe("extract.js", () => {
  describe("getMimeType", () => {
    it("returns known mime types", () => {
      expect(getMimeType("photo.jpg")).toBe("image/jpeg");
      expect(getMimeType("photo.jpeg")).toBe("image/jpeg");
      expect(getMimeType("icon.png")).toBe("image/png");
      expect(getMimeType("asset.webp")).toBe("image/webp");
      expect(getMimeType("anim.gif")).toBe("image/gif");
    });

    it("handles uppercase extensions", () => {
      expect(getMimeType("PICTURE.PNG")).toBe("image/png");
      expect(getMimeType("PICTURE.JPEG")).toBe("image/jpeg");
    });

    it("defaults to png for unknown extensions", () => {
      expect(getMimeType("file.bmp")).toBe("image/png");
      expect(getMimeType("no-extension")).toBe("image/png");
    });
  });

  it("exposes a model version with owner/model:version format", () => {
    expect(MODEL_VERSION).toMatch(/^.+\/.+:[a-f0-9]+$/);
    expect(MODEL_VERSION.split(":")[1]).toHaveLength(64);
  });

  it("uses the replicate predictions endpoint", () => {
    expect(REPLICATE_API_URL).toBe("https://api.replicate.com/v1/predictions");
  });

  describe("main", () => {
    it("runs end-to-end and writes output image", async () => {
      const dir = await mkdtemp(join(tmpdir(), "extract-test-"));
      const inputPath = join(dir, "input.png");
      const outputPath = join(dir, "output.png");
      const outputBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

      await writeFile(inputPath, Buffer.from([1, 2, 3]));

      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const previousFetch = global.fetch;
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      process.argv = [
        "node",
        "extract.js",
        "--input",
        inputPath,
        "--output",
        outputPath,
      ];
      process.env.REPLICATE_API_TOKEN = "test-token";
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_123",
            status: "succeeded",
            output: "https://example.com/output.png",
            urls: { get: "https://example.com/pred_123" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => outputBytes.buffer,
        });

      try {
        await main();

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(
          1,
          REPLICATE_API_URL,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer test-token",
              "Content-Type": "application/json",
            }),
          })
        );

        const firstBody = JSON.parse(global.fetch.mock.calls[0][1].body);
        expect(firstBody.version).toBe(MODEL_VERSION.split(":")[1]);
        expect(firstBody.input.format).toBe("png");
        expect(firstBody.input.background_type).toBe("rgba");
        expect(firstBody.input.image).toMatch(/^data:image\/png;base64,/);

        expect(global.fetch).toHaveBeenNthCalledWith(
          2,
          "https://example.com/output.png"
        );

        const written = await readFile(outputPath);
        expect(Array.from(written)).toEqual(Array.from(outputBytes));
      } finally {
        logSpy.mockRestore();
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
        global.fetch = previousFetch;
      }
    });

    it("exits when REPLICATE_API_TOKEN is missing", async () => {
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
        throw new Error(`exit:${code}`);
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      process.argv = ["node", "extract.js", "--input", "a.png", "--output", "b.png"];
      delete process.env.REPLICATE_API_TOKEN;

      try {
        await expect(main()).rejects.toThrow("exit:1");
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(errorSpy).toHaveBeenCalledWith(
          "Error: REPLICATE_API_TOKEN environment variable is not set"
        );
      } finally {
        exitSpy.mockRestore();
        errorSpy.mockRestore();
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
