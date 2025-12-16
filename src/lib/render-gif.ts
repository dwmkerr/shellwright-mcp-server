/**
 * Render PNG frames to animated GIF using gifenc
 */

import gifenc from "gifenc";
const { GIFEncoder, quantize, applyPalette } = gifenc;
import * as fs from "fs/promises";
import * as path from "path";

export interface RenderGifOptions {
  fps?: number;
  loop?: number; // 0 = infinite
}

/**
 * Render a directory of PNG frames to an animated GIF
 */
export async function renderGif(
  framesDir: string,
  outputPath: string,
  options: RenderGifOptions = {}
): Promise<{ frameCount: number; durationMs: number }> {
  const { Jimp } = await import("jimp");

  const fps = options.fps || 10;
  const delay = Math.round(1000 / fps);

  const files = await fs.readdir(framesDir);
  const pngFiles = files
    .filter((f) => f.endsWith(".png"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  if (pngFiles.length === 0) {
    throw new Error(`No PNG frames found in ${framesDir}`);
  }

  // Read first frame to get dimensions
  const firstFramePath = path.join(framesDir, pngFiles[0]);
  const firstImage = await Jimp.read(firstFramePath);
  const width = firstImage.width;
  const height = firstImage.height;

  const gif = GIFEncoder();

  for (const file of pngFiles) {
    const framePath = path.join(framesDir, file);
    const image = await Jimp.read(framePath);
    const rgba = new Uint8Array(image.bitmap.data);

    // Quantize to 256-color palette and apply
    const palette = quantize(rgba, 256);
    const indexed = applyPalette(rgba, palette);

    gif.writeFrame(indexed, width, height, { palette, delay });
  }

  gif.finish();

  await fs.writeFile(outputPath, gif.bytes());

  return {
    frameCount: pngFiles.length,
    durationMs: pngFiles.length * delay,
  };
}
