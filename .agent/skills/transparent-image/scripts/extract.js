/**
 * Remove background from an image using 851-labs/background-remover on Replicate.
 *
 * Options:
 *   --input    The input image file path (required)
 *   --output   The output file path (required)
 *
 * Environment:
 *   REPLICATE_API_TOKEN   Your Replicate API token (required)
 *
 * Usage:
 *   node .agent/skills/transparent-image/scripts/extract.js --input public/bicycle.png --output public/bicycle-transparent.png
 */

const { parseArgs } = require("node:util");
const { readFile, writeFile } = require("node:fs/promises");
const { extname } = require("node:path");

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";
const MODEL_VERSION =
  "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc";

function getMimeType(filepath) {
  const ext = extname(filepath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return mimeTypes[ext] || "image/png";
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: "string" },
      output: { type: "string" },
    },
  });

  const { input, output } = values;
  const inputValue = input;
  if (!inputValue) {
    console.error("Error: --input is required");
    process.exit(1);
  }

  const outputValue = output;
  if (!outputValue) {
    console.error("Error: --output is required");
    process.exit(1);
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error("Error: REPLICATE_API_TOKEN environment variable is not set");
    process.exit(1);
  }

  console.log(`Removing background from: ${inputValue}`);

  const imageBuffer = await readFile(inputValue);
  const base64Image = imageBuffer.toString("base64");
  const mimeType = getMimeType(inputValue);
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  const createResponse = await fetch(REPLICATE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: MODEL_VERSION.split(":")[1],
      input: {
        image: dataUri,
        format: "png",
        reverse: false,
        threshold: 0,
        background_type: "rgba",
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    console.error(`Error creating prediction: ${error}`);
    process.exit(1);
  }

  let prediction = await createResponse.json();
  console.log(`Prediction created: ${prediction.id}`);

  while (prediction.status !== "succeeded" && prediction.status !== "failed") {
    console.log(`Status: ${prediction.status}...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pollResponse = await fetch(prediction.urls.get, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!pollResponse.ok) {
      const error = await pollResponse.text();
      console.error(`Error polling prediction: ${error}`);
      process.exit(1);
    }

    prediction = await pollResponse.json();
  }

  if (prediction.status === "failed") {
    console.error(`Prediction failed: ${prediction.error}`);
    process.exit(1);
  }

  const imageUrl = prediction.output;
  console.log(`Downloading image from: ${imageUrl}`);

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    console.error(`Error downloading image: ${imageResponse.statusText}`);
    process.exit(1);
  }

  const outputBuffer = await imageResponse.arrayBuffer();
  await writeFile(outputValue, Buffer.from(outputBuffer));

  console.log(`Saved to: ${outputValue}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
