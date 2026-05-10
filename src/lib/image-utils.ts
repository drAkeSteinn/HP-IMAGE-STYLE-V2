/**
 * Resize an image (given as a data URL) so its longest side is at most `maxSize` pixels.
 * Returns a JPEG data URL with the resized image.
 * If the image is already within the limit, returns it unchanged (converted to JPEG for consistency).
 */
export function resizeImageToMaxSize(
  dataUrl: string,
  maxSize: number = 600
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const longestSide = Math.max(width, height);

      // No resize needed if already within limit
      if (longestSide <= maxSize) {
        // Still convert to JPEG for consistency
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } else {
          resolve(dataUrl);
        }
        return;
      }

      const scale = maxSize / longestSide;
      const newWidth = Math.round(width * scale);
      const newHeight = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      // If image fails to load, return original
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}
