/**
 * Signature image helpers.
 * Exports drawn signatures as transparent PNGs cropped to the ink bounding box,
 * so only the strokes are placed into documents (never a background block).
 */
export function cropSignatureCanvas(canvas: HTMLCanvasElement, padding = 6): string {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");
    const { width, height } = canvas;
    if (!width || !height) return canvas.toDataURL("image/png");
    const { data } = ctx.getImageData(0, 0, width, height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Any non-transparent pixel counts as ink.
        if (data[(y * width + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0 || maxY < 0) return canvas.toDataURL("image/png");

    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    const out = document.createElement("canvas");
    out.width = maxX - minX + 1;
    out.height = maxY - minY + 1;
    const outCtx = out.getContext("2d");
    if (!outCtx) return canvas.toDataURL("image/png");
    outCtx.clearRect(0, 0, out.width, out.height);
    outCtx.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  } catch {
    return canvas.toDataURL("image/png");
  }
}
