/**
 * Compresses an image file to reduce storage size
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param quality - Image quality 0-1 (default: 0.85)
 * @returns Promise with compressed image as base64 data URL
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        // Use JPEG for photos, keep PNG for images with transparency
        const mimeType = file.type === 'image/png' && hasTransparency(ctx, width, height)
          ? 'image/png'
          : 'image/jpeg';

        const compressedDataUrl = canvas.toDataURL(mimeType, quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 image (for already uploaded images)
 * @param dataUrl - The existing base64 data URL
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param quality - Image quality 0-1 (default: 0.85)
 * @returns Promise with compressed image as base64 data URL
 */
export async function compressExistingImage(
  dataUrl: string,
  maxWidth: number = 800,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      const shouldResize = width > maxWidth;
      if (shouldResize) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Check if original image is PNG (likely has transparency)
      const isPNG = dataUrl.startsWith('data:image/png');

      // If converting from PNG to JPEG, fill with white background
      // Otherwise transparent areas become black
      if (isPNG) {
        // Check if image actually has transparency
        ctx.drawImage(img, 0, 0, width, height);
        const hasAlpha = hasTransparency(ctx, width, height);

        if (hasAlpha) {
          // Keep as PNG to preserve transparency
          const compressedDataUrl = canvas.toDataURL('image/png', quality);
          resolve(compressedDataUrl);
          return;
        }

        // No transparency, can safely convert to JPEG with white background
        // Clear and redraw with white background
        ctx.clearRect(0, 0, width, height);
      }

      // Fill with white background before drawing (for JPEG conversion)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

/**
 * Check if image has transparency
 */
function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Check alpha channel of some pixels (sampling for performance)
    for (let i = 3; i < data.length; i += 400) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch (e) {
    // If we can't check, assume it has transparency to be safe
    return true;
  }
}
