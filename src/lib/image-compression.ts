/**
 * Smart WebP Image Compression Utility
 * Resizes and compresses uploaded dental photos, X-rays, logos, and receipts.
 * Achieves ~90-95% file size reduction (e.g. 10MB -> 200KB) while retaining sharp visual quality.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.85)
  format?: "image/webp" | "image/jpeg";
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: "image/webp",
};

/**
 * Formats byte size into human-readable text (e.g., 2.4 MB, 185 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Compresses an image File object in the browser using HTML5 Canvas & WebP encoding
 */
export async function compressImage(
  file: File,
  customOptions?: CompressionOptions,
): Promise<{
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  // Skip compression for non-image files or SVG
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  // Skip re-compressing small images under 150KB
  if (file.size < 150 * 1024 && file.type === "image/webp") {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate constrained dimensions preserving aspect ratio
      let { width, height } = img;
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1920;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context"));
        return;
      }

      // Smooth image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = options.format || "image/webp";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression blob creation failed"));
            return;
          }

          const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const compressedFile = new File([blob], fileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          const dataUrl = canvas.toDataURL(mimeType, options.quality);

          resolve({
            file: compressedFile,
            dataUrl,
            originalSize: file.size,
            compressedSize: blob.size,
          });
        },
        mimeType,
        options.quality,
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses a Data URL string into WebP format
 */
export async function compressDataUrl(
  dataUrl: string,
  customOptions?: CompressionOptions,
): Promise<string> {
  const options = { ...DEFAULT_OPTIONS, ...customOptions };

  if (!dataUrl || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      const maxWidth = options.maxWidth || 1920;
      const maxHeight = options.maxHeight || 1920;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = options.format || "image/webp";
      const compressedDataUrl = canvas.toDataURL(mimeType, options.quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
