/**
 * Client-side image compression using HTMLCanvasElement.
 * Resizes images so the longest edge is at most `maxDim` and re-encodes
 * to JPEG (or PNG for transparency) at the given quality.
 *
 * Returns a File ready to upload; falls back to the original on any error.
 */
export async function compressImage(file, { maxDim = 1600, quality = 0.85 } = {}) {
  try {
    if (!file || !file.type?.startsWith('image/')) return file;
    // Skip compression for tiny files (< 200 KB) and non-resizable formats
    if (file.size < 200 * 1024) return file;
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

    const dataUrl = await readAsDataURL(file);
    const img = await loadImage(dataUrl);

    let { width, height } = img;
    const longest = Math.max(width, height);
    if (longest > maxDim) {
      const scale = maxDim / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
    const outType = hasAlpha ? 'image/png' : 'image/jpeg';

    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve, outType, hasAlpha ? undefined : quality)
    );

    if (!blob) return file;

    // If compression made it bigger (rare), keep the original
    if (blob.size >= file.size) return file;

    const ext = outType === 'image/png' ? 'png' : 'jpg';
    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, { type: outType, lastModified: Date.now() });
  } catch (err) {
    console.warn('Image compression failed, uploading original:', err);
    return file;
  }
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
