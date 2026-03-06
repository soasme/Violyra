import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

const {
  buildModelInputOptions,
  buildDefaultOutputPath,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION,
  DEFAULT_FPS,
  DEFAULT_GENERATE_AUDIO,
  DEFAULT_RESOLUTION,
  DEFAULT_SCENES_DIR,
  MODEL_PREDICTIONS_URL,
  REPLICATE_FILES_URL,
  createPrediction,
  generateScenes,
  main,
  mergeScenesByStoryboardOrder,
  parseSceneDurationValue,
  parseSceneIds,
  readExistingOutputManifest,
  resolveImageInput,
  selectScenes,
  splitScenesByExistingVideo,
} = require("./generate.js");

describe(".agents/skills/seedance15-generate/scripts/generate.js", () => {
  describe("createPrediction", () => {
    it("posts prompt to the Seedance model endpoint with Prefer: wait", async () => {
      const previousFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pred_1",
          status: "succeeded",
          output: "https://example.com/scene-1.mp4",
        }),
      });
      global.fetch = fetchMock;

      try {
        const prediction = await createPrediction({
          input: {
            prompt: "A cow dancing in a barnyard",
            duration: 5,
            resolution: "720p",
            aspect_ratio: "16:9",
            fps: 24,
            generate_audio: false,
          },
          apiToken: "test-token",
        });

        expect(prediction.id).toBe("pred_1");
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          MODEL_PREDICTIONS_URL,
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer test-token",
              "Content-Type": "application/json",
              Prefer: "wait",
            }),
          })
        );

        const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(requestBody).toEqual({
          input: {
            prompt: "A cow dancing in a barnyard",
            duration: 5,
            resolution: "720p",
            aspect_ratio: "16:9",
            fps: 24,
            generate_audio: false,
          },
        });
      } finally {
        global.fetch = previousFetch;
      }
    });
  });

  describe("buildModelInputOptions", () => {
    it("returns defaults when optional flags are omitted", () => {
      const options = buildModelInputOptions({});
      expect(options).toEqual({
        duration: DEFAULT_DURATION,
        resolution: DEFAULT_RESOLUTION,
        aspect_ratio: DEFAULT_ASPECT_RATIO,
        fps: DEFAULT_FPS,
        generate_audio: DEFAULT_GENERATE_AUDIO,
      });
    });

    it("maps and validates provided options", () => {
      const options = buildModelInputOptions({
        duration: "8",
        resolution: "1080p",
        "aspect-ratio": "9:16",
        fps: "24",
        "generate-audio": true,
        image: "https://example.com/first-frame.png",
      });
      expect(options).toEqual({
        duration: 8,
        resolution: "1080p",
        aspect_ratio: "9:16",
        fps: 24,
        generate_audio: true,
        image: "https://example.com/first-frame.png",
      });
    });

    it("throws on invalid duration", () => {
      expect(() => buildModelInputOptions({ duration: "1" })).toThrow(
        "--duration must be between 2 and 12"
      );
    });

    it("throws on invalid resolution", () => {
      expect(() => buildModelInputOptions({ resolution: "1440p" })).toThrow(
        "--resolution must be one of: 480p | 720p | 1080p"
      );
    });

    it("throws on invalid fps", () => {
      expect(() => buildModelInputOptions({ fps: "30" })).toThrow(
        "--fps must be one of: 24"
      );
    });
  });

  describe("buildDefaultOutputPath", () => {
    it("builds manifest path from json input path", () => {
      expect(buildDefaultOutputPath("assets/storyboard.json")).toBe(
        "assets/storyboard.manifest.json"
      );
    });

    it("builds manifest path from non-json input path", () => {
      expect(buildDefaultOutputPath("assets/storyboard")).toBe(
        "assets/storyboard.manifest.json"
      );
    });
  });

  describe("parseSceneDurationValue", () => {
    it("uses fallback duration when scene duration is omitted", () => {
      expect(parseSceneDurationValue(undefined, 1, 5)).toBe(5);
    });

    it("uses scene duration when valid", () => {
      expect(parseSceneDurationValue(10, 1, 5)).toBe(10);
      expect(parseSceneDurationValue("8", 1, 5)).toBe(8);
    });

    it("throws on invalid scene duration", () => {
      expect(() => parseSceneDurationValue(13, 1, 5)).toThrow(
        'Scene 1 "duration" must be between 2 and 12'
      );
    });
  });

  describe("parseSceneIds", () => {
    it("returns deduplicated scene ids from repeated flags and comma lists", () => {
      expect(parseSceneIds(["1", "2,3", "2"])).toEqual([1, 2, 3]);
    });

    it("throws when scene-id contains invalid value", () => {
      expect(() => parseSceneIds(["abc"])).toThrow(
        "--scene-id must be a positive integer"
      );
    });
  });

  describe("selectScenes", () => {
    it("returns all scenes when no scene ids are requested", () => {
      const scenes = [{ scene_id: 1 }, { scene_id: 2 }];
      expect(selectScenes(scenes, [])).toBe(scenes);
    });

    it("returns only requested scenes in request order", () => {
      const scenes = [{ scene_id: 1 }, { scene_id: 2 }, { scene_id: 3 }];
      expect(selectScenes(scenes, [3, 1])).toEqual([{ scene_id: 3 }, { scene_id: 1 }]);
    });

    it("throws when a requested scene does not exist", () => {
      const scenes = [{ scene_id: 1 }];
      expect(() => selectScenes(scenes, [2])).toThrow("Scene 2 not found in storyboard");
    });
  });

  describe("readExistingOutputManifest", () => {
    it("returns null when output does not exist", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-existing-manifest-missing-"));
      const outputPath = join(dir, "seedance15.json");
      await expect(readExistingOutputManifest(outputPath)).resolves.toBeNull();
    });
  });

  describe("mergeScenesByStoryboardOrder", () => {
    it("merges existing and generated scenes with storyboard order", () => {
      const storyboardScenes = [{ scene_id: 1 }, { scene_id: 2 }, { scene_id: 3 }];
      const existingScenes = [{ scene_id: 1, prompt: "one-old" }, { scene_id: 2, prompt: "two-old" }];
      const generatedScenes = [{ scene_id: 2, prompt: "two-new" }, { scene_id: 3, prompt: "three-new" }];

      expect(
        mergeScenesByStoryboardOrder({
          storyboardScenes,
          existingScenes,
          generatedScenes,
        })
      ).toEqual([
        { scene_id: 1, prompt: "one-old" },
        { scene_id: 2, prompt: "two-new" },
        { scene_id: 3, prompt: "three-new" },
      ]);
    });
  });

  describe("splitScenesByExistingVideo", () => {
    it("splits scenes into to-generate vs skipped based on local video file", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-skip-split-"));
      const scenesDir = join(dir, "scenes");
      await mkdir(scenesDir, { recursive: true });
      await writeFile(join(scenesDir, "1.mp4"), Buffer.from([1, 2, 3]));

      const result = await splitScenesByExistingVideo({
        scenes: [
          { scene_id: 1, prompt: "scene one" },
          { scene_id: 2, prompt: "scene two" },
        ],
        scenesDir,
        existingScenes: [
          {
            scene_id: 1,
            prompt: "scene one",
            prediction: { id: "pred_existing_1" },
            video_file: "old/path.mp4",
          },
        ],
      });

      expect(result.scenesToGenerate).toEqual([{ scene_id: 2, prompt: "scene two" }]);
      expect(result.skippedScenes).toEqual([
        {
          scene_id: 1,
          prompt: "scene one",
          duration: 5,
          prediction: { id: "pred_existing_1" },
          video_file: join(scenesDir, "1.mp4"),
        },
      ]);
    });
  });

  describe("resolveImageInput", () => {
    it("keeps hosted URL and data URI unchanged", async () => {
      await expect(
        resolveImageInput("https://example.com/image.png", "token")
      ).resolves.toBe("https://example.com/image.png");
      await expect(
        resolveImageInput("data:application/octet-stream,AAAA", "token")
      ).resolves.toBe("data:application/octet-stream,AAAA");
    });

    it("uploads a local image path to Replicate files API", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-image-upload-"));
      const imagePath = join(dir, "image.png");
      await writeFile(imagePath, Buffer.from([137, 80, 78, 71]));

      const previousFetch = global.fetch;
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          urls: { get: "https://delivery.replicate.com/some/path/to/image.png" },
        }),
      });
      global.fetch = fetchMock;

      try {
        const resolved = await resolveImageInput(imagePath, "token-abc");
        expect(resolved).toBe(
          "https://delivery.replicate.com/some/path/to/image.png"
        );
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

  describe("generateScenes", () => {
    it("polls when prediction is still processing and normalizes output URLs", async () => {
      const previousFetch = global.fetch;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "processing",
            output: null,
            urls: { get: "https://example.com/predictions/pred_1" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "succeeded",
            output: ["https://example.com/scene-1.mp4"],
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_2",
            status: "succeeded",
            output: "https://example.com/scene-2.mp4",
            error: null,
          }),
        });
      global.fetch = fetchMock;

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        const scenes = await generateScenes({
          scenes: [
            {
              scene_id: 1,
              section: "Verse 1",
              character: "Cow",
              duration: 10,
              prompt: "cow groove",
            },
            { scene_id: 2, section: "Verse 2", character: "Pig", prompt: "pig groove" },
          ],
          generationInput: {
            duration: 5,
            resolution: "720p",
            aspect_ratio: "16:9",
            fps: 24,
            generate_audio: false,
          },
          apiToken: "token-123",
          pollIntervalMs: 1,
        });

        expect(fetchMock).toHaveBeenCalledTimes(3);
        expect(fetchMock).toHaveBeenNthCalledWith(
          2,
          "https://example.com/predictions/pred_1",
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: "Bearer token-123",
            }),
          })
        );
        const firstRequestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(firstRequestBody.input).toEqual({
          prompt: "cow groove",
          duration: 10,
          resolution: "720p",
          aspect_ratio: "16:9",
          fps: 24,
          generate_audio: false,
        });
        const secondRequestBody = JSON.parse(fetchMock.mock.calls[2][1].body);
        expect(secondRequestBody.input.duration).toBe(5);
        expect(scenes).toHaveLength(2);
        expect(scenes[0].duration).toBe(10);
        expect(scenes[1].duration).toBe(5);
        expect(scenes[0].prediction.output_urls).toEqual([
          "https://example.com/scene-1.mp4",
        ]);
        expect(scenes[1].prediction.output_urls).toEqual([
          "https://example.com/scene-2.mp4",
        ]);
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
      }
    });
  });

  describe("main", () => {
    it("reads storyboard, generates scenes, and writes output file", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-generate-"));
      const inputPath = join(dir, "storyboard.json");
      const outputPath = join(dir, "seedance15.json");
      const scenesDir = join(dir, "scenes");
      const sceneBytes = Uint8Array.from([0, 0, 0, 32, 102, 116, 121, 112]);

      await writeFile(
        inputPath,
        JSON.stringify({
          model: "seedance15",
          song_title: "Farmyard Groove",
          scenes: [
            {
              scene_id: 1,
              section: "Verse 1 - Cow",
              character: "Cow",
              duration: 10,
              prompt: "cow dj",
            },
          ],
        }),
        "utf8"
      );

      const previousFetch = global.fetch;
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "succeeded",
            output: "https://example.com/scene-1.mp4",
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => sceneBytes.buffer,
        });
      global.fetch = fetchMock;
      process.argv = [
        "node",
        "generate.js",
        "--input",
        inputPath,
        "--output",
        outputPath,
        "--scenes-dir",
        scenesDir,
        "--duration",
        "6",
        "--resolution",
        "1080p",
        "--aspect-ratio",
        "9:16",
        "--fps",
        "24",
        "--generate-audio",
        "--image",
        "https://example.com/frame.jpg",
        "--poll-interval-ms",
        "1",
      ];
      process.env.REPLICATE_API_TOKEN = "token";

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await main();

        const result = JSON.parse(await readFile(outputPath, "utf8"));
        expect(result.model).toBe("bytedance/seedance-1.5-pro");
        expect(result.input_file).toBe(inputPath);
        expect(result.song_title).toBe("Farmyard Groove");
        expect(result.scenes_dir).toBe(scenesDir);
        expect(result.generation_input).toEqual({
          duration: 6,
          resolution: "1080p",
          aspect_ratio: "9:16",
          fps: 24,
          generate_audio: true,
          image: "https://example.com/frame.jpg",
        });
        expect(result.requested_scene_ids).toBeNull();
        expect(result.scene_count).toBe(1);
        expect(result.scenes[0].prediction.output_urls).toEqual([
          "https://example.com/scene-1.mp4",
        ]);
        expect(result.scenes[0].duration).toBe(10);
        expect(result.scenes[0].video_file).toBe(join(scenesDir, "1.mp4"));
        const predictionBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(predictionBody.input.duration).toBe(10);

        const writtenVideo = await readFile(join(scenesDir, "1.mp4"));
        expect(Array.from(writtenVideo)).toEqual(Array.from(sceneBytes));
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
      }
    });

    it("uses input-derived manifest path when --output is omitted", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-generate-default-output-"));
      const inputPath = join(dir, "storyboard.json");
      const outputPath = join(dir, "storyboard.manifest.json");
      const scenesDir = join(dir, "scenes");
      const sceneBytes = Uint8Array.from([0, 0, 0, 32, 102, 116, 121, 112]);

      await writeFile(
        inputPath,
        JSON.stringify({
          model: "seedance15",
          scenes: [{ scene_id: 1, prompt: "cow dj" }],
        }),
        "utf8"
      );

      const previousFetch = global.fetch;
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "succeeded",
            output: "https://example.com/scene-1.mp4",
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => sceneBytes.buffer,
        });
      global.fetch = fetchMock;
      process.argv = [
        "node",
        "generate.js",
        "--input",
        inputPath,
        "--scenes-dir",
        scenesDir,
      ];
      process.env.REPLICATE_API_TOKEN = "token";

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await main();
        const result = JSON.parse(await readFile(outputPath, "utf8"));
        expect(result.input_file).toBe(inputPath);
        expect(result.scene_count).toBe(1);
        expect(result.scenes[0].scene_id).toBe(1);
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
      }
    });

    it("filters to requested scene ids", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-generate-scene-id-"));
      const inputPath = join(dir, "storyboard.json");
      const outputPath = join(dir, "seedance15.json");
      const scenesDir = join(dir, "scenes");
      const sceneBytes = Uint8Array.from([0, 0, 0, 32, 102, 116, 121, 112]);

      await writeFile(
        inputPath,
        JSON.stringify({
          model: "seedance15",
          scenes: [
            { scene_id: 1, prompt: "first prompt" },
            { scene_id: 2, prompt: "second prompt" },
          ],
        }),
        "utf8"
      );

      const previousFetch = global.fetch;
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_2",
            status: "succeeded",
            output: "https://example.com/scene-2.mp4",
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => sceneBytes.buffer,
        });
      global.fetch = fetchMock;
      process.argv = [
        "node",
        "generate.js",
        "--input",
        inputPath,
        "--output",
        outputPath,
        "--scenes-dir",
        scenesDir,
        "--scene-id",
        "2",
      ];
      process.env.REPLICATE_API_TOKEN = "token";

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await main();

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const predictionBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(predictionBody.input.prompt).toBe("second prompt");

        const result = JSON.parse(await readFile(outputPath, "utf8"));
        expect(result.requested_scene_ids).toEqual([2]);
        expect(result.scene_count).toBe(1);
        expect(result.scenes[0].scene_id).toBe(2);
        expect(result.scenes[0].video_file).toBe(join(scenesDir, "2.mp4"));
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
      }
    });

    it("merges subset run into existing output manifest", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-generate-merge-output-"));
      const inputPath = join(dir, "storyboard.json");
      const outputPath = join(dir, "seedance15.json");
      const scenesDir = join(dir, "scenes");
      const sceneBytes = Uint8Array.from([0, 0, 0, 32, 102, 116, 121, 112]);

      await writeFile(
        inputPath,
        JSON.stringify({
          model: "seedance15",
          song_title: "Farmyard Groove",
          scenes: [
            { scene_id: 1, prompt: "first prompt" },
            { scene_id: 2, prompt: "second prompt" },
          ],
        }),
        "utf8"
      );

      await writeFile(
        outputPath,
        JSON.stringify({
          model: "bytedance/seedance-1.5-pro",
          generated_at: "2026-03-06T00:00:00.000Z",
          input_file: inputPath,
          source_storyboard_model: "seedance15",
          song_title: "Farmyard Groove",
          generation_input: {
            duration: 5,
            resolution: "720p",
            aspect_ratio: "16:9",
            fps: 24,
            generate_audio: false,
          },
          requested_scene_ids: [1],
          scenes_dir: scenesDir,
          scene_count: 1,
          scenes: [
            {
              scene_id: 1,
              prompt: "first prompt",
              prediction: {
                id: "pred_1",
                output_urls: ["https://example.com/scene-1.mp4"],
              },
              video_file: join(scenesDir, "1.mp4"),
            },
          ],
        }),
        "utf8"
      );

      const previousFetch = global.fetch;
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_2",
            status: "succeeded",
            output: "https://example.com/scene-2.mp4",
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => sceneBytes.buffer,
        });
      global.fetch = fetchMock;
      process.argv = [
        "node",
        "generate.js",
        "--input",
        inputPath,
        "--output",
        outputPath,
        "--scenes-dir",
        scenesDir,
        "--scene-id",
        "2",
      ];
      process.env.REPLICATE_API_TOKEN = "token";

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await main();

        const result = JSON.parse(await readFile(outputPath, "utf8"));
        expect(result.requested_scene_ids).toBeNull();
        expect(result.scene_count).toBe(2);
        expect(result.scenes.map((scene) => scene.scene_id)).toEqual([1, 2]);
        expect(result.scenes[0].prediction.id).toBe("pred_1");
        expect(result.scenes[1].prediction.id).toBe("pred_2");
        expect(result.scenes[1].video_file).toBe(join(scenesDir, "2.mp4"));
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
      }
    });

    it("skips generation when requested scene video already exists", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-generate-skip-existing-video-"));
      const inputPath = join(dir, "storyboard.json");
      const outputPath = join(dir, "seedance15.json");
      const scenesDir = join(dir, "scenes");

      await mkdir(scenesDir, { recursive: true });
      await writeFile(join(scenesDir, "2.mp4"), Buffer.from([0, 1, 2]));

      await writeFile(
        inputPath,
        JSON.stringify({
          model: "seedance15",
          scenes: [
            { scene_id: 1, prompt: "first prompt" },
            { scene_id: 2, prompt: "second prompt" },
          ],
        }),
        "utf8"
      );

      const previousFetch = global.fetch;
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const fetchMock = vi.fn();
      global.fetch = fetchMock;
      process.argv = [
        "node",
        "generate.js",
        "--input",
        inputPath,
        "--output",
        outputPath,
        "--scenes-dir",
        scenesDir,
        "--scene-id",
        "2",
      ];
      process.env.REPLICATE_API_TOKEN = "token";

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await main();

        expect(fetchMock).toHaveBeenCalledTimes(0);

        const result = JSON.parse(await readFile(outputPath, "utf8"));
        expect(result.requested_scene_ids).toEqual([2]);
        expect(result.scene_count).toBe(1);
        expect(result.scenes[0].scene_id).toBe(2);
        expect(result.scenes[0].prediction).toBeNull();
        expect(result.scenes[0].duration).toBe(5);
        expect(result.scenes[0].video_file).toBe(join(scenesDir, "2.mp4"));
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
        process.argv = previousArgv;
        if (previousToken === undefined) {
          delete process.env.REPLICATE_API_TOKEN;
        } else {
          process.env.REPLICATE_API_TOKEN = previousToken;
        }
      }
    });

    it("throws when REPLICATE_API_TOKEN is missing", async () => {
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      process.argv = ["node", "generate.js"];
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
      }
    });

    it("uploads local image path before creating prediction", async () => {
      const dir = await mkdtemp(join(tmpdir(), "seedance-main-upload-"));
      const inputPath = join(dir, "storyboard.json");
      const outputPath = join(dir, "seedance15.json");
      const scenesDir = join(dir, "scenes");
      const imagePath = join(dir, "frame.png");
      const sceneBytes = Uint8Array.from([0, 0, 0, 32, 102, 116, 121, 112]);

      await writeFile(
        inputPath,
        JSON.stringify({
          model: "seedance15",
          song_title: "Farmyard Groove",
          scenes: [{ scene_id: 1, section: "Verse 1 - Cow", character: "Cow", prompt: "cow dj" }],
        }),
        "utf8"
      );
      await writeFile(imagePath, Buffer.from([1, 2, 3]));

      const previousFetch = global.fetch;
      const previousArgv = process.argv;
      const previousToken = process.env.REPLICATE_API_TOKEN;
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            urls: { get: "https://delivery.replicate.com/some/path/uploaded.png" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "pred_1",
            status: "succeeded",
            output: "https://example.com/scene-1.mp4",
            error: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: async () => sceneBytes.buffer,
        });
      global.fetch = fetchMock;
      process.argv = [
        "node",
        "generate.js",
        "--input",
        inputPath,
        "--output",
        outputPath,
        "--scenes-dir",
        scenesDir,
        "--image",
        imagePath,
      ];
      process.env.REPLICATE_API_TOKEN = "token";

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      try {
        await main();

        expect(fetchMock).toHaveBeenNthCalledWith(
          1,
          REPLICATE_FILES_URL,
          expect.objectContaining({
            method: "POST",
          })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
          2,
          MODEL_PREDICTIONS_URL,
          expect.objectContaining({
            method: "POST",
          })
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
          3,
          "https://example.com/scene-1.mp4"
        );

        const predictionBody = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(predictionBody.input.image).toBe(
          "https://delivery.replicate.com/some/path/uploaded.png"
        );

        const result = JSON.parse(await readFile(outputPath, "utf8"));
        expect(result.generation_input.image).toBe(
          "https://delivery.replicate.com/some/path/uploaded.png"
        );
        expect(result.scenes[0].video_file).toBe(join(scenesDir, "1.mp4"));
      } finally {
        logSpy.mockRestore();
        global.fetch = previousFetch;
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
