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

    // Log original file size
    const originalSizeKB = (file.size / 1024).toFixed(2);
    console.log(`[壓縮] 原始檔案: ${file.name}, 大小: ${originalSizeKB} KB`);

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        console.log(`[壓縮] 原始尺寸: ${width} x ${height}`);

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
          console.log(`[壓縮] 調整後尺寸: ${width} x ${height}`);
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

        // Fill with page background color (#FDFBF7 - Warm Paper)
        // This matches the website background for seamless integration
        ctx.fillStyle = '#FDFBF7';
        ctx.fillRect(0, 0, width, height);

        // Draw image on top of background
        ctx.drawImage(img, 0, 0, width, height);

        // Always convert to JPEG for better compression
        const mimeType = 'image/jpeg';
        console.log(`[壓縮] 輸出格式: ${mimeType} (背景色: #FDFBF7)`);

        const compressedDataUrl = canvas.toDataURL(mimeType, quality);

        // Calculate compressed size
        const compressedSizeKB = ((compressedDataUrl.length * 3) / 4 / 1024).toFixed(2);
        const ratio = ((parseFloat(compressedSizeKB) / parseFloat(originalSizeKB)) * 100).toFixed(1);
        console.log(`[壓縮] 壓縮後大小: ${compressedSizeKB} KB (${ratio}% of original)`);
        console.log(`[壓縮] 節省空間: ${(parseFloat(originalSizeKB) - parseFloat(compressedSizeKB)).toFixed(2)} KB`);

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

    // Calculate original size
    const originalSizeKB = ((dataUrl.length * 3) / 4 / 1024).toFixed(2);
    console.log(`[重新壓縮] 原始大小: ${originalSizeKB} KB`);

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      console.log(`[重新壓縮] 原始尺寸: ${width} x ${height}`);

      const shouldResize = width > maxWidth;
      if (shouldResize) {
        height = (height * maxWidth) / width;
        width = maxWidth;
        console.log(`[重新壓縮] 調整後尺寸: ${width} x ${height}`);
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

      // Check if original image is PNG
      const isPNG = dataUrl.startsWith('data:image/png');
      if (isPNG) {
        console.log(`[重新壓縮] 原始格式: PNG，強制轉換為 JPEG 以壓縮`);
      }

      // Fill with page background color (#FDFBF7 - Warm Paper)
      // This matches the website background for seamless integration
      ctx.fillStyle = '#FDFBF7';
      ctx.fillRect(0, 0, width, height);

      // Draw image on top of background
      ctx.drawImage(img, 0, 0, width, height);

      console.log(`[重新壓縮] 輸出格式: JPEG (quality: ${quality}, 背景色: #FDFBF7)`);

      // Convert to JPEG with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      const compressedSizeKB = ((compressedDataUrl.length * 3) / 4 / 1024).toFixed(2);
      const ratio = ((parseFloat(compressedSizeKB) / parseFloat(originalSizeKB)) * 100).toFixed(1);
      const savedKB = (parseFloat(originalSizeKB) - parseFloat(compressedSizeKB)).toFixed(2);
      console.log(`[重新壓縮] 壓縮後大小: ${compressedSizeKB} KB (${ratio}% of original)`);
      console.log(`[重新壓縮] ✅ 節省空間: ${savedKB} KB`);

      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

// Note: Transparency checking function removed
// All images are now converted to JPEG with page background color (#FDFBF7)
// for optimal compression while maintaining visual consistency with the page
