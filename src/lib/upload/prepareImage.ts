/**
 * Normalizes user photos before upload so storage buckets with strict
 * image type / size rules accept them (iPhone HEIC, huge camera JPEGs,
 * files with empty or "image/jpg" MIME types, etc.).
 */
const SAFE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const HEIC_RE = /\.(heic|heif)$/i;

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || HEIC_RE.test(file.name) || /\.(jpe?g|png|webp|gif|bmp|tiff?)$/i.test(file.name);
}

export async function prepareImageForUpload(
  file: File,
  { maxBytes = 4 * 1024 * 1024, maxDimension = 2400 } = {},
): Promise<File> {
  if (!isImageFile(file)) return file;
  // GIFs keep their animation; SVG stays as-is.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  if (SAFE_TYPES.includes(file.type) && file.size <= maxBytes) return file;

  try {
    const bitmap = await loadImage(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h);

    // Transparent images must stay PNG — JPEG would turn transparency black.
    if (hasAlpha(ctx, w, h)) {
      const png = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
      if (!png) return file;
      const base = file.name.replace(/\.[^.]+$/, '') || 'image';
      return new File([png], `${base}.png`, { type: 'image/png', lastModified: Date.now() });
    }

    let quality = 0.88;
    let blob = await toBlob(canvas, quality);
    while (blob && blob.size > maxBytes && quality > 0.5) {
      quality -= 0.1;
      blob = await toBlob(canvas, quality);
    }
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (err) {
    console.warn('[prepareImage] could not convert image, uploading original', err);
    return file;
  }
}

function hasAlpha(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 255) return true;
  } catch { /* ignore */ }
  return false;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through to <img> decoding (Safari handles HEIC here) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unsupported image format'));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
