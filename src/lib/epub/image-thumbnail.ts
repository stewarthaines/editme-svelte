/**
 * Downscales an arbitrary raster (or SVG) image to a PNG thumbnail using a
 * browser canvas. Aspect ratio is preserved; the longer edge is capped at
 * maxDim. Used to write small cover thumbnails into the publish output for the
 * OPDS catalog. Must be called in a window context.
 */
export async function resizeImageToPng(
  buffer: ArrayBuffer,
  mediaType: string,
  maxDim = 256
): Promise<ArrayBuffer> {
  const blob = new Blob([buffer], { type: mediaType || 'image/png' });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });

    // Intrinsic size; SVGs without width/height fall back to maxDim so we still
    // produce a sensibly-sized raster.
    const naturalW = img.naturalWidth || maxDim;
    const naturalH = img.naturalHeight || maxDim;
    const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
    const w = Math.max(1, Math.round(naturalW * scale));
    const h = Math.max(1, Math.round(naturalH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    ctx.drawImage(img, 0, 0, w, h);

    return await new Promise<ArrayBuffer>((resolve, reject) => {
      canvas.toBlob(b => {
        if (!b) return reject(new Error('PNG conversion failed'));
        b.arrayBuffer().then(resolve, reject);
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
